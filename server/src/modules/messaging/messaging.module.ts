import { Module } from '@nestjs/common';
import { BookingsModule } from '../bookings/bookings.module';
import { MessagingController } from './infrastructure/http/messaging.controller';
import { CONVERSATION_REPOSITORY } from './domain/conversation.repository.port';
import { PrismaConversationRepository } from './infrastructure/persistence/prisma-conversation.repository';
import { ListMyConversationsUseCase } from './application/use-cases/list-my-conversations.use-case';
import { GetConversationMessagesUseCase } from './application/use-cases/get-conversation-messages.use-case';
import { SendMessageUseCase } from './application/use-cases/send-message.use-case';
import { RequestMessageAttachmentUploadUrlUseCase } from './application/use-cases/request-message-attachment-upload-url.use-case';

// Importe BookingsModule pour BOOKING_REPOSITORY (déterminer l'interlocuteur et
// vérifier qui a le droit de voir/écrire dans une conversation) — même schéma que
// ReportsModule -> BookingsModule. FILE_STORAGE vient de StorageModule (@Global()).
@Module({
  imports: [BookingsModule],
  controllers: [MessagingController],
  providers: [
    ListMyConversationsUseCase,
    GetConversationMessagesUseCase,
    SendMessageUseCase,
    RequestMessageAttachmentUploadUrlUseCase,
    { provide: CONVERSATION_REPOSITORY, useClass: PrismaConversationRepository },
  ],
})
export class MessagingModule {}
