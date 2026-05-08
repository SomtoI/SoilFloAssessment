import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

export const ApiGetTruck = () =>
  applyDecorators(
    ApiOperation({ summary: 'Get a truck by ID' }),
    ApiParam({ name: 'id', type: Number }),
    ApiResponse({
      status: 200,
      schema: { example: { id: 1, license: 'ABC-1234', siteId: 1, site: { id: 1, name: 'Site A' } } },
    }),
    ApiResponse({ status: 404, description: 'Truck not found' }),
  );
