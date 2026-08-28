import { randomUUID } from 'crypto';
import { PageResult, toPageResult } from '../../src/common/pagination';
import { Booking, BookingStatus } from '../../src/modules/bookings/domain/booking.entity';
import {
  BookingRepositoryPort,
  BookingWithDetails,
  CreateBookingData,
  SlotAlreadyBookedError,
  TechnicianNotAvailableError,
} from '../../src/modules/bookings/domain/booking.repository.port';
import { InMemoryAvailabilityRepository } from './in-memory-availability.repository';
import { InMemoryTechnicianRepository } from './in-memory-technician.repository';
import { InMemoryUserRepository } from './in-memory-user.repository';

export class InMemoryBookingRepository implements BookingRepositoryPort {
  private readonly bookings = new Map<string, Booking>();

  constructor(
    private readonly availabilities: InMemoryAvailabilityRepository,
    private readonly technicians: InMemoryTechnicianRepository,
    private readonly users: InMemoryUserRepository,
  ) {}

  async findById(id: string): Promise<Booking | null> {
    return this.bookings.get(id) ?? null;
  }

  private async hydrate(booking: Booking): Promise<BookingWithDetails> {
    const slot = await this.availabilities.findById(booking.availabilityId);
    if (!slot) throw new Error('InMemoryBookingRepository: slot missing for booking');
    const technician = await this.technicians.findById(slot.technicianId);
    if (!technician) throw new Error('InMemoryBookingRepository: technician missing for booking');
    const technicianUser = await this.users.findById(technician.userId);
    const buyer = await this.users.findById(booking.buyerId);

    return Object.assign(Object.create(Booking.prototype), booking, {
      technicianUserId: technician.userId,
      technicianFullName: technicianUser?.fullName ?? '',
      technicianEmail: technicianUser?.email ?? '',
      technicianPhone: technician.phone,
      buyerEmail: buyer?.email ?? '',
      buyerFullName: buyer?.fullName ?? '',
      slotStart: slot.startDatetime,
    });
  }

  async findByIdWithDetails(id: string): Promise<BookingWithDetails | null> {
    const booking = this.bookings.get(id);
    return booking ? this.hydrate(booking) : null;
  }

  private paginateDetails(
    details: BookingWithDetails[],
    page: number,
    pageSize: number,
  ): PageResult<BookingWithDetails> {
    const sorted = [...details].sort((a, b) => a.slotStart.getTime() - b.slotStart.getTime());
    const start = (page - 1) * pageSize;
    return toPageResult(sorted.slice(start, start + pageSize + 1), page, pageSize);
  }

  async findByBuyerId(buyerId: string, page: number, pageSize: number): Promise<PageResult<BookingWithDetails>> {
    const mine = [...this.bookings.values()].filter((b) => b.buyerId === buyerId && b.status === 'confirmed');
    const details = await Promise.all(mine.map((b) => this.hydrate(b)));
    return this.paginateDetails(details, page, pageSize);
  }

  async findByTechnicianUserId(
    technicianUserId: string,
    page: number,
    pageSize: number,
  ): Promise<PageResult<BookingWithDetails>> {
    const mine: Booking[] = [];
    for (const booking of this.bookings.values()) {
      if (booking.status !== 'confirmed') continue;
      const slot = await this.availabilities.findById(booking.availabilityId);
      const technician = slot ? await this.technicians.findById(slot.technicianId) : null;
      if (technician?.userId === technicianUserId) mine.push(booking);
    }
    const details = await Promise.all(mine.map((b) => this.hydrate(b)));
    return this.paginateDetails(details, page, pageSize);
  }

  async findAllWithDetails(page: number, pageSize: number): Promise<PageResult<BookingWithDetails>> {
    const details = await Promise.all([...this.bookings.values()].map((b) => this.hydrate(b)));
    return this.paginateDetails(details, page, pageSize);
  }

  async setStatus(id: string, status: BookingStatus): Promise<void> {
    const existing = this.bookings.get(id);
    if (!existing) throw new Error(`InMemoryBookingRepository: booking ${id} not found`);
    this.bookings.set(
      id,
      new Booking(
        existing.id,
        existing.availabilityId,
        existing.buyerId,
        existing.buyerPhone,
        existing.propertyAddress,
        status,
        existing.createdAt,
        existing.propertyType,
        existing.surfaceM2,
      ),
    );
    if (status === 'confirmed') this.availabilities.tryReserve(existing.availabilityId);
    else this.availabilities.release(existing.availabilityId);
  }

  // Émule la transaction Prisma `$transaction` (vérification + marquage du créneau +
  // création dans la même opération atomique) : `tryReserve` fait le check-then-set sans
  // `await` intermédiaire, ce qui garantit qu'un seul appel concurrent peut réussir.
  async createIfSlotAvailable(data: CreateBookingData): Promise<BookingWithDetails> {
    const slot = await this.availabilities.findById(data.availabilityId);
    if (slot) {
      const technician = await this.technicians.findById(slot.technicianId);
      if (!technician || technician.status !== 'approved') throw new TechnicianNotAvailableError();
    }

    const reserved = this.availabilities.tryReserve(data.availabilityId);
    if (!reserved) throw new SlotAlreadyBookedError();

    const booking = new Booking(
      randomUUID(),
      data.availabilityId,
      data.buyerId,
      data.buyerPhone,
      data.propertyAddress,
      'confirmed',
      new Date(),
      data.propertyType ?? null,
      data.surfaceM2 ?? null,
    );
    this.bookings.set(booking.id, booking);
    return this.hydrate(booking);
  }
}
