import { PhotoRole, ReportPhoto, ReportSectionType, SystemStatus, TechnicalReport } from './report.entity';

export const REPORT_REPOSITORY = Symbol('REPORT_REPOSITORY');

export interface UpsertSectionData {
  content?: string | null;
  status?: SystemStatus | null;
}

export interface AddPhotoData {
  sectionType: ReportSectionType;
  key: string;
  caption?: string | null;
  role?: PhotoRole | null;
}

export interface ReportRepositoryPort {
  findByBookingId(bookingId: string): Promise<TechnicalReport | null>;
  findById(id: string): Promise<TechnicalReport | null>;
  // Crée un brouillon avec les 5 sections prédéfinies (vides) — idempotent côté
  // appelant : le use case vérifie l'absence de rapport existant avant d'appeler ceci.
  createDraft(bookingId: string): Promise<TechnicalReport>;
  updateConclusion(reportId: string, generalConclusion: string): Promise<TechnicalReport>;
  upsertSection(reportId: string, sectionType: ReportSectionType, data: UpsertSectionData): Promise<TechnicalReport>;
  submit(reportId: string): Promise<TechnicalReport>;
  addPhoto(reportId: string, data: AddPhotoData): Promise<ReportPhoto>;
  // Retourne false si la photo n'existe pas ou n'appartient pas à ce rapport
  // (contrôle d'appartenance en plus de la vérification d'auteur faite en amont).
  removePhoto(reportId: string, photoId: string): Promise<boolean>;
}
