export class Message {
  constructor(
    public readonly id: string,
    public readonly conversationId: string,
    public readonly senderId: string,
    public readonly content: string | null,
    public readonly attachmentKey: string | null,
    public readonly attachmentFileName: string | null,
    public readonly createdAt: Date,
    public readonly readAt: Date | null,
  ) {}
}

export class Conversation {
  constructor(
    public readonly id: string,
    public readonly bookingId: string,
    public readonly createdAt: Date,
  ) {}
}
