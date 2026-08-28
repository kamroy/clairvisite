import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { TECHNICIAN_REPOSITORY, TechnicianRepositoryPort } from '../../domain/technician.repository.port';
import {
  TECHNICIAN_DOCUMENT_REPOSITORY,
  TechnicianDocumentRepositoryPort,
} from '../../domain/technician-document.repository.port';
import { FILE_STORAGE, FileStoragePort } from '../../../../infrastructure/storage/file-storage.port';

@Injectable()
export class ListMyTechnicianDocumentsUseCase {
  constructor(
    @Inject(TECHNICIAN_REPOSITORY) private readonly technicians: TechnicianRepositoryPort,
    @Inject(TECHNICIAN_DOCUMENT_REPOSITORY) private readonly documents: TechnicianDocumentRepositoryPort,
    @Inject(FILE_STORAGE) private readonly storage: FileStoragePort,
  ) {}

  async execute(userId: string) {
    const technician = await this.technicians.findByUserId(userId);
    if (!technician) throw new NotFoundException('Profil professionnel introuvable.');

    const docs = await this.documents.findAllByTechnicianId(technician.id);
    return Promise.all(
      docs.map(async (doc) => ({ ...doc, downloadUrl: await this.storage.getDownloadUrl(doc.key) })),
    );
  }
}
