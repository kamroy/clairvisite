import { Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../../../../common/decorators/current-user.decorator';
import { ListMyNotificationsUseCase } from '../../application/use-cases/list-my-notifications.use-case';
import { MarkNotificationReadUseCase } from '../../application/use-cases/mark-notification-read.use-case';
import { MarkAllNotificationsReadUseCase } from '../../application/use-cases/mark-all-notifications-read.use-case';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(
    private readonly listMyNotifications: ListMyNotificationsUseCase,
    private readonly markRead: MarkNotificationReadUseCase,
    private readonly markAllRead: MarkAllNotificationsReadUseCase,
  ) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser, @Query() pagination: PaginationQueryDto) {
    return this.listMyNotifications.execute(user.sub, pagination.page, pagination.pageSize);
  }

  @Patch(':id/read')
  read(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.markRead.execute(user.sub, id);
  }

  @Patch('read-all')
  readAll(@CurrentUser() user: AuthenticatedUser) {
    return this.markAllRead.execute(user.sub);
  }
}
