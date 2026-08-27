import { BookingEmailNotifierPort } from '../../src/modules/bookings/application/ports/booking-email-notifier.port';

// Remplace ResendBookingEmailNotifier dans les tests : aucun appel réseau à Resend.
export class NoopBookingEmailNotifier implements BookingEmailNotifierPort {
  async sendConfirmation(): Promise<void> {}
  async sendCancellation(): Promise<void> {}
}
