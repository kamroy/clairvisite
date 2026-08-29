import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/persistence/prisma/prisma.service';
import { toPageResult } from '../../../../common/pagination';
import { Notification } from '../../domain/notification.entity';
import { CreateNotificationData, NotificationRepositoryPort } from '../../domain/notification.repository.port';

function toDomain(row: any): Notification {
  return new Notification(
    row.id,
    row.userId,
    row.category,
    row.title,
    row.body,
    row.ctaLabel,
    row.ctaUrl,
    row.isRead,
    row.createdAt,
  );
}

@Injectable()
export class PrismaNotificationRepository implements NotificationRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateNotificationData): Promise<Notification> {
    const row = await this.prisma.notification.create({
      data: {
        userId: data.userId,
        category: data.category,
        title: data.title,
        body: data.body ?? null,
        ctaLabel: data.ctaLabel ?? null,
        ctaUrl: data.ctaUrl ?? null,
      },
    });
    return toDomain(row);
  }

  async findByUserId(userId: string, page: number, pageSize: number) {
    const rows = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize + 1,
    });
    return toPageResult(rows.map(toDomain), page, pageSize);
  }

  async countUnread(userId: string): Promise<number> {
    return this.prisma.notification.count({ where: { userId, isRead: false } });
  }

  async markRead(id: string, userId: string): Promise<void> {
    await this.prisma.notification.updateMany({ where: { id, userId }, data: { isRead: true } });
  }

  async markAllRead(userId: string): Promise<void> {
    await this.prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
  }
}
