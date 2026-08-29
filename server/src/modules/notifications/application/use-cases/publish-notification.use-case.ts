import { Inject, Injectable } from '@nestjs/common';
import { NOTIFICATION_REPOSITORY, NotificationRepositoryPort } from '../../domain/notification.repository.port';
import { NotificationPublisherPort, PublishNotificationInput } from '../ports/notification-publisher.port';

// Implémente le port consommé par les autres modules : persiste simplement la
// notification. Pas de canal temps réel (voir 06-communication.md) — le client
// découvre les nouvelles notifications par polling, comme pour la messagerie.
@Injectable()
export class PublishNotificationUseCase implements NotificationPublisherPort {
  constructor(@Inject(NOTIFICATION_REPOSITORY) private readonly notifications: NotificationRepositoryPort) {}

  async publish(input: PublishNotificationInput): Promise<void> {
    await this.notifications.create({
      userId: input.userId,
      category: input.category,
      title: input.title,
      body: input.body ?? null,
      ctaLabel: input.ctaLabel ?? null,
      ctaUrl: input.ctaUrl ?? null,
    });
  }
}
