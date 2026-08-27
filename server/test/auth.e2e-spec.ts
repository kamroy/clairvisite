import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AuthModule } from '../src/modules/auth/auth.module';
import { USER_REPOSITORY } from '../src/modules/users/domain/user.repository.port';
import { OIDC_PROVIDER } from '../src/modules/auth/application/oidc-provider.port';
import { EMAIL_VERIFICATION_NOTIFIER } from '../src/modules/auth/application/ports/email-verification-notifier.port';
import { EMAIL_NOT_VERIFIED_MESSAGE } from '../src/modules/auth/application/login.use-case';
import { InMemoryUserRepository } from './fakes/in-memory-user.repository';
import { FakeOidcProvider } from './fakes/fake-oidc-provider';
import { FakeEmailVerificationNotifier } from './fakes/fake-email-verification-notifier';
import { finalizeTestApp } from './utils/finalize-test-app';

function hasSessionCookie(res: { headers: Record<string, unknown> }): boolean {
  const setCookie = res.headers['set-cookie'] as unknown as string[] | string | undefined;
  const cookies = Array.isArray(setCookie) ? setCookie : setCookie ? [setCookie] : [];
  return cookies.some((c) => c.startsWith('session='));
}

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let users: InMemoryUserRepository;
  let oidc: FakeOidcProvider;
  let emailNotifier: FakeEmailVerificationNotifier;

  beforeEach(async () => {
    users = new InMemoryUserRepository();
    oidc = new FakeOidcProvider();
    emailNotifier = new FakeEmailVerificationNotifier();

    const moduleRef = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), AuthModule],
    })
      .overrideProvider(USER_REPOSITORY)
      .useValue(users)
      .overrideProvider(OIDC_PROVIDER)
      .useValue(oidc)
      .overrideProvider(EMAIL_VERIFICATION_NOTIFIER)
      .useValue(emailNotifier)
      .compile();

    app = await finalizeTestApp(moduleRef);
  });

  afterEach(() => app.close());

  async function registerAndVerify(email: string, password: string, fullName: string) {
    await request(app.getHttpServer()).post('/api/auth/register').send({ email, password, fullName }).expect(201);
    const token = emailNotifier.extractToken();
    return request(app.getHttpServer()).get(`/api/auth/verify-email?token=${token}`).expect(302);
  }

  it("inscrit un utilisateur sans le connecter, en attendant la vérification de l'email", async () => {
    const registerRes = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: 'buyer@example.com', password: 'P@ssword123!', fullName: 'Ada Buyer' })
      .expect(201);

    expect(registerRes.body).toMatchObject({ id: expect.any(String), email: 'buyer@example.com' });
    expect(hasSessionCookie(registerRes)).toBe(false);
    expect(emailNotifier.lastVerificationUrl).toContain('/auth/verify-email?token=');

    const created = await users.findByEmail('buyer@example.com');
    expect(created?.emailVerifiedAt).toBeNull();
  });

  it.each([
    ['trop court (11 caractères)', 'Sh0rt!'],
    ['sans majuscule', 'p@ssword123!'],
    ['sans caractère spécial', 'Password1234'],
  ])('refuse une inscription avec un mot de passe %s', async (_label, password) => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: 'weakpass@example.com', password, fullName: 'Weak Pass' })
      .expect(400);
  });

  it("refuse la connexion tant que l'email n'est pas vérifié", async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: 'unverified@example.com', password: 'P@ssword123!', fullName: 'Not Verified' })
      .expect(201);

    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'unverified@example.com', password: 'P@ssword123!' })
      .expect(403);

    expect(res.body.message).toBe(EMAIL_NOT_VERIFIED_MESSAGE);
  });

  it("le lien de vérification valide la session, pose le cookie et permet ensuite de se connecter", async () => {
    const verifyRes = await registerAndVerify('verify-flow@example.com', 'P@ssword123!', 'Verify Flow');

    expect(verifyRes.headers.location).toBe('http://localhost:5173/login?verified=1');
    expect(hasSessionCookie(verifyRes)).toBe(true);

    const cookie = verifyRes.headers['set-cookie'];
    const meRes = await request(app.getHttpServer()).get('/api/auth/me').set('Cookie', cookie).expect(200);
    expect(meRes.body).toMatchObject({ email: 'verify-flow@example.com', role: 'acheteur' });

    // Et le mot de passe fonctionne désormais normalement.
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'verify-flow@example.com', password: 'P@ssword123!' })
      .expect(200);
  });

  it('un jeton de vérification invalide redirige avec une erreur, sans poser de cookie', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/auth/verify-email?token=does-not-exist')
      .expect(302);

    expect(res.headers.location).toBe('http://localhost:5173/login?error=verification');
    expect(hasSessionCookie(res)).toBe(false);
  });

  it('resend-verification renvoie toujours le même message, que le compte existe ou non (anti-enumeration)', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: 'resend@example.com', password: 'P@ssword123!', fullName: 'Resend Me' })
      .expect(201);
    emailNotifier.lastVerificationUrl = null;

    const existing = await request(app.getHttpServer())
      .post('/api/auth/resend-verification')
      .send({ email: 'resend@example.com' })
      .expect(200);
    const unknown = await request(app.getHttpServer())
      .post('/api/auth/resend-verification')
      .send({ email: 'does-not-exist@example.com' })
      .expect(200);

    expect(existing.body).toEqual(unknown.body);
    expect(emailNotifier.lastVerificationUrl).toContain('/auth/verify-email?token=');
  });

  it('refuse un second compte avec le même email (409)', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: 'dup@example.com', password: 'P@ssword123!', fullName: 'First' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: 'dup@example.com', password: 'P@ssword123!', fullName: 'Second' })
      .expect(409);
  });

  it('/auth/me sans cookie renvoie 401', async () => {
    await request(app.getHttpServer()).get('/api/auth/me').expect(401);
  });

  it('login refuse un mauvais mot de passe (401)', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: 'login@example.com', password: 'P@ssword123!', fullName: 'Login User' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'login@example.com', password: 'wrong-password' })
      .expect(401);
  });

  // Régression sécurité : un compte email/mot de passe pré-existant sur la même adresse
  // ne doit jamais être absorbé silencieusement par une connexion Google ultérieure
  // (pre-account hijacking, cf. handle-oidc-callback.use-case.ts). Vrai même si ce compte
  // n'a jamais été vérifié par email : c'est justement le scénario de l'attaquant.
  it('bloque la connexion Google quand un compte mot de passe existe déjà pour cet email', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: 'victim@example.com', password: 'Attack3r-Ch0sen!', fullName: 'Victim' })
      .expect(201);

    oidc.nextIdentity = { subject: 'google-sub-victim', email: 'victim@example.com', fullName: 'Victim Real Name' };

    const res = await request(app.getHttpServer())
      .get('/api/auth/google/callback')
      .set('Cookie', 'oidc_verifier=fake-verifier')
      .expect(302);

    expect(res.headers.location).toBe('http://localhost:5173/login?error=oidc_account_exists');
    expect(hasSessionCookie(res)).toBe(false);
  });

  it('connexion Google crée un compte déjà vérifié (Google a déjà prouvé la propriété de l’email)', async () => {
    oidc.nextIdentity = { subject: 'google-sub-new', email: 'newgoogleuser@example.com', fullName: 'New Google User' };

    const res = await request(app.getHttpServer())
      .get('/api/auth/google/callback')
      .set('Cookie', 'oidc_verifier=fake-verifier')
      .expect(302);

    expect(res.headers.location).toBe('http://localhost:5173');
    expect(hasSessionCookie(res)).toBe(true);
    const created = await users.findByEmail('newgoogleuser@example.com');
    expect(created?.emailVerifiedAt).not.toBeNull();
  });
});
