import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BulkCreateResponseDto, PaginatedTicketsResponseDto } from './dto/ticket-response.dto';

export const ApiBulkCreateTickets = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Create tickets in bulk for a truck',
      description:
        'All tickets are created atomically — if any validation fails, none are created. ' +
        'Two tickets cannot share the same dispatch time for the same truck. ' +
        'Dispatch times cannot be in the future. Maximum 50 tickets per request.',
    }),
    ApiResponse({ status: 201, type: BulkCreateResponseDto }),
    ApiResponse({ status: 404, description: 'Truck not found' }),
    ApiResponse({ status: 409, description: 'Duplicate dispatch time' }),
    ApiResponse({ status: 400, description: 'Batch exceeds 50 tickets' }),
    ApiResponse({ status: 422, description: 'Future dispatch time or invalid date range' }),
  );

export const ApiListTickets = () =>
  applyDecorators(
    ApiOperation({
      summary: 'List tickets with optional filters',
      description: 'Filter by site(s) and/or date range. Results are paginated.',
    }),
    ApiResponse({ status: 200, type: PaginatedTicketsResponseDto }),
    ApiResponse({ status: 422, description: '`from` is after `to`' }),
  );
