import { BadRequestException, ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { BOOKING_REPOSITORY, BookingRepositoryPort } from '../../../bookings/domain/booking.repository.port';
import { REPORT_REPOSITORY, ReportRepositoryPort, UpsertSectionData } from '../../domain/report.repository.port';
import { REPORT_SECTION_TYPES, ReportSectionType } from '../../domain/report.entity';
import { REPORT_ALREADY_SUBMITTED_MESSAGE } from './update-report-conclusion.use-case';

@Injectable()
export class UpdateReportSectionUseCase {
  constructor(
    @Inject(BOOKING_REPOSITORY) private readonly bookings: BookingRepositoryPort,
    @Inject(REPORT_REPOSITORY) private readonly reports: ReportRepositoryPort,
  ) {}

  async execute(technicianUserId: string, bookingId: string, sectionType: string, data: UpsertSectionData) {
    if (!REPORT_SECTION_TYPES.includes(sectionType as ReportSectionType)) {
      throw new BadRequestException('Section de rapport inconnue.');
    }

    const booking = await this.bookings.findByIdWithDetails(bookingId);
    if (!booking) throw new NotFoundException('Réservation introuvable.');
    if (booking.technicianUserId !== technicianUserId) {
      throw new ForbiddenException("Vous n'êtes pas l'expert assigné à cette réservation.");
    }

    const report = (await this.reports.findByBookingId(bookingId)) ?? (await this.reports.createDraft(bookingId));
    if (report.status === 'submitted') throw new ConflictException(REPORT_ALREADY_SUBMITTED_MESSAGE);

    return this.reports.upsertSection(report.id, sectionType as ReportSectionType, data);
  }
}
