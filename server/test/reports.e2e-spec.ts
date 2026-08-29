import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { ReportsModule } from '../src/modules/reports/reports.module';
import { StorageModule } from '../src/infrastructure/storage/storage.module';
import { FILE_STORAGE } from '../src/infrastructure/storage/file-storage.port';
import { BOOKING_REPOSITORY } from '../src/modules/bookings/domain/booking.repository.port';
import { REPORT_REPOSITORY } from '../src/modules/reports/domain/report.repository.port';
import { NOTIFICATION_PUBLISHER } from '../src/modules/notifications/application/ports/notification-publisher.port';
import { NotificationsModule } from '../src/modules/notifications/notifications.module';
import { NOTIFICATION_REPOSITORY } from '../src/modules/notifications/domain/notification.repository.port';
import { User } from '../src/modules/users/domain/user.entity';
import { Technician } from '../src/modules/technicians/domain/technician.entity';
import { InMemoryUserRepository } from './fakes/in-memory-user.repository';
import { InMemoryTechnicianRepository } from './fakes/in-memory-technician.repository';
import { InMemoryAvailabilityRepository } from './fakes/in-memory-availability.repository';
import { InMemoryBookingRepository } from './fakes/in-memory-booking.repository';
import { InMemoryReportRepository } from './fakes/in-memory-report.repository';
import { FakeFileStorageAdapter } from './fakes/fake-file-storage.adapter';
import { RecordingNotificationPublisher } from './fakes/recording-notification-publisher';
import { InMemoryNotificationRepository } from './fakes/in-memory-notification.repository';
import { finalizeTestApp } from './utils/finalize-test-app';

describe('Reports (e2e)', () => {
  let app: INestApplication;
  let jwt: JwtService;
  let bookingId: string;
  let notifications: RecordingNotificationPublisher;

  function tokenFor(userId: string, role: 'acheteur' | 'technicien') {
    return jwt.sign({ sub: userId, role, email: `${userId}@example.com` });
  }

  beforeEach(async () => {
    const users = new InMemoryUserRepository();
    const availabilities = new InMemoryAvailabilityRepository();
    const technicians = new InMemoryTechnicianRepository(users, availabilities);
    const bookings = new InMemoryBookingRepository(availabilities, technicians, users);

    users.seed(new User('tech-user-1', 'tech1@example.com', 'Tech One', 'technicien', 'password'));
    users.seed(new User('other-tech-user', 'tech2@example.com', 'Tech Two', 'technicien', 'password'));
    users.seed(new User('buyer-1', 'buyer1@example.com', 'Buyer One', 'acheteur', 'password'));
    users.seed(new User('buyer-2', 'buyer2@example.com', 'Buyer Two', 'acheteur', 'password'));
    technicians.seed(new Technician('tech-1', 'tech-user-1', '0600000001', ['electricite'], ['idf'], null, 'approved', null));

    const slot = await availabilities.create({
      technicianId: 'tech-1',
      startDatetime: new Date('2026-09-01T10:00:00Z'),
      endDatetime: new Date('2026-09-01T11:00:00Z'),
    });
    const booking = await bookings.createIfSlotAvailable({
      availabilityId: slot.id,
      buyerId: 'buyer-1',
      buyerPhone: '0611111111',
      propertyAddress: '1 rue de Paris',
    });
    bookingId = booking.id;

    notifications = new RecordingNotificationPublisher();

    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        JwtModule.register({ global: true, secret: process.env.JWT_SECRET }),
        StorageModule,
        NotificationsModule,
        ReportsModule,
      ],
    })
      .overrideProvider(BOOKING_REPOSITORY)
      .useValue(bookings)
      .overrideProvider(REPORT_REPOSITORY)
      .useValue(new InMemoryReportRepository())
      .overrideProvider(FILE_STORAGE)
      .useValue(new FakeFileStorageAdapter())
      .overrideProvider(NOTIFICATION_REPOSITORY)
      .useValue(new InMemoryNotificationRepository())
      .overrideProvider(NOTIFICATION_PUBLISHER)
      .useValue(notifications)
      .compile();

    app = await finalizeTestApp(moduleRef);
    jwt = moduleRef.get(JwtService);
  });

  afterEach(() => app.close());

  it("le technicien assigné voit son brouillon auto-créé avec les 5 sections prédéfinies", async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/bookings/${bookingId}/report`)
      .set('Cookie', `session=${tokenFor('tech-user-1', 'technicien')}`)
      .expect(200);

    expect(res.body.status).toBe('draft');
    expect(res.body.sections.map((s: any) => s.sectionType).sort()).toEqual(
      ['electricity', 'heating', 'introduction', 'plumbing', 'structure'].sort(),
    );
  });

  it("un technicien tiers ne peut pas accéder au rapport d'une réservation qui n'est pas la sienne", async () => {
    await request(app.getHttpServer())
      .get(`/api/bookings/${bookingId}/report`)
      .set('Cookie', `session=${tokenFor('other-tech-user', 'technicien')}`)
      .expect(403);
  });

  it("l'acheteur ne voit pas de rapport tant qu'il n'est pas soumis", async () => {
    await request(app.getHttpServer())
      .get(`/api/bookings/${bookingId}/report`)
      .set('Cookie', `session=${tokenFor('buyer-1', 'acheteur')}`)
      .expect(404);
  });

  it("un autre acheteur ne peut pas accéder au rapport d'une réservation qui n'est pas la sienne", async () => {
    await request(app.getHttpServer())
      .get(`/api/bookings/${bookingId}/report`)
      .set('Cookie', `session=${tokenFor('buyer-2', 'acheteur')}`)
      .expect(403);
  });

  it('le technicien peut modifier une section et la conclusion, puis soumettre — l’acheteur voit alors le rapport', async () => {
    await request(app.getHttpServer())
      .patch(`/api/bookings/${bookingId}/report/sections/electricity`)
      .set('Cookie', `session=${tokenFor('tech-user-1', 'technicien')}`)
      .send({ content: 'Installation aux normes, tableau récent.', status: 'good' })
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/api/bookings/${bookingId}/report`)
      .set('Cookie', `session=${tokenFor('tech-user-1', 'technicien')}`)
      .send({ general_conclusion: 'Bien globalement sain, quelques points de vigilance.' })
      .expect(200);

    await request(app.getHttpServer())
      .post(`/api/bookings/${bookingId}/report/submit`)
      .set('Cookie', `session=${tokenFor('tech-user-1', 'technicien')}`)
      .expect(201);

    const buyerView = await request(app.getHttpServer())
      .get(`/api/bookings/${bookingId}/report`)
      .set('Cookie', `session=${tokenFor('buyer-1', 'acheteur')}`)
      .expect(200);

    expect(buyerView.body.status).toBe('submitted');
    expect(buyerView.body.generalConclusion).toBe('Bien globalement sain, quelques points de vigilance.');
    const electricitySection = buyerView.body.sections.find((s: any) => s.sectionType === 'electricity');
    expect(electricitySection).toMatchObject({ content: 'Installation aux normes, tableau récent.', status: 'good' });

    expect(notifications.calls).toContainEqual(
      expect.objectContaining({ userId: 'buyer-1', title: 'Rapport disponible' }),
    );
  });

  it('un rapport soumis ne peut plus être modifié (409), même sans brouillon préexistant', async () => {
    await request(app.getHttpServer())
      .post(`/api/bookings/${bookingId}/report/submit`)
      .set('Cookie', `session=${tokenFor('tech-user-1', 'technicien')}`)
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/api/bookings/${bookingId}/report/sections/plumbing`)
      .set('Cookie', `session=${tokenFor('tech-user-1', 'technicien')}`)
      .send({ content: 'Trop tard' })
      .expect(409);
  });

  it('le technicien peut demander une URL de dépôt, attacher une photo puis la retirer', async () => {
    const uploadRes = await request(app.getHttpServer())
      .post(`/api/bookings/${bookingId}/report/sections/structure/photos/upload-url`)
      .set('Cookie', `session=${tokenFor('tech-user-1', 'technicien')}`)
      .send({ file_name: 'fissure.jpg', content_type: 'image/jpeg' })
      .expect(201);

    expect(uploadRes.body.key).toContain(`reports/${bookingId}/structure/`);

    const attachRes = await request(app.getHttpServer())
      .post(`/api/bookings/${bookingId}/report/sections/structure/photos`)
      .set('Cookie', `session=${tokenFor('tech-user-1', 'technicien')}`)
      .send({ key: uploadRes.body.key, caption: 'Fissure mur porteur' })
      .expect(201);

    const afterAttach = await request(app.getHttpServer())
      .get(`/api/bookings/${bookingId}/report`)
      .set('Cookie', `session=${tokenFor('tech-user-1', 'technicien')}`)
      .expect(200);
    const structureSection = afterAttach.body.sections.find((s: any) => s.sectionType === 'structure');
    expect(structureSection.photos).toHaveLength(1);
    expect(structureSection.photos[0].downloadUrl).toEqual(expect.any(String));

    await request(app.getHttpServer())
      .delete(`/api/bookings/${bookingId}/report/photos/${attachRes.body.id}`)
      .set('Cookie', `session=${tokenFor('tech-user-1', 'technicien')}`)
      .expect(200);
  });

  it('refuse une section de rapport inconnue (400)', async () => {
    await request(app.getHttpServer())
      .patch(`/api/bookings/${bookingId}/report/sections/roofing`)
      .set('Cookie', `session=${tokenFor('tech-user-1', 'technicien')}`)
      .send({ content: 'Section inventée' })
      .expect(400);
  });

  it("refuse une clé de fichier qui ne correspond pas à cette section (IDOR)", async () => {
    await request(app.getHttpServer())
      .post(`/api/bookings/${bookingId}/report/sections/structure/photos`)
      .set('Cookie', `session=${tokenFor('tech-user-1', 'technicien')}`)
      .send({ key: `reports/some-other-booking/structure/x.jpg` })
      .expect(403);
  });
});
