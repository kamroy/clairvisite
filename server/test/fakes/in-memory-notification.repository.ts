import { randomUUID } from 'crypto';
import { Notification } from '../../src/modules/notifications/domain/notification.entity';
import {
  CreateNotificationData,
  NotificationRepositoryPort,
} from '../../src/modules/notifications/domain/notification.repository.port';
import { toPageResult } from '../../src/common/pagination';

export class InMemoryNotificationRepository implements NotificationRepositoryPort {
  private readonly notifications = new Map<string, Notification>();

  async create(data: CreateNotificationData): Promise<Notification> {
    const notification = new Notification(
      randomUUID(),
      data.userId,
      data.category,
      data.title,
      data.body ?? null,
      data.ctaLabel ?? null,
      data.ctaUrl ?? null,
      false,
      new Date(),
    );
    this.notifications.set(notification.id, notification);
    return notification;
  }

  async findByUserId(userId: string, page: number, pageSize: number) {
    // Repart de l'ordre d'insertion inversé avant le tri par date : évite un ordre non
    // déterministe quand deux notifications partagent le même timestamp à la milliseconde
    // près (Array.sort est stable, donc les égalités gardent "plus récemment créée d'abord").
    const rows = [...this.notifications.values()]
      .reverse()
      .filter((n) => n.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const start = (page - 1) * pageSize;
    return toPageResult(rows.slice(start, start + pageSize + 1), page, pageSize);
  }

  async countUnread(userId: string): Promise<number> {
    return [...this.notifications.values()].filter((n) => n.userId === userId && !n.isRead).length;
  }

  async markRead(id: string, userId: string): Promise<void> {
    const existing = this.notifications.get(id);
    if (!existing || existing.userId !== userId) return;
    this.notifications.set(
      id,
      new Notification(
        existing.id,
        existing.userId,
        existing.category,
        existing.title,
        existing.body,
        existing.ctaLabel,
        existing.ctaUrl,
        true,
        existing.createdAt,
      ),
    );
  }

  async markAllRead(userId: string): Promise<void> {
    for (const [id, n] of this.notifications) {
      if (n.userId === userId && !n.isRead) {
        this.notifications.set(
          id,
          new Notification(n.id, n.userId, n.category, n.title, n.body, n.ctaLabel, n.ctaUrl, true, n.createdAt),
        );
      }
    }
  }
}
