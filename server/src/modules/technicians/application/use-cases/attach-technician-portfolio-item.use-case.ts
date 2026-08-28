import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { TECHNICIAN_REPOSITORY, TechnicianRepositoryPort } from '../../domain/technician.repository.port';
import {
  TECHNICIAN_PORTFOLIO_REPOSITORY,
  TechnicianPortfolioRepositoryPort,
} from '../../domain/technician-portfolio.repository.port';

@Injectable()
export class AttachTechnicianPortfolioItemUseCase {
  constructor(
    @Inject(TECHNICIAN_REPOSITORY) private readonly technicians: TechnicianRepositoryPort,
    @Inject(TECHNICIAN_PORTFOLIO_REPOSITORY) private readonly portfolio: TechnicianPortfolioRepositoryPort,
  ) {}

  async execute(userId: string, key: string, caption: string | null) {
    const technician = await this.technicians.findByUserId(userId);
    if (!technician) throw new NotFoundException('Profil professionnel introuvable.');

    if (!key.startsWith(`technicians/${technician.id}/portfolio/`)) {
      throw new ForbiddenException('Clé de fichier invalide pour ce profil.');
    }

    return this.portfolio.create(technician.id, key, caption);
  }
}
