import { ApiProperty } from '@nestjs/swagger';

export class TicketResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'ZILCH', description: 'Name of the dispatch site' })
  siteName!: string;

  @ApiProperty({ example: 'kdd7yh', description: 'Truck license plate' })
  truckLicense!: string;

  @ApiProperty({ example: 42, description: 'Ticket number — unique per site' })
  ticketNumber!: number;

  @ApiProperty({ example: '2024-01-15T08:30:00.000Z' })
  dispatchedAt!: string;

  @ApiProperty({ example: 'Soil' })
  material!: string;
}

export class BulkCreateResponseDto {
  @ApiProperty({ example: 3, description: 'Number of tickets created' })
  created!: number;

  @ApiProperty({ type: [TicketResponseDto] })
  tickets!: TicketResponseDto[];
}

export class PaginatedTicketsResponseDto {
  @ApiProperty({ type: [TicketResponseDto] })
  data!: TicketResponseDto[];

  @ApiProperty({ example: 120, description: 'Total number of matching tickets' })
  total!: number;

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 50 })
  limit!: number;
}
