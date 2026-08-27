import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

// Adapter d'entrée HTTP : traduit le cookie de session en `request.user`,
// consommé ensuite par les controllers via @CurrentUser().
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = request.cookies?.session;
    if (!token) throw new UnauthorizedException('Non authentifié');

    try {
      request.user = this.jwtService.verify(token);
      return true;
    } catch {
      throw new UnauthorizedException('Session invalide');
    }
  }
}
