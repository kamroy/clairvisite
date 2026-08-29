import { Module } from '@nestjs/common';
import { NotificationsController } from './infrastructure/http/notifications.controller';
import { NOTIFICATION_REPOSITORY } from './domain/notification.repository.port';
import { PrismaNotificationRepository } from './infrastructure/persistence/prisma-notification.repository';
import { NOTIFICATION_PUBLISHER } from './application/ports/notification-publisher.port';
import { PublishNotificationUseCase } from './application/use-cases/publish-notification.use-case';
import { ListMyNotificationsUseCase } from './application/use-cases/list-my-notifications.use-case';
import { MarkNotificationReadUseCase } from './application/use-cases/mark-notification-read.use-case';
import { MarkAllNotificationsReadUseCase } from './application/use-cases/mark-all-notifications-read.use-case';

// Importé par bookings/reports/messaging pour NOTIFICATION_PUBLISHER (même sens de
// dépendance que reports/messaging -> bookings pour BOOKING_REPOSITORY) : ces modules
// émettent des notifications sans connaître le reste de ce module.
@Module({
  controllers: [NotificationsController],
  providers: [
    ListMyNotificationsUseCase,
    MarkNotificationReadUseCase,
    MarkAllNotificationsReadUseCase,
    { provide: NOTIFICATION_REPOSITORY, useClass: PrismaNotificationRepository },
    { provide: NOTIFICATION_PUBLISHER, useClass: PublishNotificationUseCase },
  ],
  exports: [NOTIFICATION_PUBLISHER],
})
export class NotificationsModule {}
