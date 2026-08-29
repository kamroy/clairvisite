import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/persistence/prisma/prisma.service';
import { ReportPhoto, ReportSection, REPORT_SECTION_TYPES, TechnicalReport } from '../../domain/report.entity';
import { AddPhotoData, ReportRepositoryPort, UpsertSectionData } from '../../domain/report.repository.port';

const reportInclude = {
  sections: { include: { photos: { orderBy: { position: 'asc' as const } } } },
};

function toPhoto(row: any): ReportPhoto {
  return new ReportPhoto(row.id, row.key, row.caption, row.role, row.position);
}

function toSection(row: any): ReportSection {
  return new ReportSection(row.id, row.sectionType, row.content, row.status, row.photos.map(toPhoto));
}

function toDomain(row: any): TechnicalReport {
  return new TechnicalReport(
    row.id,
    row.bookingId,
    row.status,
    row.generalConclusion,
    row.submittedAt,
    row.createdAt,
    row.sections.map(toSection),
  );
}

@Injectable()
export class PrismaReportRepository implements ReportRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findByBookingId(bookingId: string): Promise<TechnicalReport | null> {
    const row = await this.prisma.technicalReport.findUnique({ where: { bookingId }, include: reportInclude });
    return row ? toDomain(row) : null;
  }

  async findById(id: string): Promise<TechnicalReport | null> {
    const row = await this.prisma.technicalReport.findUnique({ where: { id }, include: reportInclude });
    return row ? toDomain(row) : null;
  }

  async createDraft(bookingId: string): Promise<TechnicalReport> {
    const row = await this.prisma.technicalReport.create({
      data: {
        bookingId,
        sections: { create: REPORT_SECTION_TYPES.map((sectionType) => ({ sectionType })) },
      },
      include: reportInclude,
    });
    return toDomain(row);
  }

  async updateConclusion(reportId: string, generalConclusion: string): Promise<TechnicalReport> {
    const row = await this.prisma.technicalReport.update({
      where: { id: reportId },
      data: { generalConclusion },
      include: reportInclude,
    });
    return toDomain(row);
  }

  async upsertSection(reportId: string, sectionType: any, data: UpsertSectionData): Promise<TechnicalReport> {
    await this.prisma.reportSection.update({
      where: { reportId_sectionType: { reportId, sectionType } },
      data: { ...(data.content !== undefined && { content: data.content }), ...(data.status !== undefined && { status: data.status }) },
    });
    return (await this.findById(reportId))!;
  }

  async submit(reportId: string): Promise<TechnicalReport> {
    const row = await this.prisma.technicalReport.update({
      where: { id: reportId },
      data: { status: 'submitted', submittedAt: new Date() },
      include: reportInclude,
    });
    return toDomain(row);
  }

  async addPhoto(reportId: string, data: AddPhotoData): Promise<ReportPhoto> {
    const section = await this.prisma.reportSection.findUniqueOrThrow({
      where: { reportId_sectionType: { reportId, sectionType: data.sectionType } },
    });
    const count = await this.prisma.reportPhoto.count({ where: { sectionId: section.id } });
    const row = await this.prisma.reportPhoto.create({
      data: {
        sectionId: section.id,
        key: data.key,
        caption: data.caption ?? null,
        role: data.role ?? null,
        position: count,
      },
    });
    return toPhoto(row);
  }

  async removePhoto(reportId: string, photoId: string): Promise<boolean> {
    const { count } = await this.prisma.reportPhoto.deleteMany({
      where: { id: photoId, section: { reportId } },
    });
    return count > 0;
  }
}
