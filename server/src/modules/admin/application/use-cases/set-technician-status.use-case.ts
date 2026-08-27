import { Inject, Injectable } from '@nestjs/common';
import {
  TECHNICIAN_REPOSITORY,
  TechnicianRepositoryPort,
} from '../../../technicians/domain/technician.repository.port';
import { TechnicianStatus } from '../../../technicians/domain/technician.entity';

@Injectable()
export class SetTechnicianStatusUseCase {
  constructor(@Inject(TECHNICIAN_REPOSITORY) private readonly technicians: TechnicianRepositoryPort) {}

  execute(id: string, status: TechnicianStatus) {
    return this.technicians.setStatus(id, status);
  }
}
