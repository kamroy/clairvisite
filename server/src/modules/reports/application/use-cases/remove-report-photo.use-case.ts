import { ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { BOOKING_REPOSITORY, BookingRepositoryPort } from '../../../bookings/domain/booking.repository.port';
import { REPORT_REPOSITORY, ReportRepositoryPort } from '../../domain/report.repository.port';
import { REPORT_ALREADY_SUBMITTED_MESSAGE } from './update-report-conclusion.use-case';

@Injectable()
export class RemoveReportPhotoUseCase {
  constructor(
    @Inject(BOOKING_REPOSITORY) private readonly bookings: BookingRepositoryPort,
    @Inject(REPORT_REPOSITORY) private readonly reports: ReportRepositoryPort,
  ) {}

  async execute(technicianUserId: string, bookingId: string, photoId: string) {
    const booking = await this.bookings.findByIdWithDetails(bookingId);
    if (!booking) throw new NotFoundException('Réservation introuvable.');
    if (booking.technicianUserId !== technicianUserId) {
      throw new ForbiddenException("Vous n'êtes pas l'expert assigné à cette réservation.");
    }

    const report = await this.reports.findByBookingId(bookingId);
    if (!report) throw new NotFoundException('Rapport introuvable.');
    if (report.status === 'submitted') throw new ConflictException(REPORT_ALREADY_SUBMITTED_MESSAGE);

    const removed = await this.reports.removePhoto(report.id, photoId);
    if (!removed) throw new NotFoundException('Photo introuvable.');
  }
}
