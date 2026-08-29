import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { CancelBookingUseCase } from './cancel-booking.use-case';
import { BookingRepositoryPort } from '../../domain/booking.repository.port';
import { BookingEmailNotifierPort } from '../ports/booking-email-notifier.port';
import { NotificationPublisherPort } from '../../../notifications/application/ports/notification-publisher.port';

function makeRepo(overrides: Partial<BookingRepositoryPort> = {}): jest.Mocked<BookingRepositoryPort> {
  return {
    findById: jest.fn(),
    findByIdWithDetails: jest.fn(),
    findByBuyerId: jest.fn(),
    findByTechnicianUserId: jest.fn(),
    findAllWithDetails: jest.fn(),
    setStatus: jest.fn().mockResolvedValue(undefined),
    createIfSlotAvailable: jest.fn(),
    ...overrides,
  } as jest.Mocked<BookingRepositoryPort>;
}

function makeNotifier(): jest.Mocked<BookingEmailNotifierPort> {
  return {
    sendConfirmation: jest.fn().mockResolvedValue(undefined),
    sendCancellation: jest.fn().mockResolvedValue(undefined),
  };
}

function makeNotificationPublisher(): jest.Mocked<NotificationPublisherPort> {
  return { publish: jest.fn().mockResolvedValue(undefined) };
}

const booking = {
  id: 'booking-1',
  buyerId: 'buyer-1',
  technicianUserId: 'tech-user-1',
  technicianCategory: 'technique',
  slotStart: new Date('2026-09-01T10:00:00Z'),
} as any;

describe('CancelBookingUseCase', () => {
  it('404 si la réservation n’existe pas', async () => {
    const repo = makeRepo({ findByIdWithDetails: jest.fn().mockResolvedValue(null) });
    const useCase = new CancelBookingUseCase(repo, makeNotifier(), makeNotificationPublisher());

    await expect(useCase.execute('missing', 'buyer-1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it("403 si l'appelant n'est ni l'acheteur ni le technicien de la réservation", async () => {
    const repo = makeRepo({ findByIdWithDetails: jest.fn().mockResolvedValue(booking) });
    const useCase = new CancelBookingUseCase(repo, makeNotifier(), makeNotificationPublisher());

    await expect(useCase.execute('booking-1', 'someone-else')).rejects.toBeInstanceOf(ForbiddenException);
    expect(repo.setStatus).not.toHaveBeenCalled();
  });

  it("annule quand l'appelant est l'acheteur", async () => {
    const repo = makeRepo({ findByIdWithDetails: jest.fn().mockResolvedValue(booking) });
    const useCase = new CancelBookingUseCase(repo, makeNotifier(), makeNotificationPublisher());

    await useCase.execute('booking-1', 'buyer-1');

    expect(repo.setStatus).toHaveBeenCalledWith('booking-1', 'cancelled');
  });

  it('annule quand l’appelant est le technicien concerné', async () => {
    const repo = makeRepo({ findByIdWithDetails: jest.fn().mockResolvedValue(booking) });
    const useCase = new CancelBookingUseCase(repo, makeNotifier(), makeNotificationPublisher());

    await useCase.execute('booking-1', 'tech-user-1');

    expect(repo.setStatus).toHaveBeenCalledWith('booking-1', 'cancelled');
  });
});
