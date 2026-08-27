import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { TechniciansModule } from '../src/modules/technicians/technicians.module';
import { TECHNICIAN_REPOSITORY } from '../src/modules/technicians/domain/technician.repository.port';
import { Technician } from '../src/modules/technicians/domain/technician.entity';
import { User } from '../src/modules/users/domain/user.entity';
import { InMemoryTechnicianRepository } from './fakes/in-memory-technician.repository';
import { InMemoryAvailabilityRepository } from './fakes/in-memory-availability.repository';
import { InMemoryUserRepository } from './fakes/in-memory-user.repository';
import { finalizeTestApp } from './utils/finalize-test-app';

describe('Public technician profile — no phone leak (e2e)', () => {
  let app: INestApplication;
  let users: InMemoryUserRepository;
  let technicians: InMemoryTechnicianRepository;
  let availabilities: InMemoryAvailabilityRepository;
  let technicianId: string;

  beforeEach(async () => {
    users = new InMemoryUserRepository();
    availabilities = new InMemoryAvailabilityRepository();
    technicians = new InMemoryTechnicianRepository(users, availabilities);

    users.seed(new User('user-1', 'tech1@example.com', 'Alice Martin', 'technicien', 'password'));
    technicians.seed(
      new Technician('tech-1', 'user-1', '0600000001', ['electricite'], ['idf'], 45, 'approved', 'Bio courte'),
    );
    await availabilities.create({
      technicianId: 'tech-1',
      startDatetime: new Date(Date.now() + 24 * 60 * 60 * 1000),
      endDatetime: new Date(Date.now() + 25 * 60 * 60 * 1000),
    });
    technicianId = 'tech-1';

    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        JwtModule.register({ global: true, secret: process.env.JWT_SECRET }),
        TechniciansModule,
      ],
    })
      .overrideProvider(TECHNICIAN_REPOSITORY)
      .useValue(technicians)
      .compile();

    app = await finalizeTestApp(moduleRef);
  });

  afterEach(() => app.close());

  // Régression sécurité : le téléphone personnel d'un technicien ne doit jamais être
  // exposé sur les routes publiques (search / fiche technicien), accessibles sans
  // authentification. Voir technicians.controller.ts::toPublicTechnician.
  it('GET /technicians (recherche publique) ne renvoie pas le téléphone', async () => {
    const res = await request(app.getHttpServer()).get('/api/technicians').expect(200);

    expect(res.body.items).toHaveLength(1);
    expect(res.body).toMatchObject({ page: 1, pageSize: 12, hasMore: false });
    expect(res.body.items[0]).not.toHaveProperty('phone');
    expect(res.body.items[0]).toMatchObject({
      id: 'tech-1',
      fullName: 'Alice Martin',
      specialties: ['electricite'],
      availableSlotsCount: 1,
    });
  });

  it('GET /technicians pagine les résultats et expose hasMore', async () => {
    for (let i = 4; i <= 5; i++) {
      users.seed(new User(`user-${i}`, `tech${i}@example.com`, `Tech ${i}`, 'technicien', 'password'));
      technicians.seed(new Technician(`tech-${i}`, `user-${i}`, `060000000${i}`, ['electricite'], ['idf'], null, 'approved', null));
      await availabilities.create({
        technicianId: `tech-${i}`,
        startDatetime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        endDatetime: new Date(Date.now() + 25 * 60 * 60 * 1000),
      });
    }
    // 3 techniciens approuvés au total avec créneaux (tech-1, tech-4, tech-5).

    const firstPage = await request(app.getHttpServer())
      .get('/api/technicians?pageSize=2&page=1')
      .expect(200);
    expect(firstPage.body.items).toHaveLength(2);
    expect(firstPage.body.hasMore).toBe(true);

    const secondPage = await request(app.getHttpServer())
      .get('/api/technicians?pageSize=2&page=2')
      .expect(200);
    expect(secondPage.body.items).toHaveLength(1);
    expect(secondPage.body.hasMore).toBe(false);

    const idsAcrossPages = [...firstPage.body.items, ...secondPage.body.items].map((t: { id: string }) => t.id);
    expect(new Set(idsAcrossPages).size).toBe(3);
  });

  it.each([
    ['page=0', 'page=0'],
    ['page négatif', 'page=-1'],
    ['pageSize=0', 'pageSize=0'],
    ['pageSize au-delà du max autorisé (50)', 'pageSize=51'],
    ['page non numérique', 'page=abc'],
  ])('GET /technicians renvoie 400 pour %s', async (_label, query) => {
    await request(app.getHttpServer()).get(`/api/technicians?${query}`).expect(400);
  });

  it('GET /technicians/:id (fiche publique) ne renvoie pas le téléphone', async () => {
    const res = await request(app.getHttpServer()).get(`/api/technicians/${technicianId}`).expect(200);

    expect(res.body).not.toHaveProperty('phone');
    expect(res.body).toMatchObject({ id: 'tech-1', fullName: 'Alice Martin', hourlyRate: 45, bio: 'Bio courte' });
    expect(res.body.availableSlots).toHaveLength(1);
  });

  it('GET /technicians/:id renvoie 404 pour un id inconnu', async () => {
    await request(app.getHttpServer()).get('/api/technicians/does-not-exist').expect(404);
  });

  // Régression : la modération admin doit vraiment bloquer la visibilité publique
  // d'un technicien pending/rejected, pas seulement le filtrage de la recherche.
  it('GET /technicians/:id renvoie 404 pour un technicien non approuvé', async () => {
    users.seed(new User('user-2', 'tech2@example.com', 'Bob Dupont', 'technicien', 'password'));
    technicians.seed(new Technician('tech-2', 'user-2', '0600000002', ['plomberie'], ['idf'], null, 'pending', null));

    await request(app.getHttpServer()).get('/api/technicians/tech-2').expect(404);
  });

  it('GET /technicians (recherche) ne renvoie pas un technicien sans créneau libre', async () => {
    users.seed(new User('user-3', 'tech3@example.com', 'Chloé Petit', 'technicien', 'password'));
    technicians.seed(new Technician('tech-3', 'user-3', '0600000003', ['plomberie'], ['idf'], null, 'approved', null));
    // Aucun créneau créé pour tech-3 : ne doit pas apparaître dans les résultats.

    const res = await request(app.getHttpServer()).get('/api/technicians').expect(200);

    expect(res.body.items.map((t: { id: string }) => t.id)).toEqual(['tech-1']);
  });
});
