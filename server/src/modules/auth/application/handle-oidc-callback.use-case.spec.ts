import { HandleOidcCallbackUseCase, OidcAccountConflictError } from './handle-oidc-callback.use-case';
import { UserRepositoryPort } from '../../users/domain/user.repository.port';
import { OidcProviderPort } from './oidc-provider.port';
import { SessionTokenIssuerPort } from './session-token-issuer.port';

function makeUsers(overrides: Partial<UserRepositoryPort> = {}): jest.Mocked<UserRepositoryPort> {
  return {
    findById: jest.fn(),
    findByEmail: jest.fn().mockResolvedValue(null),
    findByOidcSubject: jest.fn().mockResolvedValue(null),
    create: jest.fn(),
    updateProfile: jest.fn(),
    ...overrides,
  } as jest.Mocked<UserRepositoryPort>;
}

const identity = { subject: 'google-sub-1', email: 'victim@example.com', fullName: 'Victim' };

const oidc: jest.Mocked<OidcProviderPort> = {
  buildAuthorizationRequest: jest.fn(),
  exchangeCodeForIdentity: jest.fn().mockResolvedValue(identity),
};

const tokens: jest.Mocked<SessionTokenIssuerPort> = { issue: jest.fn().mockReturnValue('session-token') };

describe('HandleOidcCallbackUseCase', () => {
  beforeEach(() => jest.clearAllMocks());

  it('réutilise le compte déjà lié à ce sujet Google (connexions suivantes)', async () => {
    const existing = { id: 'u1', role: 'acheteur', email: identity.email } as any;
    const users = makeUsers({ findByOidcSubject: jest.fn().mockResolvedValue(existing) });
    const useCase = new HandleOidcCallbackUseCase(users, oidc, tokens);

    const token = await useCase.execute('/callback?code=x', 'https://redirect', 'verifier');

    expect(users.create).not.toHaveBeenCalled();
    expect(tokens.issue).toHaveBeenCalledWith({ sub: 'u1', role: 'acheteur', email: identity.email });
    expect(token).toBe('session-token');
  });

  it('crée un nouveau compte quand ni le sujet OIDC ni l’email ne correspondent à un compte existant', async () => {
    const created = { id: 'new-user', role: 'acheteur', email: identity.email } as any;
    const users = makeUsers({ create: jest.fn().mockResolvedValue(created) });
    const useCase = new HandleOidcCallbackUseCase(users, oidc, tokens);

    await useCase.execute('/callback?code=x', 'https://redirect', 'verifier');

    expect(users.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: identity.email,
        authProvider: 'google',
        oidcSubject: identity.subject,
        role: 'acheteur',
        emailVerifiedAt: expect.any(Date), // Google a déjà prouvé la propriété de l'email
      }),
    );
  });

  // Régression sécurité : sans cette vérification, un attaquant peut pré-créer un compte
  // email/mot de passe avec l'adresse d'une victime, puis récupérer la session de la
  // victime lorsqu'elle se connecte avec son vrai compte Google (pre-account hijacking).
  it('refuse de fusionner silencieusement avec un compte déjà protégé par un mot de passe', async () => {
    const attackerControlledAccount = {
      id: 'attacker-account',
      email: identity.email,
      authProvider: 'password',
      role: 'acheteur',
    } as any;
    const users = makeUsers({ findByEmail: jest.fn().mockResolvedValue(attackerControlledAccount) });
    const useCase = new HandleOidcCallbackUseCase(users, oidc, tokens);

    await expect(useCase.execute('/callback?code=x', 'https://redirect', 'verifier')).rejects.toBeInstanceOf(
      OidcAccountConflictError,
    );
    expect(tokens.issue).not.toHaveBeenCalled();
    expect(users.create).not.toHaveBeenCalled();
  });

  it('relie un compte Google existant retrouvé par email (ex. sujet OIDC changé côté Google)', async () => {
    const existingGoogleAccount = { id: 'u2', email: identity.email, authProvider: 'google', role: 'technicien' } as any;
    const users = makeUsers({ findByEmail: jest.fn().mockResolvedValue(existingGoogleAccount) });
    const useCase = new HandleOidcCallbackUseCase(users, oidc, tokens);

    const token = await useCase.execute('/callback?code=x', 'https://redirect', 'verifier');

    expect(users.create).not.toHaveBeenCalled();
    expect(tokens.issue).toHaveBeenCalledWith({ sub: 'u2', role: 'technicien', email: identity.email });
    expect(token).toBe('session-token');
  });
});
