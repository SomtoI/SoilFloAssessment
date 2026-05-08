import { Injectable, NotFoundException, ConflictException, UnprocessableEntityException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTicketsBulkDto } from './dto/create-tickets-bulk.dto';
import { GetTicketsQueryDto } from './dto/get-tickets-query.dto';
import { Prisma } from '@prisma/client';

// A ticket dispatched more than this many seconds in the future is rejected.
// A small buffer accounts for minor client clock drift.
const FUTURE_TOLERANCE_SECONDS = 60;

@Injectable()
export class TicketsService {
  private readonly logger = new Logger(TicketsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createBulk(dto: CreateTicketsBulkDto) {
    const now = new Date();
    const cutoff = new Date(now.getTime() + FUTURE_TOLERANCE_SECONDS * 1000);

    // Resolve the truck and its site in one query.
    const truck = await this.prisma.truck.findUnique({
      where: { id: dto.truckId },
      include: { site: true },
    });
    if (!truck) throw new NotFoundException(`Truck ${dto.truckId} not found`);

    // Normalize all incoming timestamps to UTC Date objects once upfront.
    const dispatchTimes = dto.tickets.map((t) => new Date(t.dispatchedAt));

    this.validateNoFutureDates(dispatchTimes, cutoff);
    this.validateNoDuplicatesInBatch(dispatchTimes);

    const created = await this.prisma.$transaction(async (tx) => {
      await this.assertNoConflictsWithExisting(tx, dto.truckId, dispatchTimes);

      const nextTicketNumber = await this.getNextTicketNumber(tx, truck.siteId);

      const ticketData: Prisma.TicketCreateManyInput[] = dto.tickets.map((ticket, index) => ({
        truckId: dto.truckId,
        siteId: truck.siteId,
        dispatchedAt: dispatchTimes[index],
        ticketNumber: nextTicketNumber + index,
        material: ticket.material,
      }));

      await tx.ticket.createMany({ data: ticketData });

      return tx.ticket.findMany({
        where: {
          truckId: dto.truckId,
          dispatchedAt: { in: dispatchTimes },
        },
        include: {
          truck: { select: { license: true } },
          site: { select: { name: true } },
        },
        orderBy: { ticketNumber: 'asc' },
      });
    });

    const response = {
      created: created.length,
      tickets: created.map(this.toResponseShape),
    };

    this.logger.log(`Truck ${dto.truckId} dispatched ${response.created} ticket(s) for site ${truck.siteId}`);

    return response;
  }

  async findAll(query: GetTicketsQueryDto) {
    if (query.from && query.to && new Date(query.from) > new Date(query.to)) {
      throw new UnprocessableEntityException('`from` must not be after `to`');
    }

    const where: Prisma.TicketWhereInput = {};

    if (query.siteIds && query.siteIds.length > 0) {
      where.siteId = { in: query.siteIds };
    }

    if (query.from ?? query.to) {
      where.dispatchedAt = {
        ...(query.from ? { gte: new Date(query.from) } : {}),
        ...(query.to ? { lte: new Date(query.to) } : {}),
      };
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const skip = (page - 1) * limit;

    const [total, tickets] = await this.prisma.$transaction([
      this.prisma.ticket.count({ where }),
      this.prisma.ticket.findMany({
        where,
        include: {
          truck: { select: { license: true } },
          site: { select: { name: true } },
        },
        orderBy: [{ dispatchedAt: 'desc' }, { id: 'desc' }],
        skip,
        take: limit,
      }),
    ]);

    return {
      data: tickets.map(this.toResponseShape),
      total,
      page,
      limit,
    };
  }

  // --- private helpers ---

  private validateNoFutureDates(times: Date[], cutoff: Date) {
    const future = times.filter((t) => t > cutoff);
    if (future.length > 0) {
      throw new UnprocessableEntityException(
        `Tickets cannot be dispatched in the future: ${future.map((t) => t.toISOString()).join(', ')}`,
      );
    }
  }

  private validateNoDuplicatesInBatch(times: Date[]) {
    const seen = new Set<number>();
    for (const t of times) {
      const ms = t.getTime();
      if (seen.has(ms)) {
        throw new ConflictException(`Duplicate dispatchedAt within request: ${t.toISOString()}`);
      }
      seen.add(ms);
    }
  }

  private async assertNoConflictsWithExisting(tx: Prisma.TransactionClient, truckId: number, times: Date[]) {
    const existing = await tx.ticket.findFirst({
      where: { truckId, dispatchedAt: { in: times } },
      select: { dispatchedAt: true },
    });
    if (existing) {
      throw new ConflictException(
        `A ticket for truck ${truckId} already exists at ${existing.dispatchedAt.toISOString()}`,
      );
    }
  }

  private async getNextTicketNumber(tx: Prisma.TransactionClient, siteId: number): Promise<number> {
    const result = await tx.ticket.aggregate({
      where: { siteId },
      _max: { ticketNumber: true },
    });
    // COALESCE equivalent: if no tickets exist yet, start at 1.
    return (result._max.ticketNumber ?? 0) + 1;
  }

  private toResponseShape(ticket: {
    id: number;
    ticketNumber: number;
    material: string;
    dispatchedAt: Date;
    truck: { license: string };
    site: { name: string };
  }) {
    return {
      id: ticket.id,
      siteName: ticket.site.name,
      truckLicense: ticket.truck.license,
      ticketNumber: ticket.ticketNumber,
      dispatchedAt: ticket.dispatchedAt.toISOString(),
      material: ticket.material,
    };
  }
}
