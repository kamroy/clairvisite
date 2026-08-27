import { ConflictException } from '@nestjs/common';
import { RegisterUseCase } from './register.use-case';
import { UserRepositoryPort } from '../../users/domain/user.repository.port';
import { PasswordHasherPort } from './password-hasher.port';
import { EmailVerificationNotifierPort } from './ports/email-verification-notifier.port';

function makeUsers(overrides: Partial<UserRepositoryPort> = {}): jest.Mocked<UserRepositoryPort> {
  return {
    findById: jest.fn(),
    findByEmail: jest.fn().mockResolvedValue(null),
    findByOidcSubject: jest.fn(),
    create: jest.fn(),
    updateProfile: jest.fn(),
    setEmailVerificationToken: jest.fn().mockResolvedValue(undefined),
    findByEmailVerificationTokenHash: jest.fn(),
    markEmailVerified: jest.fn(),
    ...overrides,
  } as jest.Mocked<UserRepositoryPort>;
}

const hasher: jest.Mocked<PasswordHasherPort> = {
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn(),
};

const notifier: jest.Mocked<EmailVerificationNotifierPort> = {
  sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
};

const verifyBaseUrl = 'http://localhost:3000/api/auth/verify-email';
const input = { email: 'new@example.com', password: 'password123', fullName: 'New User' };

describe('RegisterUseCase', () => {
  beforeEach(() => jest.clearAllMocks());

  it('409 si un compte existe déjà avec cet email', async () => {
    const users = makeUsers({ findByEmail: jest.fn().mockResolvedValue({ id: 'existing' } as any) });
    const useCase = new RegisterUseCase(users, hasher, notifier);

    await expect(useCase.execute(input, verifyBaseUrl)).rejects.toBeInstanceOf(ConflictException);
    expect(users.create).not.toHaveBeenCalled();
  });

  it('hash le mot de passe, crée un compte "acheteur" non vérifié par défaut, et n’émet aucune session', async () => {
    const createdUser = { id: 'user-1', email: input.email, role: 'acheteur' } as any;
    const users = makeUsers({ create: jest.fn().mockResolvedValue(createdUser) });
    const useCase = new RegisterUseCase(users, hasher, notifier);

    const result = await useCase.execute(input, verifyBaseUrl);

    expect(hasher.hash).toHaveBeenCalledWith(input.password);
    expect(users.create).toHaveBeenCalledWith(
      expect.objectContaining({ email: input.email, role: 'acheteur', authProvider: 'password', passwordHash: 'hashed-password' }),
    );
    expect(result).toEqual({ user: { id: 'user-1', email: input.email } });
    expect((result as any).sessionToken).toBeUndefined();
  });

  it('génère un jeton de vérification et envoie un email contenant un lien vers verifyBaseUrl', async () => {
    const createdUser = { id: 'user-1', email: input.email, role: 'acheteur' } as any;
    const users = makeUsers({ create: jest.fn().mockResolvedValue(createdUser) });
    const useCase = new RegisterUseCase(users, hasher, notifier);

    await useCase.execute(input, verifyBaseUrl);

    expect(users.setEmailVerificationToken).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ tokenHash: expect.any(String), expiresAt: expect.any(Date) }),
    );
    expect(notifier.sendVerificationEmail).toHaveBeenCalledWith(
      createdUser,
      expect.stringContaining(`${verifyBaseUrl}?token=`),
    );
  });

  it('respecte le rôle "technicien" explicitement demandé', async () => {
    const users = makeUsers({ create: jest.fn().mockResolvedValue({ id: 'user-1', email: input.email, role: 'technicien' } as any) });
    const useCase = new RegisterUseCase(users, hasher, notifier);

    await useCase.execute({ ...input, role: 'technicien' }, verifyBaseUrl);

    expect(users.create).toHaveBeenCalledWith(expect.objectContaining({ role: 'technicien' }));
  });

  it('transmet le téléphone au repository quand il est renseigné à l’inscription', async () => {
    const users = makeUsers({ create: jest.fn().mockResolvedValue({ id: 'user-1', email: input.email, role: 'acheteur' } as any) });
    const useCase = new RegisterUseCase(users, hasher, notifier);

    await useCase.execute({ ...input, phone: '0611223344' }, verifyBaseUrl);

    expect(users.create).toHaveBeenCalledWith(expect.objectContaining({ phone: '0611223344' }));
  });

  it("renvoie quand même l'utilisateur si l'envoi de l'email échoue (asynchrone, non bloquant)", async () => {
    const createdUser = { id: 'user-1', email: input.email, role: 'acheteur' } as any;
    const users = makeUsers({ create: jest.fn().mockResolvedValue(createdUser) });
    const failingNotifier: jest.Mocked<EmailVerificationNotifierPort> = {
      sendVerificationEmail: jest.fn().mockRejectedValue(new Error('resend down')),
    };
    const useCase = new RegisterUseCase(users, hasher, failingNotifier);

    const result = await useCase.execute(input, verifyBaseUrl);

    expect(result).toEqual({ user: { id: 'user-1', email: input.email } });
  });
});
