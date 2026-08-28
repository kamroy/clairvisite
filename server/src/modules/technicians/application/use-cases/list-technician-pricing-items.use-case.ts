import { Inject, Injectable } from '@nestjs/common';
import {
  TECHNICIAN_PRICING_REPOSITORY,
  TechnicianPricingRepositoryPort,
} from '../../domain/technician-pricing.repository.port';

// Lecture publique (pas d'auth) : consommée à la fois par le profil public et par le
// technicien gérant sa propre grille tarifaire — la distinction se fait uniquement
// sur les endpoints d'écriture (add/remove), qui vérifient la propriété.
@Injectable()
export class ListTechnicianPricingItemsUseCase {
  constructor(@Inject(TECHNICIAN_PRICING_REPOSITORY) private readonly pricing: TechnicianPricingRepositoryPort) {}

  execute(technicianId: string) {
    return this.pricing.findAllByTechnicianId(technicianId);
  }
}
