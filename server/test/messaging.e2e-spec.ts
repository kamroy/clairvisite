import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { MessagingModule } from '../src/modules/messaging/messaging.module';
import { StorageModule } from '../src/infrastructure/storage/storage.module';
import { FILE_STORAGE } from '../src/infrastructure/storage/file-storage.port';
import { BOOKING_REPOSITORY } from '../src/modules/bookings/domain/booking.repository.port';
import { CONVERSATION_REPOSITORY } from '../src/modules/messaging/domain/conversation.repository.port';
import { NOTIFICATION_PUBLISHER } from '../src/modules/notifications/application/ports/notification-publisher.port';
import { NotificationsModule } from '../src/modules/notifications/notifications.module';
import { NOTIFICATION_REPOSITORY } from '../src/modules/notifications/domain/notification.repository.port';
import { User } from '../src/modules/users/domain/user.entity';
import { Technician } from '../src/modules/technicians/domain/technician.entity';
import { InMemoryUserRepository } from './fakes/in-memory-user.repository';
import { InMemoryTechnicianRepository } from './fakes/in-memory-technician.repository';
import { InMemoryAvailabilityRepository } from './fakes/in-memory-availability.repository';
import { InMemoryBookingRepository } from './fakes/in-memory-booking.repository';
import { InMemoryConversationRepository } from './fakes/in-memory-conversation.repository';
import { FakeFileStorageAdapter } from './fakes/fake-file-storage.adapter';
import { RecordingNotificationPublisher } from './fakes/recording-notification-publisher';
import { InMemoryNotificationRepository } from './fakes/in-memory-notification.repository';
import { finalizeTestApp } from './utils/finalize-test-app';

describe('Messaging (e2e)', () => {
  let app: INestApplication;
  let jwt: JwtService;
  let bookingId: string;
  let otherBookingId: string;
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

    const otherSlot = await availabilities.create({
      technicianId: 'tech-1',
      startDatetime: new Date('2026-09-02T10:00:00Z'),
      endDatetime: new Date('2026-09-02T11:00:00Z'),
    });
    const otherBooking = await bookings.createIfSlotAvailable({
      availabilityId: otherSlot.id,
      buyerId: 'buyer-2',
      buyerPhone: '0611111112',
      propertyAddress: '2 rue de Lyon',
    });
    otherBookingId = otherBooking.id;

    notifications = new RecordingNotificationPublisher();

    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        JwtModule.register({ global: true, secret: process.env.JWT_SECRET }),
        StorageModule,
        NotificationsModule,
        MessagingModule,
      ],
    })
      .overrideProvider(BOOKING_REPOSITORY)
      .useValue(bookings)
      .overrideProvider(CONVERSATION_REPOSITORY)
      .useValue(new InMemoryConversationRepository())
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

  it("l'acheteur et le technicien peuvent échanger des messages liés à leur réservation", async () => {
    await request(app.getHttpServer())
      .post(`/api/conversations/${bookingId}/messages`)
      .set('Cookie', `session=${tokenFor('buyer-1', 'acheteur')}`)
      .send({ content: 'Bonjour, à quelle heure arrivez-vous ?' })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/conversations/${bookingId}/messages`)
      .set('Cookie', `session=${tokenFor('tech-user-1', 'technicien')}`)
      .send({ content: "J'arrive à 10h comme prévu." })
      .expect(201);

    const res = await request(app.getHttpServer())
      .get(`/api/conversations/${bookingId}/messages`)
      .set('Cookie', `session=${tokenFor('buyer-1', 'acheteur')}`)
      .expect(200);

    expect(res.body.messages).toHaveLength(2);
    expect(res.body.messages[0].content).toBe('Bonjour, à quelle heure arrivez-vous ?');
    // Vu depuis buyer-1 : l'interlocuteur affiché doit être le technicien, pas soi-même.
    expect(res.body.booking).toMatchObject({ interlocutorName: 'Tech One' });

    expect(notifications.calls).toContainEqual(
      expect.objectContaining({ userId: 'tech-user-1', title: 'Nouveau message de Buyer One' }),
    );
    expect(notifications.calls).toContainEqual(
      expect.objectContaining({ userId: 'buyer-1', title: 'Nouveau message de Tech One' }),
    );
  });

  it("un message vide sans pièce jointe est refusé (400)", async () => {
    await request(app.getHttpServer())
      .post(`/api/conversations/${bookingId}/messages`)
      .set('Cookie', `session=${tokenFor('buyer-1', 'acheteur')}`)
      .send({})
      .expect(400);
  });

  it("un tiers ne peut ni lire ni écrire dans une conversation qui ne le concerne pas", async () => {
    await request(app.getHttpServer())
      .get(`/api/conversations/${bookingId}/messages`)
      .set('Cookie', `session=${tokenFor('buyer-2', 'acheteur')}`)
      .expect(403);

    await request(app.getHttpServer())
      .post(`/api/conversations/${bookingId}/messages`)
      .set('Cookie', `session=${tokenFor('buyer-2', 'acheteur')}`)
      .send({ content: 'Intrusion' })
      .expect(403);
  });

  it('marque les messages comme lus quand le destinataire ouvre la conversation', async () => {
    await request(app.getHttpServer())
      .post(`/api/conversations/${bookingId}/messages`)
      .set('Cookie', `session=${tokenFor('buyer-1', 'acheteur')}`)
      .send({ content: 'Un message' })
      .expect(201);

    const beforeRead = await request(app.getHttpServer())
      .get(`/api/conversations`)
      .set('Cookie', `session=${tokenFor('tech-user-1', 'technicien')}`)
      .expect(200);
    expect(beforeRead.body.items.find((c: any) => c.bookingId === bookingId).unreadCount).toBe(1);

    await request(app.getHttpServer())
      .get(`/api/conversations/${bookingId}/messages`)
      .set('Cookie', `session=${tokenFor('tech-user-1', 'technicien')}`)
      .expect(200);

    const afterRead = await request(app.getHttpServer())
      .get(`/api/conversations`)
      .set('Cookie', `session=${tokenFor('tech-user-1', 'technicien')}`)
      .expect(200);
    expect(afterRead.body.items.find((c: any) => c.bookingId === bookingId).unreadCount).toBe(0);
  });

  it('le technicien voit une conversation par réservation dans sa liste, avec le dernier message', async () => {
    await request(app.getHttpServer())
      .post(`/api/conversations/${bookingId}/messages`)
      .set('Cookie', `session=${tokenFor('buyer-1', 'acheteur')}`)
      .send({ content: 'Première réservation' })
      .expect(201);
    await request(app.getHttpServer())
      .post(`/api/conversations/${otherBookingId}/messages`)
      .set('Cookie', `session=${tokenFor('buyer-2', 'acheteur')}`)
      .send({ content: 'Seconde réservation' })
      .expect(201);

    const res = await request(app.getHttpServer())
      .get('/api/conversations')
      .set('Cookie', `session=${tokenFor('tech-user-1', 'technicien')}`)
      .expect(200);

    expect(res.body.items).toHaveLength(2);
    const first = res.body.items.find((c: any) => c.bookingId === bookingId);
    expect(first.interlocutorName).toBe('Buyer One');
    expect(first.lastMessage.content).toBe('Première réservation');
  });

  it('permet de joindre un fichier après une URL pré-signée, avec vérification IDOR sur la clé', async () => {
    const uploadRes = await request(app.getHttpServer())
      .post(`/api/conversations/${bookingId}/attachments/upload-url`)
      .set('Cookie', `session=${tokenFor('buyer-1', 'acheteur')}`)
      .send({ file_name: 'photo.jpg', content_type: 'image/jpeg' })
      .expect(201);
    expect(uploadRes.body.key).toContain(`messages/${bookingId}/`);

    const sent = await request(app.getHttpServer())
      .post(`/api/conversations/${bookingId}/messages`)
      .set('Cookie', `session=${tokenFor('buyer-1', 'acheteur')}`)
      .send({ attachment_key: uploadRes.body.key, attachment_file_name: 'photo.jpg' })
      .expect(201);
    expect(sent.body.attachmentDownloadUrl).toEqual(expect.any(String));

    await request(app.getHttpServer())
      .post(`/api/conversations/${bookingId}/messages`)
      .set('Cookie', `session=${tokenFor('buyer-1', 'acheteur')}`)
      .send({ attachment_key: `messages/${otherBookingId}/x.jpg`, attachment_file_name: 'x.jpg' })
      .expect(403);
  });
});
