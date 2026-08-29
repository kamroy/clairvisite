import { BadRequestException, ForbiddenException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { BOOKING_REPOSITORY, BookingRepositoryPort } from '../../../bookings/domain/booking.repository.port';
import { CONVERSATION_REPOSITORY, ConversationRepositoryPort } from '../../domain/conversation.repository.port';
import { FILE_STORAGE, FileStoragePort } from '../../../../infrastructure/storage/file-storage.port';
import {
  NOTIFICATION_PUBLISHER,
  NotificationPublisherPort,
} from '../../../notifications/application/ports/notification-publisher.port';

@Injectable()
export class SendMessageUseCase {
  private readonly logger = new Logger(SendMessageUseCase.name);

  constructor(
    @Inject(BOOKING_REPOSITORY) private readonly bookings: BookingRepositoryPort,
    @Inject(CONVERSATION_REPOSITORY) private readonly conversations: ConversationRepositoryPort,
    @Inject(FILE_STORAGE) private readonly storage: FileStoragePort,
    @Inject(NOTIFICATION_PUBLISHER) private readonly notifications: NotificationPublisherPort,
  ) {}

  async execute(
    userId: string,
    bookingId: string,
    content: string | null,
    attachmentKey: string | null,
    attachmentFileName: string | null,
  ) {
    if (!content?.trim() && !attachmentKey) {
      throw new BadRequestException('Un message doit contenir du texte ou une pièce jointe.');
    }

    const booking = await this.bookings.findByIdWithDetails(bookingId);
    if (!booking) throw new NotFoundException('Réservation introuvable.');
    if (booking.buyerId !== userId && booking.technicianUserId !== userId) {
      throw new ForbiddenException("Cette conversation ne vous appartient pas.");
    }

    if (attachmentKey && !attachmentKey.startsWith(`messages/${bookingId}/`)) {
      throw new ForbiddenException('Clé de fichier invalide pour cette conversation.');
    }

    const conversation =
      (await this.conversations.findByBookingId(bookingId)) ?? (await this.conversations.createForBooking(bookingId));

    const message = await this.conversations.createMessage({
      conversationId: conversation.id,
      senderId: userId,
      content: content?.trim() || null,
      attachmentKey,
      attachmentFileName,
    });

    const isBuyerSender = booking.buyerId === userId;
    this.notifications
      .publish({
        userId: isBuyerSender ? booking.technicianUserId : booking.buyerId,
        category: booking.technicianCategory === 'decoration' ? 'decoration' : 'visite_technique',
        title: `Nouveau message de ${isBuyerSender ? booking.buyerFullName : booking.technicianFullName}`,
        body: message.content ?? 'Pièce jointe envoyée.',
        ctaLabel: 'Répondre',
        ctaUrl: `/messages/${bookingId}`,
      })
      .catch((err) => this.logger.error('Échec publication notification de message', err));

    return {
      ...message,
      attachmentDownloadUrl: message.attachmentKey ? await this.storage.getDownloadUrl(message.attachmentKey) : null,
    };
  }
}
