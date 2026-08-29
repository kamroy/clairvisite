import { randomUUID } from 'crypto';
import {
  ReportPhoto,
  ReportSection,
  REPORT_SECTION_TYPES,
  TechnicalReport,
} from '../../src/modules/reports/domain/report.entity';
import {
  AddPhotoData,
  ReportRepositoryPort,
  UpsertSectionData,
} from '../../src/modules/reports/domain/report.repository.port';

export class InMemoryReportRepository implements ReportRepositoryPort {
  private readonly reports = new Map<string, TechnicalReport>();

  async findByBookingId(bookingId: string): Promise<TechnicalReport | null> {
    return [...this.reports.values()].find((r) => r.bookingId === bookingId) ?? null;
  }

  async findById(id: string): Promise<TechnicalReport | null> {
    return this.reports.get(id) ?? null;
  }

  async createDraft(bookingId: string): Promise<TechnicalReport> {
    const sections = REPORT_SECTION_TYPES.map((sectionType) => new ReportSection(randomUUID(), sectionType, null, null, []));
    const report = new TechnicalReport(randomUUID(), bookingId, 'draft', null, null, new Date(), sections);
    this.reports.set(report.id, report);
    return report;
  }

  async updateConclusion(reportId: string, generalConclusion: string): Promise<TechnicalReport> {
    const existing = this.get(reportId);
    const updated = new TechnicalReport(
      existing.id,
      existing.bookingId,
      existing.status,
      generalConclusion,
      existing.submittedAt,
      existing.createdAt,
      existing.sections,
    );
    this.reports.set(reportId, updated);
    return updated;
  }

  async upsertSection(reportId: string, sectionType: any, data: UpsertSectionData): Promise<TechnicalReport> {
    const existing = this.get(reportId);
    const sections = existing.sections.map((s) =>
      s.sectionType === sectionType
        ? new ReportSection(
            s.id,
            s.sectionType,
            data.content !== undefined ? data.content : s.content,
            data.status !== undefined ? data.status : s.status,
            s.photos,
          )
        : s,
    );
    const updated = new TechnicalReport(
      existing.id,
      existing.bookingId,
      existing.status,
      existing.generalConclusion,
      existing.submittedAt,
      existing.createdAt,
      sections,
    );
    this.reports.set(reportId, updated);
    return updated;
  }

  async submit(reportId: string): Promise<TechnicalReport> {
    const existing = this.get(reportId);
    const updated = new TechnicalReport(
      existing.id,
      existing.bookingId,
      'submitted',
      existing.generalConclusion,
      new Date(),
      existing.createdAt,
      existing.sections,
    );
    this.reports.set(reportId, updated);
    return updated;
  }

  async addPhoto(reportId: string, data: AddPhotoData): Promise<ReportPhoto> {
    const existing = this.get(reportId);
    const section = existing.sections.find((s) => s.sectionType === data.sectionType);
    if (!section) throw new Error(`InMemoryReportRepository: section ${data.sectionType} not found`);

    const photo = new ReportPhoto(randomUUID(), data.key, data.caption ?? null, data.role ?? null, section.photos.length);
    const sections = existing.sections.map((s) =>
      s.sectionType === data.sectionType ? new ReportSection(s.id, s.sectionType, s.content, s.status, [...s.photos, photo]) : s,
    );
    this.reports.set(
      reportId,
      new TechnicalReport(existing.id, existing.bookingId, existing.status, existing.generalConclusion, existing.submittedAt, existing.createdAt, sections),
    );
    return photo;
  }

  async removePhoto(reportId: string, photoId: string): Promise<boolean> {
    const existing = this.get(reportId);
    let found = false;
    const sections = existing.sections.map((s) => {
      const photos = s.photos.filter((p) => {
        if (p.id === photoId) {
          found = true;
          return false;
        }
        return true;
      });
      return photos.length === s.photos.length ? s : new ReportSection(s.id, s.sectionType, s.content, s.status, photos);
    });
    if (found) {
      this.reports.set(
        reportId,
        new TechnicalReport(existing.id, existing.bookingId, existing.status, existing.generalConclusion, existing.submittedAt, existing.createdAt, sections),
      );
    }
    return found;
  }

  private get(reportId: string): TechnicalReport {
    const existing = this.reports.get(reportId);
    if (!existing) throw new Error(`InMemoryReportRepository: report ${reportId} not found`);
    return existing;
  }
}
