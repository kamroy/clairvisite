import { Inject, Injectable } from '@nestjs/common';
import { NOTIFICATION_REPOSITORY, NotificationRepositoryPort } from '../../domain/notification.repository.port';

@Injectable()
export class MarkAllNotificationsReadUseCase {
  constructor(@Inject(NOTIFICATION_REPOSITORY) private readonly notifications: NotificationRepositoryPort) {}

  async execute(userId: string): Promise<void> {
    await this.notifications.markAllRead(userId);
  }
}
