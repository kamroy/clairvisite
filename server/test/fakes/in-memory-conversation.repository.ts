import { randomUUID } from 'crypto';
import { Conversation, Message } from '../../src/modules/messaging/domain/conversation.entity';
import {
  ConversationRepositoryPort,
  CreateMessageData,
} from '../../src/modules/messaging/domain/conversation.repository.port';

export class InMemoryConversationRepository implements ConversationRepositoryPort {
  private readonly conversations = new Map<string, Conversation>();
  private readonly messages = new Map<string, Message[]>();

  async findByBookingId(bookingId: string): Promise<Conversation | null> {
    return [...this.conversations.values()].find((c) => c.bookingId === bookingId) ?? null;
  }

  async createForBooking(bookingId: string): Promise<Conversation> {
    const conversation = new Conversation(randomUUID(), bookingId, new Date());
    this.conversations.set(conversation.id, conversation);
    this.messages.set(conversation.id, []);
    return conversation;
  }

  async listMessages(conversationId: string): Promise<Message[]> {
    return [...(this.messages.get(conversationId) ?? [])].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async createMessage(data: CreateMessageData): Promise<Message> {
    const message = new Message(
      randomUUID(),
      data.conversationId,
      data.senderId,
      data.content ?? null,
      data.attachmentKey ?? null,
      data.attachmentFileName ?? null,
      new Date(),
      null,
    );
    const list = this.messages.get(data.conversationId) ?? [];
    list.push(message);
    this.messages.set(data.conversationId, list);
    return message;
  }

  async lastMessage(conversationId: string): Promise<Message | null> {
    const list = await this.listMessages(conversationId);
    return list[list.length - 1] ?? null;
  }

  async countUnread(conversationId: string, forUserId: string): Promise<number> {
    const list = this.messages.get(conversationId) ?? [];
    return list.filter((m) => m.senderId !== forUserId && !m.readAt).length;
  }

  async markReadForUser(conversationId: string, readerId: string): Promise<void> {
    const list = this.messages.get(conversationId) ?? [];
    this.messages.set(
      conversationId,
      list.map((m) =>
        m.senderId !== readerId && !m.readAt
          ? new Message(m.id, m.conversationId, m.senderId, m.content, m.attachmentKey, m.attachmentFileName, m.createdAt, new Date())
          : m,
      ),
    );
  }
}
