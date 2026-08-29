import { ConflictException, ForbiddenException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { BOOKING_REPOSITORY, BookingRepositoryPort } from '../../../bookings/domain/booking.repository.port';
import { REPORT_REPOSITORY, ReportRepositoryPort } from '../../domain/report.repository.port';
import { REPORT_ALREADY_SUBMITTED_MESSAGE } from './update-report-conclusion.use-case';
import {
  NOTIFICATION_PUBLISHER,
  NotificationPublisherPort,
} from '../../../notifications/application/ports/notification-publisher.port';

@Injectable()
export class SubmitReportUseCase {
  private readonly logger = new Logger(SubmitReportUseCase.name);

  constructor(
    @Inject(BOOKING_REPOSITORY) private readonly bookings: BookingRepositoryPort,
    @Inject(REPORT_REPOSITORY) private readonly reports: ReportRepositoryPort,
    @Inject(NOTIFICATION_PUBLISHER) private readonly notifications: NotificationPublisherPort,
  ) {}

  async execute(technicianUserId: string, bookingId: string) {
    const booking = await this.bookings.findByIdWithDetails(bookingId);
    if (!booking) throw new NotFoundException('Réservation introuvable.');
    if (booking.technicianUserId !== technicianUserId) {
      throw new ForbiddenException("Vous n'êtes pas l'expert assigné à cette réservation.");
    }

    const report = (await this.reports.findByBookingId(bookingId)) ?? (await this.reports.createDraft(bookingId));
    if (report.status === 'submitted') throw new ConflictException(REPORT_ALREADY_SUBMITTED_MESSAGE);

    const submitted = await this.reports.submit(report.id);

    this.notifications
      .publish({
        userId: booking.buyerId,
        category: booking.technicianCategory === 'decoration' ? 'decoration' : 'visite_technique',
        title: 'Rapport disponible',
        body: `${booking.technicianFullName} a publié le rapport de votre intervention.`,
        ctaLabel: 'Voir le rapport',
        ctaUrl: `/bookings/${bookingId}/report`,
      })
      .catch((err) => this.logger.error('Échec publication notification de rapport', err));

    return submitted;
  }
}
