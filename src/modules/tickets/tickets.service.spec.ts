import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { PrismaService } from '../../prisma/prisma.service';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TRUCK_ID = 1;
const SITE_ID = 10;

const mockTruck = {
  id: TRUCK_ID,
  license: 'kdd7yh',
  siteId: SITE_ID,
  site: { id: SITE_ID, name: 'ZILCH', address: '123 St', description: 'desc' },
};

const baseTicket = {
  id: 1,
  ticketNumber: 1,
  material: 'Soil',
  dispatchedAt: new Date('2024-01-15T08:30:00.000Z'),
  truckId: TRUCK_ID,
  siteId: SITE_ID,
  truck: { license: 'kdd7yh' },
  site: { name: 'ZILCH' },
};

function makeTicket(overrides: Partial<typeof baseTicket> = {}) {
  return { ...baseTicket, ...overrides };
}

// A mock PrismaService where each method can be overridden per test.
function buildPrismaMock() {
  return {
    truck: {
      findUnique: jest.fn(),
    },
    ticket: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      createMany: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
    },
    $transaction: jest.fn(),
  };
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('TicketsService', () => {
  let service: TicketsService;
  let prismaMock: ReturnType<typeof buildPrismaMock>;

  beforeEach(async () => {
    prismaMock = buildPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<TicketsService>(TicketsService);
  });

  // =========================================================================
  // createBulk — validation before DB
  // =========================================================================

  describe('createBulk — pre-DB validation', () => {
    it('throws NotFoundException when truck does not exist', async () => {
      prismaMock.truck.findUnique.mockResolvedValue(null);

      await expect(
        service.createBulk({
          truckId: 999,
          tickets: [{ dispatchedAt: '2024-01-15T08:00:00.000Z' }],
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws UnprocessableEntityException for a future timestamp', async () => {
      prismaMock.truck.findUnique.mockResolvedValue(mockTruck);

      const future = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      await expect(
        service.createBulk({ truckId: TRUCK_ID, tickets: [{ dispatchedAt: future }] }),
      ).rejects.toBeInstanceOf(UnprocessableEntityException);
    });

    it('accepts a timestamp within the 60-second tolerance window', async () => {
      // 30 seconds in the future — within tolerance, should not throw here.
      // We mock $transaction to avoid needing a real DB.
      prismaMock.truck.findUnique.mockResolvedValue(mockTruck);
      const withinTolerance = new Date(Date.now() + 30 * 1000).toISOString();

      const ticket = makeTicket({ dispatchedAt: new Date(withinTolerance) });
      prismaMock.$transaction.mockImplementation(async (fn: Function) =>
        fn({
          ticket: {
            findFirst: jest.fn().mockResolvedValue(null),
            aggregate: jest.fn().mockResolvedValue({ _max: { ticketNumber: null } }),
            createMany: jest.fn(),
            findMany: jest.fn().mockResolvedValue([ticket]),
          },
        }),
      );

      await expect(
        service.createBulk({ truckId: TRUCK_ID, tickets: [{ dispatchedAt: withinTolerance }] }),
      ).resolves.toBeDefined();
    });

    it('throws ConflictException for duplicate dispatchedAt within the same batch', async () => {
      prismaMock.truck.findUnique.mockResolvedValue(mockTruck);

      const time = '2024-01-15T08:00:00.000Z';

      await expect(
        service.createBulk({
          truckId: TRUCK_ID,
          tickets: [{ dispatchedAt: time }, { dispatchedAt: time }],
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('treats timestamps representing the same UTC moment as duplicates even if formatted differently', async () => {
      prismaMock.truck.findUnique.mockResolvedValue(mockTruck);

      // These are the same moment expressed in different offsets.
      const utc = '2024-01-15T08:00:00.000Z';
      const offsetEquivalent = '2024-01-15T09:00:00.000+01:00';

      await expect(
        service.createBulk({
          truckId: TRUCK_ID,
          tickets: [{ dispatchedAt: utc }, { dispatchedAt: offsetEquivalent }],
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  // =========================================================================
  // createBulk — inside transaction
  // =========================================================================

  describe('createBulk — transaction behaviour', () => {
    const pastTime = '2024-01-15T08:00:00.000Z';

    function mockTransaction(txOverrides: Record<string, unknown> = {}) {
      prismaMock.$transaction.mockImplementation(async (fn: Function) =>
        fn({
          ticket: {
            findFirst: jest.fn().mockResolvedValue(null),
            aggregate: jest.fn().mockResolvedValue({ _max: { ticketNumber: null } }),
            createMany: jest.fn(),
            findMany: jest.fn().mockResolvedValue([makeTicket()]),
            ...txOverrides,
          },
        }),
      );
    }

    beforeEach(() => {
      prismaMock.truck.findUnique.mockResolvedValue(mockTruck);
    });

    it('throws ConflictException when a matching ticket already exists in the DB', async () => {
      prismaMock.$transaction.mockImplementation(async (fn: Function) =>
        fn({
          ticket: {
            findFirst: jest.fn().mockResolvedValue(makeTicket()),
            aggregate: jest.fn(),
            createMany: jest.fn(),
            findMany: jest.fn(),
          },
        }),
      );

      await expect(
        service.createBulk({ truckId: TRUCK_ID, tickets: [{ dispatchedAt: pastTime }] }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('starts ticket numbering at 1 when no tickets exist for the site (MAX is null)', async () => {
      let capturedData: { ticketNumber: number }[] = [];

      prismaMock.$transaction.mockImplementation(async (fn: Function) =>
        fn({
          ticket: {
            findFirst: jest.fn().mockResolvedValue(null),
            aggregate: jest.fn().mockResolvedValue({ _max: { ticketNumber: null } }),
            createMany: jest.fn().mockImplementation(({ data }: { data: typeof capturedData }) => {
              capturedData = data;
            }),
            findMany: jest.fn().mockResolvedValue([makeTicket({ ticketNumber: 1 })]),
          },
        }),
      );

      await service.createBulk({ truckId: TRUCK_ID, tickets: [{ dispatchedAt: pastTime }] });

      expect(capturedData[0].ticketNumber).toBe(1);
    });

    it('increments ticket numbers from the current site maximum', async () => {
      let capturedData: { ticketNumber: number }[] = [];

      prismaMock.$transaction.mockImplementation(async (fn: Function) =>
        fn({
          ticket: {
            findFirst: jest.fn().mockResolvedValue(null),
            aggregate: jest.fn().mockResolvedValue({ _max: { ticketNumber: 5 } }),
            createMany: jest.fn().mockImplementation(({ data }: { data: typeof capturedData }) => {
              capturedData = data;
            }),
            findMany: jest.fn().mockResolvedValue([
              makeTicket({ ticketNumber: 6 }),
              makeTicket({ ticketNumber: 7, id: 2 }),
            ]),
          },
        }),
      );

      const times = ['2024-01-15T08:00:00.000Z', '2024-01-15T09:00:00.000Z'];
      await service.createBulk({
        truckId: TRUCK_ID,
        tickets: times.map((dispatchedAt) => ({ dispatchedAt })),
      });

      expect(capturedData[0].ticketNumber).toBe(6);
      expect(capturedData[1].ticketNumber).toBe(7);
    });

    it('returns the created count and mapped response shape', async () => {
      mockTransaction();

      const result = await service.createBulk({
        truckId: TRUCK_ID,
        tickets: [{ dispatchedAt: pastTime }],
      });

      expect(result.created).toBe(1);
      expect(result.tickets[0]).toMatchObject({
        siteName: 'ZILCH',
        truckLicense: 'kdd7yh',
        material: 'Soil',
      });
      expect(typeof result.tickets[0].dispatchedAt).toBe('string');
    });
  });

  // =========================================================================
  // findAll — query filters
  // =========================================================================

  describe('findAll', () => {
    beforeEach(() => {
      prismaMock.$transaction.mockResolvedValue([0, []]);
    });

    it('throws UnprocessableEntityException when from is after to', async () => {
      await expect(
        service.findAll({
          from: '2024-02-01T00:00:00.000Z',
          to: '2024-01-01T00:00:00.000Z',
          page: 1,
          limit: 50,
        }),
      ).rejects.toBeInstanceOf(UnprocessableEntityException);
    });

    it('uses skip = (page - 1) * limit for correct pagination offset', async () => {
      let capturedArgs: { skip: number; take: number } | undefined;

      prismaMock.$transaction.mockImplementation(
        async (queries: [Promise<number>, Promise<unknown>]) => {
          // Capture the findMany call args by inspecting the transaction array.
          // We resolve both queries, checking the second (findMany) arguments.
          return Promise.all(queries);
        },
      );

      // Spy on ticket.findMany to capture skip/take
      prismaMock.ticket.count = jest.fn().mockResolvedValue(0);
      prismaMock.ticket.findMany = jest.fn().mockImplementation((args: typeof capturedArgs) => {
        capturedArgs = args;
        return Promise.resolve([]);
      });

      prismaMock.$transaction.mockImplementation(
        async (queries: [ReturnType<typeof prismaMock.ticket.count>, ReturnType<typeof prismaMock.ticket.findMany>]) =>
          Promise.all(queries),
      );

      await service.findAll({ page: 3, limit: 10 });

      // Page 3 with limit 10: skip should be (3-1)*10 = 20, not 3*10 = 30
      expect(capturedArgs).toMatchObject({ skip: 20, take: 10 });
    });

    it('returns paginated response shape', async () => {
      prismaMock.$transaction.mockResolvedValue([
        5,
        [makeTicket()],
      ]);

      const result = await service.findAll({ page: 1, limit: 50 });

      expect(result.total).toBe(5);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(50);
      expect(result.data).toHaveLength(1);
    });

    it('applies no site filter when siteIds is omitted', async () => {
      let capturedWhere: Record<string, unknown> | undefined;

      prismaMock.$transaction.mockImplementation(
        async (queries: [ReturnType<typeof prismaMock.ticket.count>, ReturnType<typeof prismaMock.ticket.findMany>]) =>
          Promise.all(queries),
      );
      prismaMock.ticket.count = jest.fn().mockResolvedValue(0);
      prismaMock.ticket.findMany = jest.fn().mockImplementation((args: { where: typeof capturedWhere }) => {
        capturedWhere = args.where;
        return Promise.resolve([]);
      });

      await service.findAll({ page: 1, limit: 50 });

      expect(capturedWhere).not.toHaveProperty('siteId');
    });

    it('applies site filter when siteIds is provided', async () => {
      let capturedWhere: Record<string, unknown> | undefined;

      prismaMock.$transaction.mockImplementation(
        async (queries: [ReturnType<typeof prismaMock.ticket.count>, ReturnType<typeof prismaMock.ticket.findMany>]) =>
          Promise.all(queries),
      );
      prismaMock.ticket.count = jest.fn().mockResolvedValue(0);
      prismaMock.ticket.findMany = jest.fn().mockImplementation((args: { where: typeof capturedWhere }) => {
        capturedWhere = args.where;
        return Promise.resolve([]);
      });

      await service.findAll({ siteIds: [1, 11], page: 1, limit: 50 });

      expect(capturedWhere).toMatchObject({ siteId: { in: [1, 11] } });
    });
  });
});
