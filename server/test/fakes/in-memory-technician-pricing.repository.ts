import { randomUUID } from 'crypto';
import {
  TechnicianPricingItem,
  TechnicianPricingRepositoryPort,
} from '../../src/modules/technicians/domain/technician-pricing.repository.port';

export class InMemoryTechnicianPricingRepository implements TechnicianPricingRepositoryPort {
  private readonly items: TechnicianPricingItem[] = [];

  async create(technicianId: string, label: string, price: number): Promise<TechnicianPricingItem> {
    const position = this.items.filter((i) => i.technicianId === technicianId).length;
    const item = { id: randomUUID(), technicianId, label, price, position };
    this.items.push(item);
    return item;
  }

  async findAllByTechnicianId(technicianId: string): Promise<TechnicianPricingItem[]> {
    return this.items.filter((i) => i.technicianId === technicianId).sort((a, b) => a.position - b.position);
  }

  async delete(id: string, technicianId: string): Promise<boolean> {
    const index = this.items.findIndex((i) => i.id === id && i.technicianId === technicianId);
    if (index === -1) return false;
    this.items.splice(index, 1);
    return true;
  }
}
