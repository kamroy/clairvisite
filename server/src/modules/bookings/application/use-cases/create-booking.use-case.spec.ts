import { ConflictException } from '@nestjs/common';
import { CreateBookingUseCase } from './create-booking.use-case';
import {
  BookingRepositoryPort,
  SlotAlreadyBookedError,
  TechnicianNotAvailableError,
} from '../../domain/booking.repository.port';
import { BookingEmailNotifierPort } from '../ports/booking-email-notifier.port';

function makeRepo(overrides: Partial<BookingRepositoryPort> = {}): jest.Mocked<BookingRepositoryPort> {
  return {
    findById: jest.fn(),
    findByIdWithDetails: jest.fn(),
    findByBuyerId: jest.fn(),
    findByTechnicianUserId: jest.fn(),
    findAllWithDetails: jest.fn(),
    setStatus: jest.fn(),
    createIfSlotAvailable: jest.fn(),
    ...overrides,
  } as jest.Mocked<BookingRepositoryPort>;
}

function makeNotifier(overrides: Partial<BookingEmailNotifierPort> = {}): jest.Mocked<BookingEmailNotifierPort> {
  return {
    sendConfirmation: jest.fn().mockResolvedValue(undefined),
    sendCancellation: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  } as jest.Mocked<BookingEmailNotifierPort>;
}

const input = {
  availabilityId: 'slot-1',
  buyerId: 'buyer-1',
  buyerPhone: '0600000000',
  propertyAddress: '1 rue de Paris',
};

describe('CreateBookingUseCase', () => {
  it('crée la réservation quand le créneau est libre', async () => {
    const booking = { id: 'booking-1', ...input, status: 'confirmed' } as any;
    const repo = makeRepo({ createIfSlotAvailable: jest.fn().mockResolvedValue(booking) });
    const notifier = makeNotifier();
    const useCase = new CreateBookingUseCase(repo, notifier);

    const result = await useCase.execute(input);

    expect(result).toBe(booking);
    expect(repo.createIfSlotAvailable).toHaveBeenCalledWith(input);
  });

  it('transmet les champs propres à une consultation déco (US-BOOK-03)', async () => {
    const decoInput = {
      ...input,
      roomsConcerned: ['Salon', 'Cuisine'],
      projectDescription: 'Rafraîchir le salon et la cuisine, style scandinave.',
    };
    const booking = { id: 'booking-1', ...decoInput, status: 'confirmed' } as any;
    const repo = makeRepo({ createIfSlotAvailable: jest.fn().mockResolvedValue(booking) });
    const useCase = new CreateBookingUseCase(repo, makeNotifier());

    const result = await useCase.execute(decoInput);

    expect(result).toBe(booking);
    expect(repo.createIfSlotAvailable).toHaveBeenCalledWith(decoInput);
  });

  it("traduit SlotAlreadyBookedError en 409 (règle métier anti double-réservation)", async () => {
    const repo = makeRepo({
      createIfSlotAvailable: jest.fn().mockRejectedValue(new SlotAlreadyBookedError()),
    });
    const useCase = new CreateBookingUseCase(repo, makeNotifier());

    await expect(useCase.execute(input)).rejects.toBeInstanceOf(ConflictException);
  });

  // Régression : la modération admin doit bloquer la réservation elle-même, pas
  // seulement la visibilité de recherche (voir aussi get-technician.use-case.spec.ts).
  it('traduit TechnicianNotAvailableError en 409 (technicien non approuvé)', async () => {
    const repo = makeRepo({
      createIfSlotAvailable: jest.fn().mockRejectedValue(new TechnicianNotAvailableError()),
    });
    const useCase = new CreateBookingUseCase(repo, makeNotifier());

    await expect(useCase.execute(input)).rejects.toBeInstanceOf(ConflictException);
  });

  it("renvoie la réservation même si l'envoi de l'email de confirmation échoue (asynchrone, non bloquant)", async () => {
    const booking = { id: 'booking-1', ...input, status: 'confirmed' } as any;
    const repo = makeRepo({ createIfSlotAvailable: jest.fn().mockResolvedValue(booking) });
    const notifier = makeNotifier({ sendConfirmation: jest.fn().mockRejectedValue(new Error('resend down')) });
    const useCase = new CreateBookingUseCase(repo, notifier);

    const result = await useCase.execute(input);

    expect(result).toBe(booking);
  });

  it('propage les erreurs inattendues du repository', async () => {
    const repo = makeRepo({ createIfSlotAvailable: jest.fn().mockRejectedValue(new Error('db down')) });
    const useCase = new CreateBookingUseCase(repo, makeNotifier());

    await expect(useCase.execute(input)).rejects.toThrow('db down');
  });
});
