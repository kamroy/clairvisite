import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { TECHNICIAN_REPOSITORY, TechnicianRepositoryPort } from '../../domain/technician.repository.port';
import {
  TECHNICIAN_DOCUMENT_REPOSITORY,
  TechnicianDocumentRepositoryPort,
} from '../../domain/technician-document.repository.port';

@Injectable()
export class AttachTechnicianDocumentUseCase {
  constructor(
    @Inject(TECHNICIAN_REPOSITORY) private readonly technicians: TechnicianRepositoryPort,
    @Inject(TECHNICIAN_DOCUMENT_REPOSITORY) private readonly documents: TechnicianDocumentRepositoryPort,
  ) {}

  async execute(userId: string, key: string, fileName: string) {
    const technician = await this.technicians.findByUserId(userId);
    if (!technician) throw new NotFoundException('Profil professionnel introuvable.');

    // Empêche d'enregistrer une clé arbitraire (ex. celle d'un autre technicien) :
    // seules les clés générées par RequestTechnicianDocumentUploadUrlUseCase pour CE
    // technicien sont acceptées.
    if (!key.startsWith(`technicians/${technician.id}/`)) {
      throw new ForbiddenException('Clé de fichier invalide pour ce profil.');
    }

    return this.documents.create(technician.id, key, fileName);
  }
}
