import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TicketsService } from './tickets.service';
import { CreateTicketsBulkDto } from './dto/create-tickets-bulk.dto';
import { GetTicketsQueryDto } from './dto/get-tickets-query.dto';
import { BulkCreateResponseDto, PaginatedTicketsResponseDto } from './dto/ticket-response.dto';
import { ApiBulkCreateTickets, ApiListTickets } from './tickets.decorators';

@ApiTags('tickets')
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post('bulk')
  @ApiBulkCreateTickets()
  createBulk(@Body() dto: CreateTicketsBulkDto): Promise<BulkCreateResponseDto> {
    return this.ticketsService.createBulk(dto);
  }

  @Get()
  @ApiListTickets()
  findAll(@Query() query: GetTicketsQueryDto): Promise<PaginatedTicketsResponseDto> {
    return this.ticketsService.findAll(query);
  }
}
