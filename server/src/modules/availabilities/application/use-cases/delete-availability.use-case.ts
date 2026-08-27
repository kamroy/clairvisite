import { ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { AVAILABILITY_REPOSITORY, AvailabilityRepositoryPort } from '../../domain/availability.repository.port';
import { TECHNICIAN_REPOSITORY, TechnicianRepositoryPort } from '../../../technicians/domain/technician.repository.port';

@Injectable()
export class DeleteAvailabilityUseCase {
  constructor(
    @Inject(AVAILABILITY_REPOSITORY) private readonly availabilities: AvailabilityRepositoryPort,
    @Inject(TECHNICIAN_REPOSITORY) private readonly technicians: TechnicianRepositoryPort,
  ) {}

  async execute(userId: string, id: string) {
    const slot = await this.availabilities.findById(id);
    if (!slot) throw new NotFoundException('Créneau introuvable');

    const technician = await this.technicians.findByUserId(userId);
    if (!technician || slot.technicianId !== technician.id) {
      throw new ForbiddenException('Accès non autorisé');
    }

    if (slot.isBooked) throw new ConflictException('Créneau déjà réservé');

    await this.availabilities.delete(id);
  }
}
