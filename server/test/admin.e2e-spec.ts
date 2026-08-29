import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AdminModule } from '../src/modules/admin/admin.module';
import { TECHNICIAN_REPOSITORY } from '../src/modules/technicians/domain/technician.repository.port';
import { Technician } from '../src/modules/technicians/domain/technician.entity';
import { BOOKING_REPOSITORY } from '../src/modules/bookings/domain/booking.repository.port';
import { BOOKING_EMAIL_NOTIFIER } from '../src/modules/bookings/application/ports/booking-email-notifier.port';
import { NOTIFICATION_PUBLISHER } from '../src/modules/notifications/application/ports/notification-publisher.port';
import { NotificationsModule } from '../src/modules/notifications/notifications.module';
import { NOTIFICATION_REPOSITORY } from '../src/modules/notifications/domain/notification.repository.port';
import { USER_REPOSITORY } from '../src/modules/users/domain/user.repository.port';
import { User } from '../src/modules/users/domain/user.entity';
import { InMemoryTechnicianRepository } from './fakes/in-memory-technician.repository';
import { InMemoryAvailabilityRepository } from './fakes/in-memory-availability.repository';
import { InMemoryUserRepository } from './fakes/in-memory-user.repository';
import { InMemoryBookingRepository } from './fakes/in-memory-booking.repository';
import { NoopBookingEmailNotifier } from './fakes/noop-booking-email-notifier';
import { RecordingNotificationPublisher } from './fakes/recording-notification-publisher';
import { InMemoryNotificationRepository } from './fakes/in-memory-notification.repository';
import { finalizeTestApp } from './utils/finalize-test-app';

describe('Admin RBAC (e2e)', () => {
  let app: INestApplication;
  let jwt: JwtService;
  let users: InMemoryUserRepository;
  let technicians: InMemoryTechnicianRepository;
  let availabilities: InMemoryAvailabilityRepository;
  let bookings: InMemoryBookingRepository;

  function tokenFor(role: 'acheteur' | 'technicien' | 'admin') {
    return jwt.sign({ sub: `${role}-user`, role, email: `${role}@example.com` });
  }

  beforeEach(async () => {
    users = new InMemoryUserRepository();
    availabilities = new InMemoryAvailabilityRepository();
    technicians = new InMemoryTechnicianRepository(users, availabilities);
    users.seed(new User('user-1', 'tech1@example.com', 'Tech One', 'technicien', 'password'));
    technicians.seed(new Technician('tech-1', 'user-1', '0600000001', ['electricite'], ['idf'], null, 'pending', null));
    bookings = new InMemoryBookingRepository(availabilities, technicians, users);

    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        JwtModule.register({ global: true, secret: process.env.JWT_SECRET }),
        NotificationsModule,
        AdminModule,
      ],
    })
      .overrideProvider(TECHNICIAN_REPOSITORY)
      .useValue(technicians)
      .overrideProvider(BOOKING_REPOSITORY)
      .useValue(bookings)
      .overrideProvider(BOOKING_EMAIL_NOTIFIER)
      .useValue(new NoopBookingEmailNotifier())
      .overrideProvider(USER_REPOSITORY)
      .useValue(users)
      .overrideProvider(NOTIFICATION_REPOSITORY)
      .useValue(new InMemoryNotificationRepository())
      .overrideProvider(NOTIFICATION_PUBLISHER)
      .useValue(new RecordingNotificationPublisher())
      .compile();

    app = await finalizeTestApp(moduleRef);
    jwt = moduleRef.get(JwtService);
  });

  afterEach(() => app.close());

  it('401 sans cookie de session', async () => {
    await request(app.getHttpServer()).get('/api/admin/technicians').expect(401);
  });

  it("403 pour un rôle acheteur (endpoints réservés à l'admin)", async () => {
    await request(app.getHttpServer())
      .get('/api/admin/technicians')
      .set('Cookie', `session=${tokenFor('acheteur')}`)
      .expect(403);
  });

  it('403 pour un rôle technicien', async () => {
    await request(app.getHttpServer())
      .get('/api/admin/technicians')
      .set('Cookie', `session=${tokenFor('technicien')}`)
      .expect(403);
  });

  it('200 pour un admin', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/admin/technicians')
      .set('Cookie', `session=${tokenFor('admin')}`)
      .expect(200);

    expect(res.body.items).toHaveLength(1);
  });

  it("l'admin peut approuver un technicien", async () => {
    await request(app.getHttpServer())
      .patch('/api/admin/technicians/tech-1/status')
      .set('Cookie', `session=${tokenFor('admin')}`)
      .send({ status: 'approved' })
      .expect(200);
  });

  it('400 sur une valeur de statut invalide', async () => {
    await request(app.getHttpServer())
      .patch('/api/admin/technicians/tech-1/status')
      .set('Cookie', `session=${tokenFor('admin')}`)
      .send({ status: 'not-a-real-status' })
      .expect(400);
  });

  it("GET /admin/bookings renvoie 401 sans session, 403 pour un rôle non admin, et la page de réservations pour un admin", async () => {
    await request(app.getHttpServer()).get('/api/admin/bookings').expect(401);

    await request(app.getHttpServer())
      .get('/api/admin/bookings')
      .set('Cookie', `session=${tokenFor('acheteur')}`)
      .expect(403);

    users.seed(new User('buyer-1', 'buyer@example.com', 'Alice Acheteuse', 'acheteur', 'password'));
    await technicians.setStatus('tech-1', 'approved');
    const slot = await availabilities.create({
      technicianId: 'tech-1',
      startDatetime: new Date(Date.now() + 24 * 60 * 60 * 1000),
      endDatetime: new Date(Date.now() + 25 * 60 * 60 * 1000),
    });
    await bookings.createIfSlotAvailable({
      availabilityId: slot.id,
      buyerId: 'buyer-1',
      buyerPhone: '0611111111',
      propertyAddress: '1 rue de Paris',
    });

    const res = await request(app.getHttpServer())
      .get('/api/admin/bookings')
      .set('Cookie', `session=${tokenFor('admin')}`)
      .expect(200);

    expect(res.body).toMatchObject({ page: 1, pageSize: 12, hasMore: false });
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0]).toMatchObject({ technicianFullName: 'Tech One', propertyAddress: '1 rue de Paris' });
  });
});
