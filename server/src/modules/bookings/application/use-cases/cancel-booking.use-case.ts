import { ForbiddenException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { BOOKING_REPOSITORY, BookingRepositoryPort } from '../../domain/booking.repository.port';
import { BOOKING_EMAIL_NOTIFIER, BookingEmailNotifierPort } from '../ports/booking-email-notifier.port';

@Injectable()
export class CancelBookingUseCase {
  private readonly logger = new Logger(CancelBookingUseCase.name);

  constructor(
    @Inject(BOOKING_REPOSITORY) private readonly bookings: BookingRepositoryPort,
    @Inject(BOOKING_EMAIL_NOTIFIER) private readonly notifier: BookingEmailNotifierPort,
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
  }
}
