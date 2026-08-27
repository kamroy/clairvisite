import { ListBuyerBookingsUseCase } from './list-buyer-bookings.use-case';
import { BookingRepositoryPort } from '../../domain/booking.repository.port';

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

describe('ListBuyerBookingsUseCase', () => {
  it("transmet l'id acheteur et la pagination au repository", async () => {
    const page = { items: [], page: 2, pageSize: 5, hasMore: false };
    const bookings = makeRepo({ findByBuyerId: jest.fn().mockResolvedValue(page) });
    const useCase = new ListBuyerBookingsUseCase(bookings);

    const result = await useCase.execute('buyer-1', 2, 5);

    expect(bookings.findByBuyerId).toHaveBeenCalledWith('buyer-1', 2, 5);
    expect(result).toBe(page);
  });
});
