import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { EMAIL_NOT_VERIFIED_MESSAGE, LoginUseCase } from './login.use-case';
import { UserRepositoryPort } from '../../users/domain/user.repository.port';
import { PasswordHasherPort } from './password-hasher.port';
import { SessionTokenIssuerPort } from './session-token-issuer.port';

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

const hasher: jest.Mocked<PasswordHasherPort> = { hash: jest.fn(), compare: jest.fn() };
const tokens: jest.Mocked<SessionTokenIssuerPort> = { issue: jest.fn().mockReturnValue('session-token') };

describe('LoginUseCase', () => {
  beforeEach(() => jest.clearAllMocks());

  it("401 si aucun compte n'existe pour cet email", async () => {
    const users = makeUsers({ findByEmail: jest.fn().mockResolvedValue(null) });
    const useCase = new LoginUseCase(users, hasher, tokens);

    await expect(useCase.execute('unknown@example.com', 'password123')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("401 si le compte existe mais n'a pas de mot de passe (compte Google uniquement)", async () => {
    const users = makeUsers({ findByEmail: jest.fn().mockResolvedValue({ id: 'u1', passwordHash: null } as any) });
    const useCase = new LoginUseCase(users, hasher, tokens);

    await expect(useCase.execute('google@example.com', 'password123')).rejects.toBeInstanceOf(UnauthorizedException);
    expect(hasher.compare).not.toHaveBeenCalled();
  });

  it('401 si le mot de passe est incorrect', async () => {
    const users = makeUsers({ findByEmail: jest.fn().mockResolvedValue({ id: 'u1', passwordHash: 'hash' } as any) });
    hasher.compare.mockResolvedValue(false);
    const useCase = new LoginUseCase(users, hasher, tokens);

    await expect(useCase.execute('user@example.com', 'wrong')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  // Régression sécurité : sans ce contrôle, un compte créé avec l'email de quelqu'un
  // d'autre resterait exploitable par mot de passe sans jamais prouver la propriété
  // de l'email (voir register.use-case.ts / verify-email.use-case.ts).
  it("403 si le mot de passe est correct mais l'email n'a pas été vérifié", async () => {
    const user = { id: 'u1', email: 'user@example.com', role: 'acheteur', passwordHash: 'hash', emailVerifiedAt: null } as any;
    const users = makeUsers({ findByEmail: jest.fn().mockResolvedValue(user) });
    hasher.compare.mockResolvedValue(true);
    const useCase = new LoginUseCase(users, hasher, tokens);

    await expect(useCase.execute('user@example.com', 'correct')).rejects.toBeInstanceOf(ForbiddenException);
    await expect(useCase.execute('user@example.com', 'correct')).rejects.toThrow(EMAIL_NOT_VERIFIED_MESSAGE);
    expect(tokens.issue).not.toHaveBeenCalled();
  });

  it('délivre un token de session si les identifiants sont valides et l’email vérifié', async () => {
    const user = {
      id: 'u1',
      email: 'user@example.com',
      role: 'acheteur',
      passwordHash: 'hash',
      emailVerifiedAt: new Date(),
    } as any;
    const users = makeUsers({ findByEmail: jest.fn().mockResolvedValue(user) });
    hasher.compare.mockResolvedValue(true);
    const useCase = new LoginUseCase(users, hasher, tokens);

    const result = await useCase.execute('user@example.com', 'correct');

    expect(tokens.issue).toHaveBeenCalledWith({ sub: 'u1', role: 'acheteur', email: 'user@example.com' });
    expect(result).toEqual({ user: { id: 'u1', email: 'user@example.com' }, sessionToken: 'session-token' });
  });
});
