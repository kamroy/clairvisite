import { randomUUID } from 'crypto';
import {
  TechnicianPortfolioItem,
  TechnicianPortfolioRepositoryPort,
} from '../../src/modules/technicians/domain/technician-portfolio.repository.port';

export class InMemoryTechnicianPortfolioRepository implements TechnicianPortfolioRepositoryPort {
  private readonly items: TechnicianPortfolioItem[] = [];

  async create(technicianId: string, key: string, caption: string | null): Promise<TechnicianPortfolioItem> {
    const position = this.items.filter((i) => i.technicianId === technicianId).length;
    const item = { id: randomUUID(), technicianId, key, caption, position };
    this.items.push(item);
    return item;
  }

  async findAllByTechnicianId(technicianId: string): Promise<TechnicianPortfolioItem[]> {
    return this.items.filter((i) => i.technicianId === technicianId).sort((a, b) => a.position - b.position);
  }

  async delete(id: string, technicianId: string): Promise<boolean> {
    const index = this.items.findIndex((i) => i.id === id && i.technicianId === technicianId);
    if (index === -1) return false;
    this.items.splice(index, 1);
    return true;
  }
}
