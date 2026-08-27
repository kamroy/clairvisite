import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { TECHNICIAN_REPOSITORY, TechnicianRepositoryPort } from '../../../technicians/domain/technician.repository.port';
import { AVAILABILITY_REPOSITORY, AvailabilityRepositoryPort } from '../../domain/availability.repository.port';

@Injectable()
export class ListMyAvailabilitiesUseCase {
  constructor(
    @Inject(TECHNICIAN_REPOSITORY) private readonly technicians: TechnicianRepositoryPort,
    @Inject(AVAILABILITY_REPOSITORY) private readonly availabilities: AvailabilityRepositoryPort,
  ) {}

  async execute(userId: string) {
    const technician = await this.technicians.findByUserId(userId);
    if (!technician) throw new NotFoundException('Profil technicien introuvable');
    return this.availabilities.findByTechnicianId(technician.id);
  }
}
