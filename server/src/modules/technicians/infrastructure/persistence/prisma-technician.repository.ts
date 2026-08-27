import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/persistence/prisma/prisma.service';
import { PageResult, toPageResult } from '../../../../common/pagination';
import { Technician, TechnicianStatus } from '../../domain/technician.entity';
import {
  AvailableSlot,
  TechnicianDetail,
  TechnicianRepositoryPort,
  TechnicianSearchCriteria,
  TechnicianSearchResult,
  UpsertTechnicianProfileData,
} from '../../domain/technician.repository.port';

function toDomain(row: any): Technician {
  return new Technician(
    row.id,
    row.userId,
    row.phone,
    row.specialties,
    row.regions,
    row.hourlyRate ? Number(row.hourlyRate) : null,
    row.status,
    row.bio,
  );
}

function toSlot(row: any): AvailableSlot {
  return { id: row.id, startDatetime: row.startDatetime, endDatetime: row.endDatetime };
}

@Injectable()
export class PrismaTechnicianRepository implements TechnicianRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Technician | null> {
    const row = await this.prisma.technician.findUnique({ where: { id } });
    return row ? toDomain(row) : null;
  }

  async findByUserId(userId: string): Promise<Technician | null> {
    const row = await this.prisma.technician.findUnique({ where: { userId } });
    return row ? toDomain(row) : null;
  }

  async findDetailById(id: string): Promise<TechnicianDetail | null> {
    const row = await this.prisma.technician.findUnique({
      where: { id },
      include: {
        user: true,
        availabilities: {
          where: { isBooked: false, startDatetime: { gte: new Date() } },
          orderBy: { startDatetime: 'asc' },
        },
      },
    });
    if (!row) return null;

    return {
      id: row.id,
      fullName: row.user.fullName,
      phone: row.phone,
      specialties: row.specialties,
      regions: row.regions,
      hourlyRate: row.hourlyRate ? Number(row.hourlyRate) : null,
      status: row.status,
      bio: row.bio,
      availableSlots: row.availabilities.map(toSlot),
    };
  }

  async search(criteria: TechnicianSearchCriteria): Promise<PageResult<TechnicianSearchResult>> {
    const availabilityFilter = {
      isBooked: false,
      ...(criteria.availableFrom && { startDatetime: { gte: criteria.availableFrom } }),
    };

    const rows = await this.prisma.technician.findMany({
      where: {
        status: 'approved',
        ...(criteria.region && { regions: { has: criteria.region } }),
        ...(criteria.specialty && { specialties: { has: criteria.specialty } }),
        availabilities: { some: availabilityFilter },
      },
      include: {
        user: true,
        _count: { select: { availabilities: { where: availabilityFilter } } },
      },
      orderBy: { id: 'asc' },
      skip: (criteria.page - 1) * criteria.pageSize,
      // pageSize + 1 : détecte hasMore sans requête COUNT séparée (cf. toPageResult).
      take: criteria.pageSize + 1,
    });

    const results = rows.map((row) => ({
      id: row.id,
      fullName: row.user.fullName,
      specialties: row.specialties,
      regions: row.regions,
      hourlyRate: row.hourlyRate ? Number(row.hourlyRate) : null,
      availableSlotsCount: row._count.availabilities,
    }));

    return toPageResult(results, criteria.page, criteria.pageSize);
  }

  async upsertForUser(userId: string, data: UpsertTechnicianProfileData): Promise<Technician> {
    const row = await this.prisma.technician.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    });
    return toDomain(row);
  }

  async setStatus(id: string, status: TechnicianStatus): Promise<Technician> {
    const row = await this.prisma.technician.update({ where: { id }, data: { status } });
    return toDomain(row);
  }

  async findAll(page: number, pageSize: number): Promise<PageResult<Technician>> {
    const rows = await this.prisma.technician.findMany({
      orderBy: { id: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize + 1,
    });
    return toPageResult(rows.map(toDomain), page, pageSize);
  }
}
