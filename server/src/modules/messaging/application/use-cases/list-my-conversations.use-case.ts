import { Inject, Injectable } from '@nestjs/common';
import { BOOKING_REPOSITORY, BookingRepositoryPort } from '../../../bookings/domain/booking.repository.port';
import { CONVERSATION_REPOSITORY, ConversationRepositoryPort } from '../../domain/conversation.repository.port';

@Injectable()
export class ListMyConversationsUseCase {
  constructor(
    @Inject(BOOKING_REPOSITORY) private readonly bookings: BookingRepositoryPort,
    @Inject(CONVERSATION_REPOSITORY) private readonly conversations: ConversationRepositoryPort,
  ) {}

  async execute(userId: string, role: 'acheteur' | 'technicien', page: number, pageSize: number) {
    const bookingPage =
      role === 'acheteur'
        ? await this.bookings.findByBuyerId(userId, page, pageSize)
        : await this.bookings.findByTechnicianUserId(userId, page, pageSize);

    const items = await Promise.all(
      bookingPage.items.map(async (booking) => {
        const conversation =
          (await this.conversations.findByBookingId(booking.id)) ?? (await this.conversations.createForBooking(booking.id));
        const [lastMessage, unreadCount] = await Promise.all([
          this.conversations.lastMessage(conversation.id),
          this.conversations.countUnread(conversation.id, userId),
        ]);

        return {
          bookingId: booking.id,
          interlocutorName: role === 'acheteur' ? booking.technicianFullName : booking.buyerFullName,
          propertyAddress: booking.propertyAddress,
          lastMessage,
          unreadCount,
        };
      }),
    );

    return { ...bookingPage, items };
  }
}
