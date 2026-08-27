import { NotFoundException } from '@nestjs/common';
import { UpdateMyProfileUseCase } from './update-my-profile.use-case';
import { UserRepositoryPort } from '../domain/user.repository.port';

function makeUsers(overrides: Partial<UserRepositoryPort> = {}): jest.Mocked<UserRepositoryPort> {
  return {
    findById: jest.fn(),
    findByEmail: jest.fn(),
    findByOidcSubject: jest.fn(),
    create: jest.fn(),
    updateProfile: jest.fn(),
    ...overrides,
  } as jest.Mocked<UserRepositoryPort>;
}

describe('UpdateMyProfileUseCase', () => {
  it("404 si l'utilisateur n'existe pas (jeton de session périmé)", async () => {
    const users = makeUsers({ findById: jest.fn().mockResolvedValue(null) });
    const useCase = new UpdateMyProfileUseCase(users);

    await expect(useCase.execute('missing-user', { phone: '0600000000' })).rejects.toBeInstanceOf(NotFoundException);
  });

  it('met à jour uniquement le téléphone du compte courant', async () => {
    const existing = { id: 'user-1' } as any;
    const updated = { ...existing, phone: '0600000000' };
    const users = makeUsers({ findById: jest.fn().mockResolvedValue(existing), updateProfile: jest.fn().mockResolvedValue(updated) });
    const useCase = new UpdateMyProfileUseCase(users);

    const result = await useCase.execute('user-1', { phone: '0600000000' });

    expect(users.updateProfile).toHaveBeenCalledWith('user-1', { phone: '0600000000' });
    expect(result).toBe(updated);
  });
});
