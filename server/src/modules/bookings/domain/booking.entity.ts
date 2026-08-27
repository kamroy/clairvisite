export type BookingStatus = 'confirmed' | 'cancelled';

export class Booking {
  constructor(
    public readonly id: string,
    public readonly availabilityId: string,
    public readonly buyerId: string,
    public readonly buyerPhone: string,
    public readonly propertyAddress: string,
    public readonly status: BookingStatus,
    public readonly createdAt: Date,
  ) {}
}
