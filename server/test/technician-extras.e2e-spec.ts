import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { TechnicianExtrasModule } from '../src/modules/technicians/technician-extras.module';
import { StorageModule } from '../src/infrastructure/storage/storage.module';
import { FILE_STORAGE } from '../src/infrastructure/storage/file-storage.port';
import { TECHNICIAN_REPOSITORY } from '../src/modules/technicians/domain/technician.repository.port';
import { TECHNICIAN_DOCUMENT_REPOSITORY } from '../src/modules/technicians/domain/technician-document.repository.port';
import { TECHNICIAN_PRICING_REPOSITORY } from '../src/modules/technicians/domain/technician-pricing.repository.port';
import { TECHNICIAN_PORTFOLIO_REPOSITORY } from '../src/modules/technicians/domain/technician-portfolio.repository.port';
import { Technician } from '../src/modules/technicians/domain/technician.entity';
import { InMemoryTechnicianRepository } from './fakes/in-memory-technician.repository';
import { InMemoryTechnicianDocumentRepository } from './fakes/in-memory-technician-document.repository';
import { InMemoryTechnicianPricingRepository } from './fakes/in-memory-technician-pricing.repository';
import { InMemoryTechnicianPortfolioRepository } from './fakes/in-memory-technician-portfolio.repository';
import { InMemoryUserRepository } from './fakes/in-memory-user.repository';
import { InMemoryAvailabilityRepository } from './fakes/in-memory-availability.repository';
import { FakeFileStorageAdapter } from './fakes/fake-file-storage.adapter';
import { finalizeTestApp } from './utils/finalize-test-app';

describe('Technician extras — documents, pricing, portfolio (e2e)', () => {
  let app: INestApplication;
  let technicians: InMemoryTechnicianRepository;
  let documents: InMemoryTechnicianDocumentRepository;
  let pricing: InMemoryTechnicianPricingRepository;
  let portfolio: InMemoryTechnicianPortfolioRepository;
  let jwt: JwtService;

  function tokenFor(userId: string) {
    return jwt.sign({ sub: userId, role: 'technicien', email: `${userId}@example.com` });
  }

  beforeEach(async () => {
    technicians = new InMemoryTechnicianRepository(new InMemoryUserRepository(), new InMemoryAvailabilityRepository());
    documents = new InMemoryTechnicianDocumentRepository();
    pricing = new InMemoryTechnicianPricingRepository();
    portfolio = new InMemoryTechnicianPortfolioRepository();

    technicians.seed(
      new Technician('tech-A', 'user-A', '0600000001', ['electricite'], ['idf'], null, 'pending', null),
    );

    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        JwtModule.register({ global: true, secret: process.env.JWT_SECRET }),
        StorageModule,
        TechnicianExtrasModule,
      ],
    })
      .overrideProvider(TECHNICIAN_REPOSITORY)
      .useValue(technicians)
      .overrideProvider(TECHNICIAN_DOCUMENT_REPOSITORY)
      .useValue(documents)
      .overrideProvider(TECHNICIAN_PRICING_REPOSITORY)
      .useValue(pricing)
      .overrideProvider(TECHNICIAN_PORTFOLIO_REPOSITORY)
      .useValue(portfolio)
      .overrideProvider(FILE_STORAGE)
      .useValue(new FakeFileStorageAdapter())
      .compile();

    app = await finalizeTestApp(moduleRef);
    jwt = moduleRef.get(JwtService);
  });

  afterEach(() => app.close());

  describe('documents', () => {
    it("404 si l'utilisateur n'a pas encore de profil technicien (étape Expertise non complétée)", async () => {
      await request(app.getHttpServer())
        .post('/api/technicians/me/documents/upload-url')
        .set('Cookie', `session=${tokenFor('user-sans-profil')}`)
        .send({ fileName: 'assurance.pdf', contentType: 'application/pdf' })
        .expect(404);
    });

    it('demande une URL de dépôt puis attache le document au profil', async () => {
      const uploadRes = await request(app.getHttpServer())
        .post('/api/technicians/me/documents/upload-url')
        .set('Cookie', `session=${tokenFor('user-A')}`)
        .send({ fileName: 'assurance.pdf', contentType: 'application/pdf' })
        .expect(201);

      expect(uploadRes.body.key).toMatch(/^technicians\/tech-A\//);
      expect(uploadRes.body.uploadUrl).toContain(encodeURIComponent(uploadRes.body.key));

      await request(app.getHttpServer())
        .post('/api/technicians/me/documents')
        .set('Cookie', `session=${tokenFor('user-A')}`)
        .send({ key: uploadRes.body.key, fileName: 'assurance.pdf' })
        .expect(201);

      const listRes = await request(app.getHttpServer())
        .get('/api/technicians/me/documents')
        .set('Cookie', `session=${tokenFor('user-A')}`)
        .expect(200);

      expect(listRes.body).toHaveLength(1);
      expect(listRes.body[0]).toMatchObject({ fileName: 'assurance.pdf', key: uploadRes.body.key });
      expect(listRes.body[0].downloadUrl).toContain('fake-storage.test/download');
    });

    it("403 quand la clé fournie n'appartient pas au technicien courant", async () => {
      await request(app.getHttpServer())
        .post('/api/technicians/me/documents')
        .set('Cookie', `session=${tokenFor('user-A')}`)
        .send({ key: 'technicians/tech-B/some-other-file.pdf', fileName: 'assurance.pdf' })
        .expect(403);
    });
  });

  describe('pricing', () => {
    it('ajoute une prestation puis la retrouve dans la grille tarifaire publique', async () => {
      await request(app.getHttpServer())
        .post('/api/technicians/me/pricing-items')
        .set('Cookie', `session=${tokenFor('user-A')}`)
        .send({ label: 'Conseil Décor Complète', price: 250 })
        .expect(201);

      const listRes = await request(app.getHttpServer()).get('/api/technicians/tech-A/pricing-items').expect(200);

      expect(listRes.body).toEqual([
        expect.objectContaining({ label: 'Conseil Décor Complète', price: 250 }),
      ]);
    });

    it('supprime une prestation appartenant au technicien courant', async () => {
      const created = await pricing.create('tech-A', 'Rapport Photos', 80);

      await request(app.getHttpServer())
        .delete(`/api/technicians/me/pricing-items/${created.id}`)
        .set('Cookie', `session=${tokenFor('user-A')}`)
        .expect(200);

      expect(await pricing.findAllByTechnicianId('tech-A')).toHaveLength(0);
    });

    it("404 en tentant de supprimer une prestation d'un autre technicien", async () => {
      technicians.seed(new Technician('tech-B', 'user-B', '0600000002', [], ['idf'], null, 'approved', null));
      const created = await pricing.create('tech-B', 'Rapport Photos', 80);

      await request(app.getHttpServer())
        .delete(`/api/technicians/me/pricing-items/${created.id}`)
        .set('Cookie', `session=${tokenFor('user-A')}`)
        .expect(404);
    });
  });

  describe('portfolio', () => {
    it('demande une URL de dépôt puis attache la réalisation au profil', async () => {
      const uploadRes = await request(app.getHttpServer())
        .post('/api/technicians/me/portfolio/upload-url')
        .set('Cookie', `session=${tokenFor('user-A')}`)
        .send({ fileName: 'salon-avant.jpg', contentType: 'image/jpeg' })
        .expect(201);

      expect(uploadRes.body.key).toMatch(/^technicians\/tech-A\/portfolio\//);

      await request(app.getHttpServer())
        .post('/api/technicians/me/portfolio')
        .set('Cookie', `session=${tokenFor('user-A')}`)
        .send({ key: uploadRes.body.key, caption: 'Salon avant travaux' })
        .expect(201);

      const listRes = await request(app.getHttpServer()).get('/api/technicians/tech-A/portfolio').expect(200);

      expect(listRes.body).toHaveLength(1);
      expect(listRes.body[0]).toMatchObject({ caption: 'Salon avant travaux', key: uploadRes.body.key });
      expect(listRes.body[0].imageUrl).toContain('fake-storage.test/download');
    });

    it("403 quand la clé fournie n'appartient pas au technicien courant", async () => {
      await request(app.getHttpServer())
        .post('/api/technicians/me/portfolio')
        .set('Cookie', `session=${tokenFor('user-A')}`)
        .send({ key: 'technicians/tech-B/portfolio/some-photo.jpg' })
        .expect(403);
    });
  });
});
