import { Inject, Injectable } from '@nestjs/common';
import {
  TECHNICIAN_REPOSITORY,
  TechnicianRepositoryPort,
  UpsertTechnicianProfileData,
} from '../../domain/technician.repository.port';

@Injectable()
export class UpsertTechnicianProfileUseCase {
  constructor(@Inject(TECHNICIAN_REPOSITORY) private readonly technicians: TechnicianRepositoryPort) {}

  execute(userId: string, data: UpsertTechnicianProfileData) {
    return this.technicians.upsertForUser(userId, data);
  }
}
