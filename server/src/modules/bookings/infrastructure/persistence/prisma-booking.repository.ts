import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/persistence/prisma/prisma.service';
import { PageResult, toPageResult } from '../../../../common/pagination';
import { Booking, BookingStatus } from '../../domain/booking.entity';
import {
  BookingRepositoryPort,
  BookingWithDetails,
  CreateBookingData,
  SlotAlreadyBookedError,
  TechnicianNotAvailableError,
} from '../../domain/booking.repository.port';

function toDomain(row: any): Booking {
  return new Booking(
    row.id,
    row.availabilityId,
    row.buyerId,
    row.buyerPhone,
    row.propertyAddress,
    row.status,
    row.createdAt,
    row.propertyType,
    row.surfaceM2,
    row.roomsConcerned,
    row.projectDescription,
  );
}

function toDetails(row: any): BookingWithDetails {
  return Object.assign(toDomain(row), {
    technicianUserId: row.availability.technician.userId,
    technicianFullName: row.availability.technician.user.fullName,
    technicianEmail: row.availability.technician.user.email,
    technicianPhone: row.availability.technician.phone,
    technicianCategory: row.availability.technician.category,
    buyerEmail: row.buyer.email,
    buyerFullName: row.buyer.fullName,
    slotStart: row.availability.startDatetime,
  });
}

const detailsInclude = {
  buyer: true,
  availability: { include: { technician: { include: { user: true } } } },
};

@Injectable()
export class PrismaBookingRepository implements BookingRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Booking | null> {
    const row = await this.prisma.booking.findUnique({ where: { id } });
    return row ? toDomain(row) : null;
  }

  async findByIdWithDetails(id: string): Promise<BookingWithDetails | null> {
    const row = await this.prisma.booking.findUnique({ where: { id }, include: detailsInclude });
    return row ? toDetails(row) : null;
  }

  async findByBuyerId(buyerId: string, page: number, pageSize: number): Promise<PageResult<BookingWithDetails>> {
    const rows = await this.prisma.booking.findMany({
      where: { buyerId, status: 'confirmed' },
      include: detailsInclude,
      orderBy: { availability: { startDatetime: 'asc' } },
      skip: (page - 1) * pageSize,
      take: pageSize + 1,
    });
    return toPageResult(rows.map(toDetails), page, pageSize);
  }

  async findByTechnicianUserId(
    technicianUserId: string,
    page: number,
    pageSize: number,
  ): Promise<PageResult<BookingWithDetails>> {
    const rows = await this.prisma.booking.findMany({
      where: { status: 'confirmed', availability: { technician: { userId: technicianUserId } } },
      include: detailsInclude,
      orderBy: { availability: { startDatetime: 'asc' } },
      skip: (page - 1) * pageSize,
      take: pageSize + 1,
    });
    return toPageResult(rows.map(toDetails), page, pageSize);
  }

  async findAllWithDetails(page: number, pageSize: number): Promise<PageResult<BookingWithDetails>> {
    const rows = await this.prisma.booking.findMany({
      include: detailsInclude,
      orderBy: { availability: { startDatetime: 'asc' } },
      skip: (page - 1) * pageSize,
      take: pageSize + 1,
    });
    return toPageResult(rows.map(toDetails), page, pageSize);
  }

  async setStatus(id: string, status: BookingStatus): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const booking = await tx.booking.update({ where: { id }, data: { status } });
      await tx.availability.update({
        where: { id: booking.availabilityId },
        data: { isBooked: status === 'confirmed' },
      });
    });
  }

  async createIfSlotAvailable(data: CreateBookingData): Promise<BookingWithDetails> {
    const row = await this.prisma.$transaction(async (tx) => {
      // SELECT ... FOR UPDATE implicite : Prisma verrouille la ligne le temps
      // de la transaction, ce qui empêche deux réservations concurrentes sur
      // le même créneau (cf. point d'attention "concurrence" de la spec).
      const slot = await tx.availability.findUnique({
        where: { id: data.availabilityId },
        include: { technician: true },
      });
      if (!slot || slot.isBooked) throw new SlotAlreadyBookedError();
      if (slot.technician.status !== 'approved') throw new TechnicianNotAvailableError();

      await tx.availability.update({ where: { id: data.availabilityId }, data: { isBooked: true } });

      return tx.booking.create({
        data: {
          availabilityId: data.availabilityId,
          buyerId: data.buyerId,
          buyerPhone: data.buyerPhone,
          propertyAddress: data.propertyAddress,
          propertyType: data.propertyType,
          surfaceM2: data.surfaceM2,
          roomsConcerned: data.roomsConcerned ?? [],
          projectDescription: data.projectDescription,
        },
        include: detailsInclude,
      });
    });

    return toDetails(row);
  }
}
