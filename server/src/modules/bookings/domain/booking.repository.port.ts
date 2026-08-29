import { PageResult } from '../../../common/pagination';
import { Booking, BookingStatus, PropertyType } from './booking.entity';

export const BOOKING_REPOSITORY = Symbol('BOOKING_REPOSITORY');

// Dupliqué depuis technicians/domain/technician.entity.ts plutôt qu'importé : les
// domaines des modules restent indépendants les uns des autres (aucun module ne
// dépend du domain/ d'un autre) — seule l'infrastructure (adapters Prisma) a le droit
// de tout connaître via ses jointures.
export type TechnicianCategory = 'technique' | 'decoration' | 'architecture';

export interface CreateBookingData {
  availabilityId: string;
  buyerId: string;
  buyerPhone: string;
  propertyAddress: string;
  propertyType?: PropertyType;
  surfaceM2?: number;
  roomsConcerned?: string[];
  projectDescription?: string;
}

// Vue enrichie utilisée pour l'email de confirmation et les écrans de détail —
// évite que le domaine Booking dépende des entités Technician/User/Availability.
export interface BookingWithDetails extends Booking {
  technicianUserId: string;
  technicianFullName: string;
  technicianEmail: string;
  technicianPhone: string;
  // Dérivée par jointure (pas persistée sur Booking) : permet d'afficher "Contre-visite
  // technique" vs "Consultation déco" sans dupliquer une donnée qui vit déjà sur
  // Technician et pourrait devenir incohérente si elle était copiée à la création.
  technicianCategory: TechnicianCategory;
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
