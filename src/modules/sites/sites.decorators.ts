import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

export const ApiGetSite = () =>
  applyDecorators(
    ApiOperation({ summary: 'Get a site by ID' }),
    ApiParam({ name: 'id', type: Number }),
    ApiResponse({
      status: 200,
      schema: { example: { id: 1, name: 'Site A', address: '123 Main St', description: 'Primary site' } },
    }),
    ApiResponse({ status: 404, description: 'Site not found' }),
  );
