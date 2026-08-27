import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AvailabilitiesModule } from '../src/modules/availabilities/availabilities.module';
import { AVAILABILITY_REPOSITORY } from '../src/modules/availabilities/domain/availability.repository.port';
import { Availability } from '../src/modules/availabilities/domain/availability.entity';
import { TECHNICIAN_REPOSITORY } from '../src/modules/technicians/domain/technician.repository.port';
import { Technician } from '../src/modules/technicians/domain/technician.entity';
import { InMemoryAvailabilityRepository } from './fakes/in-memory-availability.repository';
import { InMemoryTechnicianRepository } from './fakes/in-memory-technician.repository';
import { InMemoryUserRepository } from './fakes/in-memory-user.repository';
import { finalizeTestApp } from './utils/finalize-test-app';

describe('Availabilities IDOR regression (e2e)', () => {
  let app: INestApplication;
  let availabilities: InMemoryAvailabilityRepository;
  let technicians: InMemoryTechnicianRepository;
  let jwt: JwtService;
  let slotId: string;

  function tokenFor(userId: string) {
    return jwt.sign({ sub: userId, role: 'technicien', email: `${userId}@example.com` });
  }

  beforeEach(async () => {
    availabilities = new InMemoryAvailabilityRepository();
    technicians = new InMemoryTechnicianRepository(new InMemoryUserRepository(), availabilities);

    technicians.seed(new Technician('tech-A', 'user-A', '0600000001', ['electricite'], ['idf'], null, 'approved', null));
    technicians.seed(new Technician('tech-B', 'user-B', '0600000002', ['plomberie'], ['idf'], null, 'approved', null));

    const slot = await availabilities.create({
      technicianId: 'tech-A',
      startDatetime: new Date('2026-09-01T10:00:00Z'),
      endDatetime: new Date('2026-09-01T11:00:00Z'),
    });
    slotId = slot.id;

    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        JwtModule.register({ global: true, secret: process.env.JWT_SECRET }),
        AvailabilitiesModule,
      ],
    })
      .overrideProvider(AVAILABILITY_REPOSITORY)
      .useValue(availabilities)
      .overrideProvider(TECHNICIAN_REPOSITORY)
      .useValue(technicians)
      .compile();

    app = await finalizeTestApp(moduleRef);
    jwt = moduleRef.get(JwtService);
  });

  afterEach(() => app.close());

  it("403 quand un technicien tente de modifier le créneau d'un autre technicien", async () => {
    await request(app.getHttpServer())
      .patch(`/api/technicians/me/availabilities/${slotId}`)
      .set('Cookie', `session=${tokenFor('user-B')}`)
      .send({ startDatetime: '2026-09-02T10:00:00Z' })
      .expect(403);

    const untouched = await availabilities.findById(slotId);
    expect(untouched?.startDatetime.toISOString()).toBe('2026-09-01T10:00:00.000Z');
  });

  it("403 quand un technicien tente de supprimer le créneau d'un autre technicien", async () => {
    await request(app.getHttpServer())
      .delete(`/api/technicians/me/availabilities/${slotId}`)
      .set('Cookie', `session=${tokenFor('user-B')}`)
      .expect(403);

    expect(await availabilities.findById(slotId)).not.toBeNull();
  });

  it('403 quand l’appelant n’a même pas de profil technicien', async () => {
    await request(app.getHttpServer())
      .delete(`/api/technicians/me/availabilities/${slotId}`)
      .set('Cookie', `session=${tokenFor('user-without-profile')}`)
      .expect(403);
  });

  it('le propriétaire peut modifier son propre créneau', async () => {
    await request(app.getHttpServer())
      .patch(`/api/technicians/me/availabilities/${slotId}`)
      .set('Cookie', `session=${tokenFor('user-A')}`)
      .send({ startDatetime: '2026-09-02T10:00:00Z' })
      .expect(200);

    const updated = await availabilities.findById(slotId);
    expect(updated?.startDatetime.toISOString()).toBe('2026-09-02T10:00:00.000Z');
  });

  it('le propriétaire peut supprimer son propre créneau', async () => {
    await request(app.getHttpServer())
      .delete(`/api/technicians/me/availabilities/${slotId}`)
      .set('Cookie', `session=${tokenFor('user-A')}`)
      .expect(204);

    expect(await availabilities.findById(slotId)).toBeNull();
  });

  it('401 sans cookie de session', async () => {
    await request(app.getHttpServer()).delete(`/api/technicians/me/availabilities/${slotId}`).expect(401);
  });
});
