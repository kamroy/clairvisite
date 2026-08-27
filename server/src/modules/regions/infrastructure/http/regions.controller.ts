import { Controller, Get, Inject } from '@nestjs/common';
import { REGION_REPOSITORY, RegionRepositoryPort } from '../../domain/region.repository.port';

@Controller('regions')
export class RegionsController {
  constructor(@Inject(REGION_REPOSITORY) private readonly regions: RegionRepositoryPort) {}

  @Get()
  list() {
    return this.regions.findAll();
  }
}
