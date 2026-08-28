import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/persistence/prisma/prisma.service';
import {
  TechnicianPricingItem,
  TechnicianPricingRepositoryPort,
} from '../../domain/technician-pricing.repository.port';

function toDomain(row: any): TechnicianPricingItem {
  return { id: row.id, technicianId: row.technicianId, label: row.label, price: Number(row.price), position: row.position };
}

@Injectable()
export class PrismaTechnicianPricingRepository implements TechnicianPricingRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async create(technicianId: string, label: string, price: number): Promise<TechnicianPricingItem> {
    const count = await this.prisma.technicianPricingItem.count({ where: { technicianId } });
    const row = await this.prisma.technicianPricingItem.create({
      data: { technicianId, label, price, position: count },
    });
    return toDomain(row);
  }

  async findAllByTechnicianId(technicianId: string): Promise<TechnicianPricingItem[]> {
    const rows = await this.prisma.technicianPricingItem.findMany({
      where: { technicianId },
      orderBy: { position: 'asc' },
    });
    return rows.map(toDomain);
  }

  async delete(id: string, technicianId: string): Promise<boolean> {
    const { count } = await this.prisma.technicianPricingItem.deleteMany({ where: { id, technicianId } });
    return count > 0;
  }
}
