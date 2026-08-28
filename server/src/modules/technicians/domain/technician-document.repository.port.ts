export const TECHNICIAN_DOCUMENT_REPOSITORY = Symbol('TECHNICIAN_DOCUMENT_REPOSITORY');

export interface TechnicianDocument {
  id: string;
  technicianId: string;
  key: string;
  fileName: string;
  createdAt: Date;
}

export interface TechnicianDocumentRepositoryPort {
  create(technicianId: string, key: string, fileName: string): Promise<TechnicianDocument>;
  findAllByTechnicianId(technicianId: string): Promise<TechnicianDocument[]>;
}
