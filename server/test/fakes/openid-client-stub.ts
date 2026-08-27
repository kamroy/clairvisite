// Stub pour les tests : openid-client v6 est un module ESM pur (via oauth4webapi) que
// Jest (CommonJS) ne peut pas transformer depuis node_modules. GoogleOidcAdapter n'est
// jamais réellement instancié dans les tests (OIDC_PROVIDER est toujours remplacé par
// FakeOidcProvider) : ce stub n'a besoin que de satisfaire le compilateur TypeScript.
export type Configuration = unknown;

function notImplemented(): never {
  throw new Error('openid-client stub: not implemented in tests');
}

export const discovery = notImplemented;
export const randomPKCECodeVerifier = notImplemented;
export const calculatePKCECodeChallenge = notImplemented;
export const buildAuthorizationUrl = notImplemented;
export const authorizationCodeGrant = notImplemented;
