import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { Material } from './material.enum';

export class TicketItemDto {
  @ApiProperty({
    description: 'ISO 8601 UTC timestamp of when the load was dispatched',
    example: '2024-01-15T08:30:00.000Z',
  })
  @IsDateString()
  dispatchedAt!: string;

  @ApiPropertyOptional({
    enum: Material,
    default: Material.Soil,
    description: 'Material being dispatched',
  })
  @IsOptional()
  @IsEnum(Material)
  material?: Material = Material.Soil;
}

export class CreateTicketsBulkDto {
  @ApiProperty({ description: 'ID of the truck dispatching the load', example: 1 })
  @IsInt()
  @IsPositive()
  truckId!: number;

  @ApiProperty({
    type: [TicketItemDto],
    description: 'List of tickets to create. All succeed or none do.',
    minItems: 1,
    maxItems: 50,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => TicketItemDto)
  tickets!: TicketItemDto[];
}
