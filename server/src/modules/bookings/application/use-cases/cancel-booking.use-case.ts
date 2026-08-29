import { ForbiddenException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { BOOKING_REPOSITORY, BookingRepositoryPort } from '../../domain/booking.repository.port';
import { BOOKING_EMAIL_NOTIFIER, BookingEmailNotifierPort } from '../ports/booking-email-notifier.port';
import {
  NOTIFICATION_PUBLISHER,
  NotificationPublisherPort,
} from '../../../notifications/application/ports/notification-publisher.port';

@Injectable()
export class CancelBookingUseCase {
  private readonly logger = new Logger(CancelBookingUseCase.name);

  constructor(
    @Inject(BOOKING_REPOSITORY) private readonly bookings: BookingRepositoryPort,
    @Inject(BOOKING_EMAIL_NOTIFIER) private readonly notifier: BookingEmailNotifierPort,
    @Inject(NOTIFICATION_PUBLISHER) private readonly notifications: NotificationPublisherPort,
  ) {}

  async execute(bookingId: string, requesterUserId: string) {
    const booking = await this.bookings.findByIdWithDetails(bookingId);
    if (!booking) throw new NotFoundException('Réservation introuvable');

    const isBuyer = booking.buyerId === requesterUserId;
    const isTechnician = booking.technicianUserId === requesterUserId;
    if (!isBuyer && !isTechnician) throw new ForbiddenException('Accès non autorisé');

    await this.bookings.setStatus(bookingId, 'cancelled');

    this.notifier
      .sendCancellation(booking)
      .catch((err) => this.logger.error("Échec envoi email d'annulation", err));

    const category = booking.technicianCategory === 'decoration' ? 'decoration' : 'visite_technique';
    const recipientUserId = isBuyer ? booking.technicianUserId : booking.buyerId;
    const ctaUrl = isBuyer ? '/technician/dashboard' : '/projects';
    this.notifications
      .publish({
        userId: recipientUserId,
        category,
        title: 'Réservation annulée',
        body: `La réservation du ${booking.slotStart.toLocaleDateString('fr-FR')} a été annulée.`,
        ctaLabel: 'Voir mes projets',
        ctaUrl,
      })
      .catch((err) => this.logger.error("Échec publication notification d'annulation", err));
  }
}
