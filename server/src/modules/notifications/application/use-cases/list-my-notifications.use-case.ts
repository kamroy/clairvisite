import { Inject, Injectable } from '@nestjs/common';
import { NOTIFICATION_REPOSITORY, NotificationRepositoryPort } from '../../domain/notification.repository.port';

@Injectable()
export class ListMyNotificationsUseCase {
  constructor(@Inject(NOTIFICATION_REPOSITORY) private readonly notifications: NotificationRepositoryPort) {}

  async execute(userId: string, page: number, pageSize: number) {
    const [items, unreadCount] = await Promise.all([
      this.notifications.findByUserId(userId, page, pageSize),
      this.notifications.countUnread(userId),
    ]);
    return { ...items, unreadCount };
  }
}
