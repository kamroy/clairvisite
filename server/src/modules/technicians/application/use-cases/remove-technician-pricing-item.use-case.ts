import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { TECHNICIAN_REPOSITORY, TechnicianRepositoryPort } from '../../domain/technician.repository.port';
import {
  TECHNICIAN_PRICING_REPOSITORY,
  TechnicianPricingRepositoryPort,
} from '../../domain/technician-pricing.repository.port';

@Injectable()
export class RemoveTechnicianPricingItemUseCase {
  constructor(
    @Inject(TECHNICIAN_REPOSITORY) private readonly technicians: TechnicianRepositoryPort,
    @Inject(TECHNICIAN_PRICING_REPOSITORY) private readonly pricing: TechnicianPricingRepositoryPort,
  ) {}

  async execute(userId: string, itemId: string) {
    const technician = await this.technicians.findByUserId(userId);
    if (!technician) throw new NotFoundException('Profil professionnel introuvable.');

    // `delete` vérifie déjà l'appartenance (technicianId) : pas de faux-positif IDOR
    // possible même si l'id de l'item appartient à un autre technicien.
    const deleted = await this.pricing.delete(itemId, technician.id);
    if (!deleted) throw new NotFoundException('Prestation introuvable.');
  }
}
