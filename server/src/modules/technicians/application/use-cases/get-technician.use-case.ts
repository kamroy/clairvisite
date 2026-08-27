import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { TECHNICIAN_REPOSITORY, TechnicianRepositoryPort } from '../../domain/technician.repository.port';

@Injectable()
export class GetTechnicianUseCase {
  constructor(@Inject(TECHNICIAN_REPOSITORY) private readonly technicians: TechnicianRepositoryPort) {}

  async execute(id: string) {
    const technician = await this.technicians.findDetailById(id);
    // Un technicien pending/rejected n'a jamais été validé par un admin : sa fiche ne
    // doit pas être consultable publiquement, sans quoi la modération est cosmétique
    // (voir aussi le contrôle équivalent dans createIfSlotAvailable au moment de réserver).
    if (!technician || technician.status !== 'approved') {
      throw new NotFoundException('Technicien introuvable');
    }
    return technician;
  }
}
