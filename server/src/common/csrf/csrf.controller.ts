import { Controller, Get, Req, Res } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { Request, Response } from 'express';
import { CSRF_COOKIE_NAME } from './csrf.constants';

const isProd = process.env.NODE_ENV === 'production';

// Point d'entrée appelé par le client au démarrage (et à la volée si le cookie a expiré)
// pour obtenir le jeton du pattern double-submit cookie consommé par CsrfGuard.
@Controller('csrf-token')
export class CsrfController {
  @Get()
  issue(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    let token = req.cookies?.[CSRF_COOKIE_NAME];
    if (!token) {
      token = randomUUID();
      res.cookie(CSRF_COOKIE_NAME, token, {
        httpOnly: false, // doit rester lisible en JS pour être renvoyé dans l'en-tête X-CSRF-Token
        secure: isProd,
        sameSite: 'lax',
      });
    }
    return { csrfToken: token };
  }
}
