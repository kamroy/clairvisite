import { Inject, Injectable } from '@nestjs/common';
import { TECHNICIAN_REPOSITORY, TechnicianRepositoryPort } from '../../domain/technician.repository.port';

@Injectable()
export class GetMyTechnicianProfileUseCase {
  constructor(@Inject(TECHNICIAN_REPOSITORY) private readonly technicians: TechnicianRepositoryPort) {}

  // Renvoie null tant que le technicien n'a pas encore créé son profil métier
  // (le formulaire de complément de profil doit alors démarrer vide, pas planter).
  execute(userId: string) {
    return this.technicians.findByUserId(userId);
  }
}
