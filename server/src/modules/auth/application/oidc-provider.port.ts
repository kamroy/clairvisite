export const OIDC_PROVIDER = Symbol('OIDC_PROVIDER');

export interface OidcAuthorizationRequest {
  authorizationUrl: string;
  codeVerifier: string;
}

export interface OidcIdentity {
  subject: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
}

// Port générique : demain un autre fournisseur OIDC (Microsoft, Apple) implémente
// la même interface sans toucher aux use cases ni aux controllers.
export interface OidcProviderPort {
  buildAuthorizationRequest(redirectUri: string): Promise<OidcAuthorizationRequest>;
  exchangeCodeForIdentity(callbackUrl: string, redirectUri: string, codeVerifier: string): Promise<OidcIdentity>;
}
