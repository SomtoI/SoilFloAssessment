import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SitesService } from './sites.service';
import { ApiGetSite } from './sites.decorators';

@ApiTags('sites')
@Controller('sites')
export class SitesController {
  constructor(private readonly sitesService: SitesService) {}

  @Get(':id')
  @ApiGetSite()
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.sitesService.findOne(id);
  }
}
