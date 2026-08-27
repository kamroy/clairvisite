export const SESSION_TOKEN_ISSUER = Symbol('SESSION_TOKEN_ISSUER');

export interface SessionTokenPayload {
  sub: string;
  role: string;
  email: string;
}

export interface SessionTokenIssuerPort {
  issue(payload: SessionTokenPayload): string;
}
