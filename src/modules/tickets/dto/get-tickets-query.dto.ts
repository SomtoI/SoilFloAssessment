import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, Max, Min } from 'class-validator';

export class GetTicketsQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by site IDs (comma-separated)',
    example: '1,11,21',
  })
  @IsOptional()
  @Transform(({ value }: { value: string }) =>
    String(value)
      .split(',')
      .map((v) => parseInt(v.trim(), 10))
      .filter((n) => !isNaN(n)),
  )
  @IsInt({ each: true })
  siteIds?: number[];

  @ApiPropertyOptional({
    description: 'Start of date range (ISO 8601)',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({
    description: 'End of date range (ISO 8601)',
    example: '2024-01-31T23:59:59.999Z',
  })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({ description: 'Page number (1-indexed)', default: 1, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Results per page', default: 50, minimum: 1, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 50;
}
