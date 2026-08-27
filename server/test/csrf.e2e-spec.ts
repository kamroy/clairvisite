import { Controller, INestApplication, Post } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { CsrfModule } from '../src/common/csrf/csrf.module';
import { CsrfGuard } from '../src/common/guards/csrf.guard';
import { finalizeTestApp } from './utils/finalize-test-app';

// Route factice protégée uniquement par CsrfGuard, pour observer son comportement
// indépendamment de toute logique métier.
@Controller('ping')
class PingController {
  @Post()
  pong() {
    return { ok: true };
  }
}

describe('CSRF protection (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), CsrfModule],
      controllers: [PingController],
    }).compile();

    app = await finalizeTestApp(moduleRef, (app) => app.useGlobalGuards(new CsrfGuard()));
  });

  afterEach(() => app.close());

  it('GET /csrf-token pose le cookie et renvoie le jeton dans le corps', async () => {
    const res = await request(app.getHttpServer()).get('/api/csrf-token').expect(200);

    expect(res.body.csrfToken).toEqual(expect.any(String));
    const setCookie = res.headers['set-cookie'] as unknown as string[];
    expect(setCookie.some((c) => c.startsWith(`csrf_token=${res.body.csrfToken}`))).toBe(true);
  });

  it('réutilise le cookie existant plutôt que d’en émettre un nouveau', async () => {
    const first = await request(app.getHttpServer()).get('/api/csrf-token').expect(200);
    const second = await request(app.getHttpServer())
      .get('/api/csrf-token')
      .set('Cookie', `csrf_token=${first.body.csrfToken}`)
      .expect(200);

    expect(second.body.csrfToken).toBe(first.body.csrfToken);
    expect(second.headers['set-cookie']).toBeUndefined();
  });

  it('403 sur une requête mutante sans jeton CSRF du tout', async () => {
    await request(app.getHttpServer()).post('/api/ping').expect(403);
  });

  it("403 quand seul l'en-tête est fourni (pas de cookie)", async () => {
    await request(app.getHttpServer()).post('/api/ping').set('x-csrf-token', 'whatever').expect(403);
  });

  it('403 quand le cookie et l’en-tête ne correspondent pas', async () => {
    await request(app.getHttpServer())
      .post('/api/ping')
      .set('Cookie', 'csrf_token=aaa')
      .set('x-csrf-token', 'bbb')
      .expect(403);
  });

  it('laisse passer une requête mutante quand cookie et en-tête correspondent', async () => {
    const { body } = await request(app.getHttpServer()).get('/api/csrf-token').expect(200);

    await request(app.getHttpServer())
      .post('/api/ping')
      .set('Cookie', `csrf_token=${body.csrfToken}`)
      .set('x-csrf-token', body.csrfToken)
      .expect(201);
  });
});
