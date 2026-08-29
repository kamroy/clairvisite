import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { NotificationsModule } from '../src/modules/notifications/notifications.module';
import { NOTIFICATION_REPOSITORY } from '../src/modules/notifications/domain/notification.repository.port';
import { InMemoryNotificationRepository } from './fakes/in-memory-notification.repository';
import { finalizeTestApp } from './utils/finalize-test-app';

describe('Notifications (e2e)', () => {
  let app: INestApplication;
  let jwt: JwtService;
  let notifications: InMemoryNotificationRepository;

  function tokenFor(userId: string) {
    return jwt.sign({ sub: userId, role: 'acheteur', email: `${userId}@example.com` });
  }

  beforeEach(async () => {
    notifications = new InMemoryNotificationRepository();

    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        JwtModule.register({ global: true, secret: process.env.JWT_SECRET }),
        NotificationsModule,
      ],
    })
      .overrideProvider(NOTIFICATION_REPOSITORY)
      .useValue(notifications)
      .compile();

    app = await finalizeTestApp(moduleRef);
    jwt = moduleRef.get(JwtService);
  });

  afterEach(() => app.close());

  it('401 sans cookie de session', async () => {
    await request(app.getHttpServer()).get('/api/notifications').expect(401);
  });

  it("liste les notifications d'un utilisateur, du plus récent au plus ancien, avec le compteur de non-lues", async () => {
    await notifications.create({ userId: 'user-1', category: 'visite_technique', title: 'Première' });
    await notifications.create({ userId: 'user-1', category: 'decoration', title: 'Seconde' });
    await notifications.create({ userId: 'user-2', category: 'visite_technique', title: 'Pas la mienne' });

    const res = await request(app.getHttpServer())
      .get('/api/notifications')
      .set('Cookie', `session=${tokenFor('user-1')}`)
      .expect(200);

    expect(res.body.items).toHaveLength(2);
    expect(res.body.items[0].title).toBe('Seconde');
    expect(res.body.unreadCount).toBe(2);
  });

  it('marque une notification comme lue, ce qui décrémente le compteur de non-lues', async () => {
    const n = await notifications.create({ userId: 'user-1', category: 'visite_technique', title: 'À lire' });

    await request(app.getHttpServer())
      .patch(`/api/notifications/${n.id}/read`)
      .set('Cookie', `session=${tokenFor('user-1')}`)
      .expect(200);

    const res = await request(app.getHttpServer())
      .get('/api/notifications')
      .set('Cookie', `session=${tokenFor('user-1')}`)
      .expect(200);
    expect(res.body.unreadCount).toBe(0);
    expect(res.body.items[0].isRead).toBe(true);
  });

  it("un tiers ne peut pas marquer comme lue la notification d'un autre utilisateur (no-op silencieux)", async () => {
    const n = await notifications.create({ userId: 'user-1', category: 'visite_technique', title: 'À lire' });

    await request(app.getHttpServer())
      .patch(`/api/notifications/${n.id}/read`)
      .set('Cookie', `session=${tokenFor('user-2')}`)
      .expect(200);

    expect(await notifications.countUnread('user-1')).toBe(1);
  });

  it('marque toutes les notifications comme lues', async () => {
    await notifications.create({ userId: 'user-1', category: 'visite_technique', title: 'Une' });
    await notifications.create({ userId: 'user-1', category: 'decoration', title: 'Deux' });

    await request(app.getHttpServer())
      .patch('/api/notifications/read-all')
      .set('Cookie', `session=${tokenFor('user-1')}`)
      .expect(200);

    expect(await notifications.countUnread('user-1')).toBe(0);
  });
});
