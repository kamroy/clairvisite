import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from '../csrf/csrf.constants';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

// Défense en profondeur en complément du cookie de session `sameSite: lax` (voir
// auth.controller.ts) : pattern double-submit cookie. Le cookie csrf_token n'est pas
// httpOnly, donc seul du JS same-origin peut le lire et le renvoyer dans l'en-tête
// X-CSRF-Token — un site tiers qui force l'envoi du cookie de session ne peut pas
// deviner cette valeur. Appliqué globalement (voir AppModule), y compris sur
// /auth/login et /auth/register pour empêcher le "login CSRF".
@Injectable()
export class CsrfGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    if (SAFE_METHODS.has(request.method)) return true;

    const cookieToken = request.cookies?.[CSRF_COOKIE_NAME];
    const headerToken = request.headers[CSRF_HEADER_NAME];

    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
      throw new ForbiddenException('Jeton CSRF invalide ou manquant');
    }
    return true;
  }
}
