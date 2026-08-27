import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/persistence/prisma/prisma.service';
import { Availability } from '../../domain/availability.entity';
import {
  AvailabilityRepositoryPort,
  CreateAvailabilityData,
} from '../../domain/availability.repository.port';

function toDomain(row: any): Availability {
  return new Availability(row.id, row.technicianId, row.startDatetime, row.endDatetime, row.isBooked);
}

@Injectable()
export class PrismaAvailabilityRepository implements AvailabilityRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Availability | null> {
    const row = await this.prisma.availability.findUnique({ where: { id } });
    return row ? toDomain(row) : null;
  }

  async findByTechnicianId(technicianId: string): Promise<Availability[]> {
    const rows = await this.prisma.availability.findMany({
      where: { technicianId },
      orderBy: { startDatetime: 'asc' },
    });
    return rows.map(toDomain);
  }

  async create(data: CreateAvailabilityData): Promise<Availability> {
    const row = await this.prisma.availability.create({ data });
    return toDomain(row);
  }

  async update(id: string, data: Partial<CreateAvailabilityData>): Promise<Availability> {
    const row = await this.prisma.availability.update({ where: { id }, data });
    return toDomain(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.availability.delete({ where: { id } });
  }
}
