import { Inject, Injectable } from '@nestjs/common';
import { TECHNICIAN_REPOSITORY, TechnicianRepositoryPort } from '../../domain/technician.repository.port';

const SIMILAR_PROFILES_LIMIT = 3;

@Injectable()
export class ListSimilarTechniciansUseCase {
  constructor(@Inject(TECHNICIAN_REPOSITORY) private readonly technicians: TechnicianRepositoryPort) {}

  async execute(technicianId: string) {
    const current = await this.technicians.findById(technicianId);
    if (!current) return [];

    // pageSize + 1 : le technicien courant apparaît presque toujours dans ses propres
    // résultats de recherche (même catégorie) — on prend une marge avant de l'exclure.
    const page = await this.technicians.search({
      category: current.category,
      page: 1,
      pageSize: SIMILAR_PROFILES_LIMIT + 1,
    });

    return page.items.filter((t) => t.id !== technicianId).slice(0, SIMILAR_PROFILES_LIMIT);
  }
}
