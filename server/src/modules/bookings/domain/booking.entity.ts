export type BookingStatus = 'confirmed' | 'cancelled';
export type PropertyType = 'apartment' | 'house';

export class Booking {
  constructor(
    public readonly id: string,
    public readonly availabilityId: string,
    public readonly buyerId: string,
    public readonly buyerPhone: string,
    public readonly propertyAddress: string,
    public readonly status: BookingStatus,
    public readonly createdAt: Date,
    // Optionnels avec valeur par défaut : évite de casser les call sites positionnels
    // existants (tests, fakes) — collectés par l'étape 1 du tunnel de réservation.
    public readonly propertyType: PropertyType | null = null,
    public readonly surfaceM2: number | null = null,
  ) {}
}
