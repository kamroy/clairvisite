import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/persistence/prisma/prisma.service';
import { RegionRepositoryPort } from '../../domain/region.repository.port';

@Injectable()
export class PrismaRegionRepository implements RegionRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.region.findMany({ orderBy: { name: 'asc' } });
  }
}
