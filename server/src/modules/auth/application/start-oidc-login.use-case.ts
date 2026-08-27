import { Inject, Injectable } from '@nestjs/common';
import { OIDC_PROVIDER, OidcProviderPort } from './oidc-provider.port';

@Injectable()
export class StartOidcLoginUseCase {
  constructor(@Inject(OIDC_PROVIDER) private readonly oidc: OidcProviderPort) {}

  execute(redirectUri: string) {
    return this.oidc.buildAuthorizationRequest(redirectUri);
  }
}
