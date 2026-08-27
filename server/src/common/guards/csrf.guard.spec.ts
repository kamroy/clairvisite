import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { CsrfGuard } from './csrf.guard';

function makeContext(method: string, cookies: Record<string, string> = {}, headers: Record<string, string> = {}) {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ method, cookies, headers }),
    }),
  } as unknown as ExecutionContext;
}

describe('CsrfGuard', () => {
  const guard = new CsrfGuard();

  it.each(['GET', 'HEAD', 'OPTIONS'])('laisse toujours passer les méthodes sûres (%s)', (method) => {
    expect(guard.canActivate(makeContext(method))).toBe(true);
  });

  it('403 si le cookie et l’en-tête sont absents', () => {
    expect(() => guard.canActivate(makeContext('POST'))).toThrow(ForbiddenException);
  });

  it("403 si seul l'en-tête est présent (pas de cookie csrf_token)", () => {
    const ctx = makeContext('POST', {}, { 'x-csrf-token': 'abc' });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('403 si seul le cookie est présent (pas d’en-tête X-CSRF-Token)', () => {
    const ctx = makeContext('POST', { csrf_token: 'abc' });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('403 si le cookie et l’en-tête ne correspondent pas', () => {
    const ctx = makeContext('POST', { csrf_token: 'abc' }, { 'x-csrf-token': 'def' });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('laisse passer une requête mutante quand cookie et en-tête correspondent', () => {
    const ctx = makeContext('DELETE', { csrf_token: 'matching-token' }, { 'x-csrf-token': 'matching-token' });
    expect(guard.canActivate(ctx)).toBe(true);
  });
});
