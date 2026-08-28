import { randomUUID } from 'crypto';
import {
  TechnicianDocument,
  TechnicianDocumentRepositoryPort,
} from '../../src/modules/technicians/domain/technician-document.repository.port';

export class InMemoryTechnicianDocumentRepository implements TechnicianDocumentRepositoryPort {
  private readonly documents: TechnicianDocument[] = [];

  async create(technicianId: string, key: string, fileName: string): Promise<TechnicianDocument> {
    const document = { id: randomUUID(), technicianId, key, fileName, createdAt: new Date() };
    this.documents.push(document);
    return document;
  }

  async findAllByTechnicianId(technicianId: string): Promise<TechnicianDocument[]> {
    return this.documents
      .filter((d) => d.technicianId === technicianId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}
