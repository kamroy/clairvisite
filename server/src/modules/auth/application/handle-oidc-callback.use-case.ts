import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY, UserRepositoryPort } from '../../users/domain/user.repository.port';
import { OIDC_PROVIDER, OidcProviderPort } from './oidc-provider.port';
import { SESSION_TOKEN_ISSUER, SessionTokenIssuerPort } from './session-token-issuer.port';

// Levée quand l'email Google correspond à un compte déjà protégé par un mot de passe :
// fusionner automatiquement permettrait à quiconque de pré-créer un compte avec l'email
// d'une victime pour récupérer sa session dès qu'elle se connecte via Google.
export class OidcAccountConflictError extends Error {
  constructor() {
    super('Un compte existe déjà avec cet email. Connectez-vous avec votre mot de passe.');
  }
}

@Injectable()
export class HandleOidcCallbackUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepositoryPort,
    @Inject(OIDC_PROVIDER) private readonly oidc: OidcProviderPort,
    @Inject(SESSION_TOKEN_ISSUER) private readonly tokens: SessionTokenIssuerPort,
  ) {}

  async execute(callbackUrl: string, redirectUri: string, codeVerifier: string): Promise<string> {
    const identity = await this.oidc.exchangeCodeForIdentity(callbackUrl, redirectUri, codeVerifier);

    let user = await this.users.findByOidcSubject('google', identity.subject);

    if (!user) {
      const existingByEmail = await this.users.findByEmail(identity.email);

      if (existingByEmail) {
        // Ce compte a été créé via email/mot de passe : on refuse la fusion silencieuse
        // (voir OidcAccountConflictError). Seuls les comptes déjà 100% Google peuvent
        // atterrir ici sans passerelle password.
        if (existingByEmail.authProvider === 'password') {
          throw new OidcAccountConflictError();
        }
        user = existingByEmail;
      } else {
        user = await this.users.create({
          email: identity.email,
          fullName: identity.fullName,
          avatarUrl: identity.avatarUrl,
          authProvider: 'google',
          oidcSubject: identity.subject,
          role: 'acheteur', // ajusté ensuite si la personne complète un profil technicien
          emailVerifiedAt: new Date(), // Google a déjà vérifié la propriété de l'email
        });
      }
    }

    return this.tokens.issue({ sub: user.id, role: user.role, email: user.email });
  }
}
