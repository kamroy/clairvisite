import { Inject, Injectable } from '@nestjs/common';
import { NOTIFICATION_REPOSITORY, NotificationRepositoryPort } from '../../domain/notification.repository.port';

@Injectable()
export class MarkNotificationReadUseCase {
  constructor(@Inject(NOTIFICATION_REPOSITORY) private readonly notifications: NotificationRepositoryPort) {}

  // Scope par userId côté repository (pas de findById préalable) : marquer comme lue
  // la notification d'un autre utilisateur devient un no-op silencieux plutôt qu'une
  // fuite d'information via un 404/403 qui confirmerait l'existence de l'id.
  async execute(userId: string, notificationId: string): Promise<void> {
    await this.notifications.markRead(notificationId, userId);
  }
}
