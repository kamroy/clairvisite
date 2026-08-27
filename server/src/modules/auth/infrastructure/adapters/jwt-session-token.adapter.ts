import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SessionTokenIssuerPort, SessionTokenPayload } from '../../application/session-token-issuer.port';

@Injectable()
export class JwtSessionTokenIssuer implements SessionTokenIssuerPort {
  constructor(private readonly jwtService: JwtService) {}

  issue(payload: SessionTokenPayload): string {
    return this.jwtService.sign(payload, { expiresIn: '7d' });
  }
}
