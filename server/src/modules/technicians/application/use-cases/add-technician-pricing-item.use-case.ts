import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { TECHNICIAN_REPOSITORY, TechnicianRepositoryPort } from '../../domain/technician.repository.port';
import {
  TECHNICIAN_PRICING_REPOSITORY,
  TechnicianPricingRepositoryPort,
} from '../../domain/technician-pricing.repository.port';

@Injectable()
export class AddTechnicianPricingItemUseCase {
  constructor(
    @Inject(TECHNICIAN_REPOSITORY) private readonly technicians: TechnicianRepositoryPort,
    @Inject(TECHNICIAN_PRICING_REPOSITORY) private readonly pricing: TechnicianPricingRepositoryPort,
  ) {}

  async execute(userId: string, label: string, price: number) {
    const technician = await this.technicians.findByUserId(userId);
    if (!technician) throw new NotFoundException('Profil professionnel introuvable.');

    return this.pricing.create(technician.id, label, price);
  }
}
