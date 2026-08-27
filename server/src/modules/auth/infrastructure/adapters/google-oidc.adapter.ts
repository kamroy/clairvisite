import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as client from 'openid-client';
import { OidcAuthorizationRequest, OidcIdentity, OidcProviderPort } from '../../application/oidc-provider.port';

// Seul endroit du projet qui connaît openid-client et l'issuer Google.
// Remplacer/ajouter un fournisseur (Microsoft, Apple) = un nouvel adapter,
// aucun changement dans les use cases ni les controllers.
@Injectable()
export class GoogleOidcAdapter implements OidcProviderPort {
  private configPromise: Promise<client.Configuration> | null = null;

  constructor(private readonly config: ConfigService) {}

  private getConfig() {
    if (!this.configPromise) {
      this.configPromise = client.discovery(
        new URL('https://accounts.google.com'),
        this.config.getOrThrow('GOOGLE_CLIENT_ID'),
        this.config.getOrThrow('GOOGLE_CLIENT_SECRET'),
      );
    }
    return this.configPromise;
  }

  async buildAuthorizationRequest(redirectUri: string): Promise<OidcAuthorizationRequest> {
    const config = await this.getConfig();
    const codeVerifier = client.randomPKCECodeVerifier();
    const codeChallenge = await client.calculatePKCECodeChallenge(codeVerifier);

    const authUrl = client.buildAuthorizationUrl(config, {
      redirect_uri: redirectUri,
      scope: 'openid email profile',
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });

    return { authorizationUrl: authUrl.href, codeVerifier };
  }

  async exchangeCodeForIdentity(callbackUrl: string, redirectUri: string, codeVerifier: string): Promise<OidcIdentity> {
    const config = await this.getConfig();
    const tokens = await client.authorizationCodeGrant(config, new URL(callbackUrl, redirectUri), {
      pkceCodeVerifier: codeVerifier,
    });
    const claims = tokens.claims() as any;

    return {
      subject: claims.sub,
      email: claims.email,
      fullName: claims.name ?? claims.email,
      avatarUrl: claims.picture,
    };
  }
}
