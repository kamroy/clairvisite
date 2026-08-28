import { Inject, Injectable } from '@nestjs/common';
import {
  TECHNICIAN_PORTFOLIO_REPOSITORY,
  TechnicianPortfolioRepositoryPort,
} from '../../domain/technician-portfolio.repository.port';
import { FILE_STORAGE, FileStoragePort } from '../../../../infrastructure/storage/file-storage.port';

// Lecture publique (pas d'auth), comme ListTechnicianPricingItemsUseCase.
@Injectable()
export class ListTechnicianPortfolioItemsUseCase {
  constructor(
    @Inject(TECHNICIAN_PORTFOLIO_REPOSITORY) private readonly portfolio: TechnicianPortfolioRepositoryPort,
    @Inject(FILE_STORAGE) private readonly storage: FileStoragePort,
  ) {}

  async execute(technicianId: string) {
    const items = await this.portfolio.findAllByTechnicianId(technicianId);
    return Promise.all(items.map(async (item) => ({ ...item, imageUrl: await this.storage.getDownloadUrl(item.key) })));
  }
}
