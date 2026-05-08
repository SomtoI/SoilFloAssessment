import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TrucksService } from './trucks.service';
import { ApiGetTruck } from './trucks.decorators';

@ApiTags('trucks')
@Controller('trucks')
export class TrucksController {
  constructor(private readonly trucksService: TrucksService) {}

  @Get(':id')
  @ApiGetTruck()
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.trucksService.findOne(id);
  }
}
