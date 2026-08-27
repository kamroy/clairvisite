import { OidcAuthorizationRequest, OidcIdentity, OidcProviderPort } from '../../src/modules/auth/application/oidc-provider.port';

// Remplace GoogleOidcAdapter dans les tests : aucun appel réseau à Google, l'identité
// renvoyée par exchangeCodeForIdentity() est entièrement contrôlée par le test.
export class FakeOidcProvider implements OidcProviderPort {
  nextIdentity: OidcIdentity = {
    subject: 'google-subject-1',
    email: 'user@example.com',
    fullName: 'Test User',
  };

  async buildAuthorizationRequest(): Promise<OidcAuthorizationRequest> {
    return { authorizationUrl: 'https://accounts.google.com/fake-auth', codeVerifier: 'fake-verifier' };
  }

  async exchangeCodeForIdentity(): Promise<OidcIdentity> {
    return this.nextIdentity;
  }
}
