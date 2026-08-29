import { NotificationCategory } from '../../domain/notification.entity';

export const NOTIFICATION_PUBLISHER = Symbol('NOTIFICATION_PUBLISHER');

export interface PublishNotificationInput {
  userId: string;
  category: NotificationCategory;
  title: string;
  body?: string;
  ctaLabel?: string;
  ctaUrl?: string;
}

// Port consommé depuis d'autres modules (bookings/reports/messaging) pour émettre une
// notification in-app sans dépendre du reste du module notifications — même schéma
// d'imports "un sens" que reports/messaging -> bookings pour BOOKING_REPOSITORY.
export interface NotificationPublisherPort {
  publish(input: PublishNotificationInput): Promise<void>;
}
