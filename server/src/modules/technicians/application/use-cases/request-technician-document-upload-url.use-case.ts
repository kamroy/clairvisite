import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { TECHNICIAN_REPOSITORY, TechnicianRepositoryPort } from '../../domain/technician.repository.port';
import { FILE_STORAGE, FileStoragePort } from '../../../../infrastructure/storage/file-storage.port';

@Injectable()
export class RequestTechnicianDocumentUploadUrlUseCase {
  constructor(
    @Inject(TECHNICIAN_REPOSITORY) private readonly technicians: TechnicianRepositoryPort,
    @Inject(FILE_STORAGE) private readonly storage: FileStoragePort,
  ) {}

  async execute(userId: string, fileName: string, contentType: string) {
    const technician = await this.technicians.findByUserId(userId);
    // Le profil "Expertise" (specialties/regions/catégorie) doit exister avant de
    // pouvoir déposer des pièces justificatives — cf. étapes du dossier pro.
    if (!technician) throw new NotFoundException("Profil professionnel introuvable : complétez d'abord l'étape Expertise.");

    const key = `technicians/${technician.id}/${randomUUID()}-${fileName}`;
    const uploadUrl = await this.storage.getUploadUrl(key, contentType);
    return { uploadUrl, key };
  }
}
