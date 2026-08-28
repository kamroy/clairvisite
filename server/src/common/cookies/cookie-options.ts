import type { CookieOptions } from 'express';

export const isProd = process.env.NODE_ENV === 'production';

// `sameSite: 'none'` est nécessaire dès que front et back sont sur des origines
// différentes (déploiement PaaS séparé, cf. README) : sans ça, le navigateur
// n'attache pas le cookie aux appels fetch() cross-site et l'auth échoue
// silencieusement. Exige `secure: true`, donc réservé à la prod — en dev, tout passe
// par le proxy Vite en same-origin, où 'lax' suffit.
export function crossOriginCookieOptions(): CookieOptions {
  return {
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
  };
}
