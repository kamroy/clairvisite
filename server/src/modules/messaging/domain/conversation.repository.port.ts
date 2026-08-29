import { Conversation, Message } from './conversation.entity';

export const CONVERSATION_REPOSITORY = Symbol('CONVERSATION_REPOSITORY');

export interface CreateMessageData {
  conversationId: string;
  senderId: string;
  content?: string | null;
  attachmentKey?: string | null;
  attachmentFileName?: string | null;
}

export interface ConversationRepositoryPort {
  findByBookingId(bookingId: string): Promise<Conversation | null>;
  createForBooking(bookingId: string): Promise<Conversation>;
  listMessages(conversationId: string): Promise<Message[]>;
  createMessage(data: CreateMessageData): Promise<Message>;
  lastMessage(conversationId: string): Promise<Message | null>;
  countUnread(conversationId: string, forUserId: string): Promise<number>;
  // Marque comme lus tous les messages du fil qui ne viennent pas de `readerId`.
  markReadForUser(conversationId: string, readerId: string): Promise<void>;
}
