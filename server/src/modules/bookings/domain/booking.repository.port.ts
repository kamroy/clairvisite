import { PageResult } from '../../../common/pagination';
import { Booking, BookingStatus } from './booking.entity';

export const BOOKING_REPOSITORY = Symbol('BOOKING_REPOSITORY');

export interface CreateBookingData {
  availabilityId: string;
  buyerId: string;
  buyerPhone: string;
  propertyAddress: string;
}

// Vue enrichie utilisée pour l'email de confirmation et les écrans de détail —
// évite que le domaine Booking dépende des entités Technician/User/Availability.
export interface BookingWithDetails extends Booking {
  technicianUserId: string;
  technicianFullName: string;
  technicianEmail: string;
  technicianPhone: string;
  buyerEmail: string;
  buyerFullName: string;
  slotStart: Date;
}

export interface BookingRepositoryPort {
  findById(id: string): Promise<Booking | null>;
  findByIdWithDetails(id: string): Promise<BookingWithDetails | null>;
  findByBuyerId(buyerId: string, page: number, pageSize: number): Promise<PageResult<BookingWithDetails>>;
  findByTechnicianUserId(
    technicianUserId: string,
    page: number,
    pageSize: number,
  ): Promise<PageResult<BookingWithDetails>>;
  findAllWithDetails(page: number, pageSize: number): Promise<PageResult<BookingWithDetails>>;
  setStatus(id: string, status: BookingStatus): Promise<void>;

  // Opération transactionnelle : vérifie que le créneau est libre, le marque
  // réservé et crée la réservation dans la même transaction DB.
  // C'est le point d'implémentation critique identifié dans la spec (US-A3).
  createIfSlotAvailable(data: CreateBookingData): Promise<BookingWithDetails>;
}

export class SlotAlreadyBookedError extends Error {
  constructor() {
    super('Créneau déjà réservé');
    this.name = 'SlotAlreadyBookedError';
  }
}

// Contrôle défensif au moment de la réservation, en plus du filtrage déjà fait par
// search()/getById() : un technicien peut passer pending/rejected entre le chargement
// de sa fiche par l'acheteur et le clic sur "Réserver" (ou l'acheteur peut avoir gardé
// un onglet ouvert). Sans ce contrôle, la modération admin ne bloquerait jamais une
// réservation déjà initiée.
export class TechnicianNotAvailableError extends Error {
  constructor() {
    super('Ce technicien n’est pas disponible pour le moment');
    this.name = 'TechnicianNotAvailableError';
  }
}
