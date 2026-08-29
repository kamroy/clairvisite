import { PageResult } from '../../../common/pagination';
import { Notification, NotificationCategory } from './notification.entity';

export const NOTIFICATION_REPOSITORY = Symbol('NOTIFICATION_REPOSITORY');

export interface CreateNotificationData {
  userId: string;
  category: NotificationCategory;
  title: string;
  body?: string | null;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
}

export interface NotificationRepositoryPort {
  create(data: CreateNotificationData): Promise<Notification>;
  findByUserId(userId: string, page: number, pageSize: number): Promise<PageResult<Notification>>;
  countUnread(userId: string): Promise<number>;
  markRead(id: string, userId: string): Promise<void>;
  markAllRead(userId: string): Promise<void>;
}
