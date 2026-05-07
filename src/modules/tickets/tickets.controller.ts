import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { TicketsService } from './tickets.service';
import { CreateTicketsBulkDto } from './dto/create-tickets-bulk.dto';
import { GetTicketsQueryDto } from './dto/get-tickets-query.dto';
import { BulkCreateResponseDto, PaginatedTicketsResponseDto } from './dto/ticket-response.dto';

@ApiTags('tickets')
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post('bulk')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create tickets in bulk for a truck',
    description:
      'All tickets are created atomically — if any validation fails, none are created. ' +
      'Two tickets cannot share the same dispatch time for the same truck. ' +
      'Dispatch times cannot be in the future.',
  })
  @ApiResponse({ status: 201, type: BulkCreateResponseDto })
  @ApiResponse({ status: 404, description: 'Truck not found' })
  @ApiResponse({ status: 409, description: 'Duplicate dispatch time' })
  @ApiResponse({ status: 422, description: 'Future dispatch time or invalid date range' })
  createBulk(@Body() dto: CreateTicketsBulkDto): Promise<BulkCreateResponseDto> {
    return this.ticketsService.createBulk(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'List tickets with optional filters',
    description: 'Filter by site(s) and/or date range. Results are paginated.',
  })
  @ApiResponse({ status: 200, type: PaginatedTicketsResponseDto })
  @ApiResponse({ status: 422, description: '`from` is after `to`' })
  findAll(@Query() query: GetTicketsQueryDto): Promise<PaginatedTicketsResponseDto> {
    return this.ticketsService.findAll(query);
  }
}
