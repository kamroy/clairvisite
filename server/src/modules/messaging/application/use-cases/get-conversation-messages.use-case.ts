import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { BOOKING_REPOSITORY, BookingRepositoryPort } from '../../../bookings/domain/booking.repository.port';
import { CONVERSATION_REPOSITORY, ConversationRepositoryPort } from '../../domain/conversation.repository.port';
import { FILE_STORAGE, FileStoragePort } from '../../../../infrastructure/storage/file-storage.port';

@Injectable()
export class GetConversationMessagesUseCase {
  constructor(
    @Inject(BOOKING_REPOSITORY) private readonly bookings: BookingRepositoryPort,
    @Inject(CONVERSATION_REPOSITORY) private readonly conversations: ConversationRepositoryPort,
    @Inject(FILE_STORAGE) private readonly storage: FileStoragePort,
  ) {}

  async execute(userId: string, bookingId: string) {
    const booking = await this.bookings.findByIdWithDetails(bookingId);
    if (!booking) throw new NotFoundException('Réservation introuvable.');
    if (booking.buyerId !== userId && booking.technicianUserId !== userId) {
      throw new ForbiddenException("Cette conversation ne vous appartient pas.");
    }

    const conversation =
      (await this.conversations.findByBookingId(bookingId)) ?? (await this.conversations.createForBooking(bookingId));

    // Marque comme lus les messages de l'autre partie avant de renvoyer le fil — on
    // considère qu'ouvrir la conversation revient à en prendre connaissance.
    await this.conversations.markReadForUser(conversation.id, userId);
    const messages = await this.conversations.listMessages(conversation.id);
    const enriched = await Promise.all(
      messages.map(async (m) => ({
        ...m,
        attachmentDownloadUrl: m.attachmentKey ? await this.storage.getDownloadUrl(m.attachmentKey) : null,
      })),
    );

    return {
      conversationId: conversation.id,
      messages: enriched,
      booking: {
        // Calculé côté serveur plutôt que de renvoyer les deux noms et laisser le
        // client deviner lequel est "l'autre partie" : plus sûr et plus simple.
        interlocutorName: booking.buyerId === userId ? booking.technicianFullName : booking.buyerFullName,
        propertyAddress: booking.propertyAddress,
        slotStart: booking.slotStart,
      },
    };
  }
}
