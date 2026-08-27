import { Module } from '@nestjs/common';
import { RegionsController } from './infrastructure/http/regions.controller';
import { REGION_REPOSITORY } from './domain/region.repository.port';
import { PrismaRegionRepository } from './infrastructure/persistence/prisma-region.repository';

@Module({
  controllers: [RegionsController],
  providers: [{ provide: REGION_REPOSITORY, useClass: PrismaRegionRepository }],
})
export class RegionsModule {}
