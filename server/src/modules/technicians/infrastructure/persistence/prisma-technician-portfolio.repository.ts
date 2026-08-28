import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/persistence/prisma/prisma.service';
import {
  TechnicianPortfolioItem,
  TechnicianPortfolioRepositoryPort,
} from '../../domain/technician-portfolio.repository.port';

function toDomain(row: any): TechnicianPortfolioItem {
  return { id: row.id, technicianId: row.technicianId, key: row.key, caption: row.caption, position: row.position };
}

@Injectable()
export class PrismaTechnicianPortfolioRepository implements TechnicianPortfolioRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async create(technicianId: string, key: string, caption: string | null): Promise<TechnicianPortfolioItem> {
    const count = await this.prisma.technicianPortfolioItem.count({ where: { technicianId } });
    const row = await this.prisma.technicianPortfolioItem.create({
      data: { technicianId, key, caption, position: count },
    });
    return toDomain(row);
  }

  async findAllByTechnicianId(technicianId: string): Promise<TechnicianPortfolioItem[]> {
    const rows = await this.prisma.technicianPortfolioItem.findMany({
      where: { technicianId },
      orderBy: { position: 'asc' },
    });
    return rows.map(toDomain);
  }

  async delete(id: string, technicianId: string): Promise<boolean> {
    const { count } = await this.prisma.technicianPortfolioItem.deleteMany({ where: { id, technicianId } });
    return count > 0;
  }
}
