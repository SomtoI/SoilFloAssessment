import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsInt,
  IsPositive,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';

export class TicketItemDto {
  @ApiProperty({
    description: 'ISO 8601 UTC timestamp of when the load was dispatched',
    example: '2024-01-15T08:30:00.000Z',
  })
  @IsDateString()
  dispatchedAt!: string;
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
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => TicketItemDto)
  tickets!: TicketItemDto[];
}
