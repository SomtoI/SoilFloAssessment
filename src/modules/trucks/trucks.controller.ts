import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { TrucksService } from './trucks.service';

@ApiTags('trucks')
@Controller('trucks')
export class TrucksController {
  constructor(private readonly trucksService: TrucksService) {}

  @Get()
  @ApiOperation({ summary: 'List all trucks' })
  findAll() {
    return this.trucksService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a truck by ID' })
  @ApiParam({ name: 'id', type: Number })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.trucksService.findOne(id);
  }
}
