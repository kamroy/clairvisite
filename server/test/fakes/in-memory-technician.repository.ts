import { randomUUID } from 'crypto';
import { PageResult, toPageResult } from '../../src/common/pagination';
import { Technician, TechnicianStatus } from '../../src/modules/technicians/domain/technician.entity';
import {
  TechnicianDetail,
  TechnicianRepositoryPort,
  TechnicianSearchCriteria,
  TechnicianSearchResult,
  UpsertTechnicianProfileData,
} from '../../src/modules/technicians/domain/technician.repository.port';
import { InMemoryUserRepository } from './in-memory-user.repository';
import { InMemoryAvailabilityRepository } from './in-memory-availability.repository';

export class InMemoryTechnicianRepository implements TechnicianRepositoryPort {
  private readonly technicians = new Map<string, Technician>();

  // Dépend des fakes user/availability pour reconstituer les vues dénormalisées
  // (fullName, nombre de créneaux libres) — comme l'adapter Prisma le fait par jointure.
  constructor(
    private readonly users: InMemoryUserRepository,
    private readonly availabilities: InMemoryAvailabilityRepository,
  ) {}

  async findById(id: string): Promise<Technician | null> {
    return this.technicians.get(id) ?? null;
  }

  async findByUserId(userId: string): Promise<Technician | null> {
    return [...this.technicians.values()].find((t) => t.userId === userId) ?? null;
  }

  async findDetailById(id: string): Promise<TechnicianDetail | null> {
    const technician = this.technicians.get(id);
    if (!technician) return null;

    const user = await this.users.findById(technician.userId);
    const now = new Date();
    const slots = (await this.availabilities.findByTechnicianId(technician.id)).filter(
      (a) => !a.isBooked && a.startDatetime >= now,
    );

    return {
      id: technician.id,
      fullName: user?.fullName ?? '',
      phone: technician.phone,
      specialties: technician.specialties,
      regions: technician.regions,
      hourlyRate: technician.hourlyRate,
      status: technician.status,
      bio: technician.bio,
      availableSlots: slots.map((s) => ({ id: s.id, startDatetime: s.startDatetime, endDatetime: s.endDatetime })),
    };
  }

  // Simplifié par rapport à l'adapter Prisma : ne filtre pas sur la présence d'un
  // créneau disponible (`availableFrom`) au niveau du `where` technicien, mais sur le
  // dénombrement final — suffisant pour les tests actuels.
  async search(criteria: TechnicianSearchCriteria): Promise<PageResult<TechnicianSearchResult>> {
    const results: TechnicianSearchResult[] = [];

    for (const t of [...this.technicians.values()].sort((a, b) => a.id.localeCompare(b.id))) {
      if (t.status !== 'approved') continue;
      if (criteria.region && !t.regions.includes(criteria.region)) continue;
      if (criteria.specialty && !t.specialties.includes(criteria.specialty)) continue;

      const slots = await this.availabilities.findByTechnicianId(t.id);
      const availableSlots = slots.filter(
        (a) => !a.isBooked && (!criteria.availableFrom || a.startDatetime >= criteria.availableFrom),
      );
      if (availableSlots.length === 0) continue;

      const user = await this.users.findById(t.userId);
      results.push({
        id: t.id,
        fullName: user?.fullName ?? '',
        specialties: t.specialties,
        regions: t.regions,
        hourlyRate: t.hourlyRate,
        availableSlotsCount: availableSlots.length,
      });
    }

    const start = (criteria.page - 1) * criteria.pageSize;
    const windowed = results.slice(start, start + criteria.pageSize + 1);
    return toPageResult(windowed, criteria.page, criteria.pageSize);
  }

  async upsertForUser(userId: string, data: UpsertTechnicianProfileData): Promise<Technician> {
    const existing = await this.findByUserId(userId);
    const technician = new Technician(
      existing?.id ?? randomUUID(),
      userId,
      data.phone,
      data.specialties,
      data.regions,
      data.hourlyRate ?? null,
      existing?.status ?? 'pending',
      data.bio ?? null,
    );
    this.technicians.set(technician.id, technician);
    return technician;
  }

  async setStatus(id: string, status: TechnicianStatus): Promise<Technician> {
    const existing = this.technicians.get(id);
    if (!existing) throw new Error(`InMemoryTechnicianRepository: technician ${id} not found`);
    const updated = new Technician(
      existing.id,
      existing.userId,
      existing.phone,
      existing.specialties,
      existing.regions,
      existing.hourlyRate,
      status,
      existing.bio,
    );
    this.technicians.set(id, updated);
    return updated;
  }

  async findAll(page: number, pageSize: number): Promise<PageResult<Technician>> {
    const all = [...this.technicians.values()].sort((a, b) => a.id.localeCompare(b.id));
    const start = (page - 1) * pageSize;
    return toPageResult(all.slice(start, start + pageSize + 1), page, pageSize);
  }

  seed(technician: Technician): Technician {
    this.technicians.set(technician.id, technician);
    return technician;
  }
}
