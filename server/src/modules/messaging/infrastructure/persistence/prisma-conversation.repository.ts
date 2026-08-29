import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/persistence/prisma/prisma.service';
import { Conversation, Message } from '../../domain/conversation.entity';
import { ConversationRepositoryPort, CreateMessageData } from '../../domain/conversation.repository.port';

function toConversation(row: any): Conversation {
  return new Conversation(row.id, row.bookingId, row.createdAt);
}

function toMessage(row: any): Message {
  return new Message(
    row.id,
    row.conversationId,
    row.senderId,
    row.content,
    row.attachmentKey,
    row.attachmentFileName,
    row.createdAt,
    row.readAt,
  );
}

@Injectable()
export class PrismaConversationRepository implements ConversationRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findByBookingId(bookingId: string): Promise<Conversation | null> {
    const row = await this.prisma.conversation.findUnique({ where: { bookingId } });
    return row ? toConversation(row) : null;
  }

  async createForBooking(bookingId: string): Promise<Conversation> {
    const row = await this.prisma.conversation.create({ data: { bookingId } });
    return toConversation(row);
  }

  async listMessages(conversationId: string): Promise<Message[]> {
    const rows = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map(toMessage);
  }

  async createMessage(data: CreateMessageData): Promise<Message> {
    const row = await this.prisma.message.create({
      data: {
        conversationId: data.conversationId,
        senderId: data.senderId,
        content: data.content ?? null,
        attachmentKey: data.attachmentKey ?? null,
        attachmentFileName: data.attachmentFileName ?? null,
      },
    });
    return toMessage(row);
  }

  async lastMessage(conversationId: string): Promise<Message | null> {
    const row = await this.prisma.message.findFirst({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
    });
    return row ? toMessage(row) : null;
  }

  async countUnread(conversationId: string, forUserId: string): Promise<number> {
    return this.prisma.message.count({
      where: { conversationId, senderId: { not: forUserId }, readAt: null },
    });
  }

  async markReadForUser(conversationId: string, readerId: string): Promise<void> {
    await this.prisma.message.updateMany({
      where: { conversationId, senderId: { not: readerId }, readAt: null },
      data: { readAt: new Date() },
    });
  }
}
