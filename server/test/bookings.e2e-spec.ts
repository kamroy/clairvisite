import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { BookingsModule } from '../src/modules/bookings/bookings.module';
import { BOOKING_REPOSITORY } from '../src/modules/bookings/domain/booking.repository.port';
import { BOOKING_EMAIL_NOTIFIER } from '../src/modules/bookings/application/ports/booking-email-notifier.port';
import { NOTIFICATION_PUBLISHER } from '../src/modules/notifications/application/ports/notification-publisher.port';
import { NotificationsModule } from '../src/modules/notifications/notifications.module';
import { NOTIFICATION_REPOSITORY } from '../src/modules/notifications/domain/notification.repository.port';
import { User } from '../src/modules/users/domain/user.entity';
import { Technician } from '../src/modules/technicians/domain/technician.entity';
import { InMemoryAvailabilityRepository } from './fakes/in-memory-availability.repository';
import { InMemoryTechnicianRepository } from './fakes/in-memory-technician.repository';
import { InMemoryUserRepository } from './fakes/in-memory-user.repository';
import { InMemoryBookingRepository } from './fakes/in-memory-booking.repository';
import { NoopBookingEmailNotifier } from './fakes/noop-booking-email-notifier';
import { RecordingNotificationPublisher } from './fakes/recording-notification-publisher';
import { InMemoryNotificationRepository } from './fakes/in-memory-notification.repository';
import { finalizeTestApp } from './utils/finalize-test-app';

describe('Bookings (e2e)', () => {
  let app: INestApplication;
  let availabilities: InMemoryAvailabilityRepository;
  let technicians: InMemoryTechnicianRepository;
  let bookings: InMemoryBookingRepository;
  let notifications: RecordingNotificationPublisher;
  let jwt: JwtService;
  let slotId: string;

  function tokenFor(userId: string, role: 'acheteur' | 'technicien') {
    return jwt.sign({ sub: userId, role, email: `${userId}@example.com` });
  }

  beforeEach(async () => {
    availabilities = new InMemoryAvailabilityRepository();
    const users = new InMemoryUserRepository();
    technicians = new InMemoryTechnicianRepository(users, availabilities);

    users.seed(new User('tech-user-1', 'tech1@example.com', 'Tech One', 'technicien', 'password'));
    users.seed(new User('buyer-1', 'buyer1@example.com', 'Buyer One', 'acheteur', 'password'));
    users.seed(new User('buyer-2', 'buyer2@example.com', 'Buyer Two', 'acheteur', 'password'));
    technicians.seed(new Technician('tech-1', 'tech-user-1', '0600000001', ['electricite'], ['idf'], null, 'approved', null));

    const slot = await availabilities.create({
      technicianId: 'tech-1',
      startDatetime: new Date('2026-09-01T10:00:00Z'),
      endDatetime: new Date('2026-09-01T11:00:00Z'),
    });
    slotId = slot.id;

    bookings = new InMemoryBookingRepository(availabilities, technicians, users);
    notifications = new RecordingNotificationPublisher();

    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        JwtModule.register({ global: true, secret: process.env.JWT_SECRET }),
        NotificationsModule,
        BookingsModule,
      ],
    })
      .overrideProvider(BOOKING_REPOSITORY)
      .useValue(bookings)
      .overrideProvider(BOOKING_EMAIL_NOTIFIER)
      .useValue(new NoopBookingEmailNotifier())
      .overrideProvider(NOTIFICATION_REPOSITORY)
      .useValue(new InMemoryNotificationRepository())
      .overrideProvider(NOTIFICATION_PUBLISHER)
      .useValue(notifications)
      .compile();

    app = await finalizeTestApp(moduleRef);
    jwt = moduleRef.get(JwtService);
  });

  afterEach(() => app.close());

  function bookPayload() {
    return { availability_id: slotId, buyer_phone: '0611111111', property_address: '1 rue de Paris' };
  }

  it('un acheteur peut réserver un créneau libre', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/bookings')
      .set('Cookie', `session=${tokenFor('buyer-1', 'acheteur')}`)
      .send(bookPayload())
      .expect(201);

    expect(res.body.id).toEqual(expect.any(String));
    expect((await availabilities.findById(slotId))?.isBooked).toBe(true);

    expect(notifications.calls).toContainEqual(
      expect.objectContaining({ userId: 'tech-user-1', category: 'visite_technique', title: 'Nouvelle réservation' }),
    );
  });

  it("un technicien ne peut pas réserver (RolesGuard réservé aux acheteurs)", async () => {
    await request(app.getHttpServer())
      .post('/api/bookings')
      .set('Cookie', `session=${tokenFor('tech-user-1', 'technicien')}`)
      .send(bookPayload())
      .expect(403);
  });

  // Règle métier critique (US-A3, cf. README) : deux acheteurs ne doivent jamais pouvoir
  // réserver le même créneau. Les deux requêtes sont envoyées concurremment ; une seule
  // doit réussir. NB : ce test valide l'atomicité au niveau du port BookingRepositoryPort
  // (le fake reproduit fidèlement le contrat check-then-set) — il ne remplace pas un test
  // contre la vraie transaction Postgres, qui nécessite une base de données réelle.
  it('empêche deux acheteurs de réserver le même créneau simultanément', async () => {
    const [first, second] = await Promise.all([
      request(app.getHttpServer())
        .post('/api/bookings')
        .set('Cookie', `session=${tokenFor('buyer-1', 'acheteur')}`)
        .send(bookPayload()),
      request(app.getHttpServer())
        .post('/api/bookings')
        .set('Cookie', `session=${tokenFor('buyer-2', 'acheteur')}`)
        .send(bookPayload()),
    ]);

    const statuses = [first.status, second.status].sort();
    expect(statuses).toEqual([201, 409]);
  });

  // Régression : la modération admin (statut pending/approved/rejected) doit vraiment
  // bloquer la réservation, pas seulement le filtrage des résultats de recherche.
  it("empêche de réserver le créneau d'un technicien non approuvé", async () => {
    technicians.seed(new Technician('tech-2', 'tech-user-2', '0600000002', ['plomberie'], ['idf'], null, 'pending', null));
    const pendingSlot = await availabilities.create({
      technicianId: 'tech-2',
      startDatetime: new Date('2026-09-03T10:00:00Z'),
      endDatetime: new Date('2026-09-03T11:00:00Z'),
    });

    await request(app.getHttpServer())
      .post('/api/bookings')
      .set('Cookie', `session=${tokenFor('buyer-1', 'acheteur')}`)
      .send({ availability_id: pendingSlot.id, buyer_phone: '0611111111', property_address: '1 rue de Paris' })
      .expect(409);
  });

  it("le propriétaire (technicien) et l'acheteur peuvent voir la réservation, mais un tiers ne peut pas l'annuler", async () => {
    const created = await request(app.getHttpServer())
      .post('/api/bookings')
      .set('Cookie', `session=${tokenFor('buyer-1', 'acheteur')}`)
      .send(bookPayload())
      .expect(201);

    const mine = await request(app.getHttpServer())
      .get('/api/bookings/me')
      .set('Cookie', `session=${tokenFor('buyer-1', 'acheteur')}`)
      .expect(200);
    expect(mine.body.items).toHaveLength(1);
    expect(mine.body.hasMore).toBe(false);

    const received = await request(app.getHttpServer())
      .get('/api/technicians/me/bookings')
      .set('Cookie', `session=${tokenFor('tech-user-1', 'technicien')}`)
      .expect(200);
    expect(received.body.items).toHaveLength(1);

    await request(app.getHttpServer())
      .patch(`/api/bookings/${created.body.id}/cancel`)
      .set('Cookie', `session=${tokenFor('buyer-2', 'acheteur')}`)
      .expect(403);
  });

  it('un acheteur peut réserver une consultation déco avec pièces concernées et description (US-BOOK-03)', async () => {
    technicians.seed(
      new Technician('deco-1', 'tech-user-1', '0600000003', ['déco'], ['idf'], null, 'approved', null, 'decoration'),
    );
    const decoSlot = await availabilities.create({
      technicianId: 'deco-1',
      startDatetime: new Date('2026-09-05T10:00:00Z'),
      endDatetime: new Date('2026-09-05T11:00:00Z'),
    });

    const created = await request(app.getHttpServer())
      .post('/api/bookings')
      .set('Cookie', `session=${tokenFor('buyer-1', 'acheteur')}`)
      .send({
        availability_id: decoSlot.id,
        buyer_phone: '0611111111',
        property_address: '1 rue de Paris',
        rooms_concerned: ['Salon', 'Cuisine'],
        project_description: 'Rafraîchir le salon et la cuisine, style scandinave.',
      })
      .expect(201);

    expect(created.body).toMatchObject({
      roomsConcerned: ['Salon', 'Cuisine'],
      projectDescription: 'Rafraîchir le salon et la cuisine, style scandinave.',
      technicianCategory: 'decoration',
    });

    const mine = await request(app.getHttpServer())
      .get('/api/bookings/me')
      .set('Cookie', `session=${tokenFor('buyer-1', 'acheteur')}`)
      .expect(200);
    expect(mine.body.items[0]).toMatchObject({ roomsConcerned: ['Salon', 'Cuisine'], technicianCategory: 'decoration' });
  });

  it("l'acheteur peut annuler sa réservation, ce qui libère le créneau", async () => {
    const created = await request(app.getHttpServer())
      .post('/api/bookings')
      .set('Cookie', `session=${tokenFor('buyer-1', 'acheteur')}`)
      .send(bookPayload())
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/api/bookings/${created.body.id}/cancel`)
      .set('Cookie', `session=${tokenFor('buyer-1', 'acheteur')}`)
      .expect(200);

    expect((await availabilities.findById(slotId))?.isBooked).toBe(false);

    expect(notifications.calls).toContainEqual(
      expect.objectContaining({ userId: 'tech-user-1', title: 'Réservation annulée' }),
    );
  });
});
