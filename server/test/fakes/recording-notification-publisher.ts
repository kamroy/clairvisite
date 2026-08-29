import {
  NotificationPublisherPort,
  PublishNotificationInput,
} from '../../src/modules/notifications/application/ports/notification-publisher.port';

// Fake du port NOTIFICATION_PUBLISHER pour les e2e-specs de bookings/reports/messaging/
// admin, qui n'ont pas besoin d'une vraie persistance : juste vérifier qu'un appel a eu
// lieu avec les bons paramètres (voir notifications.e2e-spec.ts pour la persistance réelle).
export class RecordingNotificationPublisher implements NotificationPublisherPort {
  readonly calls: PublishNotificationInput[] = [];

  async publish(input: PublishNotificationInput): Promise<void> {
    this.calls.push(input);
  }
}
