import { Inject, Injectable } from '@nestjs/common';
import {
  TECHNICIAN_REPOSITORY,
  TechnicianRepositoryPort,
  TechnicianSearchCriteria,
} from '../../domain/technician.repository.port';

@Injectable()
export class SearchTechniciansUseCase {
  constructor(@Inject(TECHNICIAN_REPOSITORY) private readonly technicians: TechnicianRepositoryPort) {}

  execute(criteria: TechnicianSearchCriteria) {
    return this.technicians.search(criteria);
  }
}
