import { BadRequestException, ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { BOOKING_REPOSITORY, BookingRepositoryPort } from '../../../bookings/domain/booking.repository.port';
import { REPORT_REPOSITORY, ReportRepositoryPort } from '../../domain/report.repository.port';
import { PhotoRole, REPORT_SECTION_TYPES, ReportSectionType } from '../../domain/report.entity';
import { REPORT_ALREADY_SUBMITTED_MESSAGE } from './update-report-conclusion.use-case';

@Injectable()
export class AttachReportPhotoUseCase {
  constructor(
    @Inject(BOOKING_REPOSITORY) private readonly bookings: BookingRepositoryPort,
    @Inject(REPORT_REPOSITORY) private readonly reports: ReportRepositoryPort,
  ) {}

  async execute(
    technicianUserId: string,
    bookingId: string,
    sectionType: string,
    key: string,
    caption: string | null,
    role: PhotoRole | null,
  ) {
    if (!REPORT_SECTION_TYPES.includes(sectionType as ReportSectionType)) {
      throw new BadRequestException('Section de rapport inconnue.');
    }
    if (!key.startsWith(`reports/${bookingId}/${sectionType}/`)) {
      throw new ForbiddenException('Clé de fichier invalide pour cette section.');
    }

    const booking = await this.bookings.findByIdWithDetails(bookingId);
    if (!booking) throw new NotFoundException('Réservation introuvable.');
    if (booking.technicianUserId !== technicianUserId) {
      throw new ForbiddenException("Vous n'êtes pas l'expert assigné à cette réservation.");
    }

    const report = (await this.reports.findByBookingId(bookingId)) ?? (await this.reports.createDraft(bookingId));
    if (report.status === 'submitted') throw new ConflictException(REPORT_ALREADY_SUBMITTED_MESSAGE);

    return this.reports.addPhoto(report.id, { sectionType: sectionType as ReportSectionType, key, caption, role });
  }
}
