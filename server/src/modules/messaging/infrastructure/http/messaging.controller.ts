import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../../../../common/decorators/current-user.decorator';
import { ListMyConversationsUseCase } from '../../application/use-cases/list-my-conversations.use-case';
import { GetConversationMessagesUseCase } from '../../application/use-cases/get-conversation-messages.use-case';
import { SendMessageUseCase } from '../../application/use-cases/send-message.use-case';
import { RequestMessageAttachmentUploadUrlUseCase } from '../../application/use-cases/request-message-attachment-upload-url.use-case';
import { RequestAttachmentUploadUrlDto, SendMessageDto } from './messaging.dto';

@Controller('conversations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('acheteur', 'technicien')
export class MessagingController {
  constructor(
    private readonly listMyConversations: ListMyConversationsUseCase,
    private readonly getMessages: GetConversationMessagesUseCase,
    private readonly sendMessage: SendMessageUseCase,
    private readonly requestUploadUrl: RequestMessageAttachmentUploadUrlUseCase,
  ) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser, @Query() pagination: PaginationQueryDto) {
    return this.listMyConversations.execute(
      user.sub,
      user.role as 'acheteur' | 'technicien',
      pagination.page,
      pagination.pageSize,
    );
  }

  @Get(':bookingId/messages')
  messages(@Param('bookingId') bookingId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.getMessages.execute(user.sub, bookingId);
  }

  @Post(':bookingId/messages')
  send(@Param('bookingId') bookingId: string, @CurrentUser() user: AuthenticatedUser, @Body() dto: SendMessageDto) {
    return this.sendMessage.execute(
      user.sub,
      bookingId,
      dto.content ?? null,
      dto.attachment_key ?? null,
      dto.attachment_file_name ?? null,
    );
  }

  @Post(':bookingId/attachments/upload-url')
  requestUrl(
    @Param('bookingId') bookingId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RequestAttachmentUploadUrlDto,
  ) {
    return this.requestUploadUrl.execute(user.sub, bookingId, dto.file_name, dto.content_type);
  }
}
