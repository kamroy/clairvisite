import { randomUUID } from 'crypto';
import { Availability } from '../../src/modules/availabilities/domain/availability.entity';
import {
  AvailabilityRepositoryPort,
  CreateAvailabilityData,
} from '../../src/modules/availabilities/domain/availability.repository.port';

export class InMemoryAvailabilityRepository implements AvailabilityRepositoryPort {
  private readonly slots = new Map<string, Availability>();

  async findById(id: string): Promise<Availability | null> {
    return this.slots.get(id) ?? null;
  }

  async findByTechnicianId(technicianId: string): Promise<Availability[]> {
    return [...this.slots.values()].filter((s) => s.technicianId === technicianId);
  }

  async create(data: CreateAvailabilityData): Promise<Availability> {
    const slot = new Availability(randomUUID(), data.technicianId, data.startDatetime, data.endDatetime, false);
    this.slots.set(slot.id, slot);
    return slot;
  }

  async update(id: string, data: Partial<CreateAvailabilityData>): Promise<Availability> {
    const existing = this.slots.get(id);
    if (!existing) throw new Error(`InMemoryAvailabilityRepository: slot ${id} not found`);
    const updated = new Availability(
      existing.id,
      existing.technicianId,
      data.startDatetime ?? existing.startDatetime,
      data.endDatetime ?? existing.endDatetime,
      existing.isBooked,
    );
    this.slots.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    this.slots.delete(id);
  }

  seed(slot: Availability): Availability {
    this.slots.set(slot.id, slot);
    return slot;
  }

  // Vérifie et marque le créneau réservé de façon synchrone (aucun `await` entre les deux),
  // ce qui reproduit en mémoire la garantie d'atomicité de la transaction Prisma réelle
  // (`$transaction` avec verrou de ligne) — voir InMemoryBookingRepository.createIfSlotAvailable.
  tryReserve(id: string): boolean {
    const existing = this.slots.get(id);
    if (!existing || existing.isBooked) return false;
    this.slots.set(id, new Availability(existing.id, existing.technicianId, existing.startDatetime, existing.endDatetime, true));
    return true;
  }

  release(id: string): void {
    const existing = this.slots.get(id);
    if (existing) {
      this.slots.set(id, new Availability(existing.id, existing.technicianId, existing.startDatetime, existing.endDatetime, false));
    }
  }
}
