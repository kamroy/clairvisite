import { ListTechnicianBookingsUseCase } from './list-technician-bookings.use-case';
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

describe('ListTechnicianBookingsUseCase', () => {
  it("transmet l'id utilisateur du technicien et la pagination au repository", async () => {
    const page = { items: [], page: 1, pageSize: 12, hasMore: true };
    const bookings = makeRepo({ findByTechnicianUserId: jest.fn().mockResolvedValue(page) });
    const useCase = new ListTechnicianBookingsUseCase(bookings);

    const result = await useCase.execute('user-1', 1, 12);

    expect(bookings.findByTechnicianUserId).toHaveBeenCalledWith('user-1', 1, 12);
    expect(result).toBe(page);
  });
});
