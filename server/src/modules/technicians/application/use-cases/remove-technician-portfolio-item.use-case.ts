import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { TECHNICIAN_REPOSITORY, TechnicianRepositoryPort } from '../../domain/technician.repository.port';
import {
  TECHNICIAN_PORTFOLIO_REPOSITORY,
  TechnicianPortfolioRepositoryPort,
} from '../../domain/technician-portfolio.repository.port';

@Injectable()
export class RemoveTechnicianPortfolioItemUseCase {
  constructor(
    @Inject(TECHNICIAN_REPOSITORY) private readonly technicians: TechnicianRepositoryPort,
    @Inject(TECHNICIAN_PORTFOLIO_REPOSITORY) private readonly portfolio: TechnicianPortfolioRepositoryPort,
  ) {}

  async execute(userId: string, itemId: string) {
    const technician = await this.technicians.findByUserId(userId);
    if (!technician) throw new NotFoundException('Profil professionnel introuvable.');

    const deleted = await this.portfolio.delete(itemId, technician.id);
    if (!deleted) throw new NotFoundException('Réalisation introuvable.');
  }
}
