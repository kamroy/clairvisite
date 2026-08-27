import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { TECHNICIAN_REPOSITORY, TechnicianRepositoryPort } from '../../../technicians/domain/technician.repository.port';
import { AVAILABILITY_REPOSITORY, AvailabilityRepositoryPort } from '../../domain/availability.repository.port';

export interface CreateAvailabilityInput {
  startDatetime: Date;
  endDatetime: Date;
}

@Injectable()
export class CreateAvailabilityUseCase {
  constructor(
    @Inject(TECHNICIAN_REPOSITORY) private readonly technicians: TechnicianRepositoryPort,
    @Inject(AVAILABILITY_REPOSITORY) private readonly availabilities: AvailabilityRepositoryPort,
  ) {}

  async execute(userId: string, input: CreateAvailabilityInput) {
    const technician = await this.technicians.findByUserId(userId);
    if (!technician) throw new NotFoundException('Profil technicien introuvable');

    return this.availabilities.create({ technicianId: technician.id, ...input });
  }
}
