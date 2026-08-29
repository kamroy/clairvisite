import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AdminRolesModule } from '../src/modules/admin-roles/admin-roles.module';
import { ADMIN_ROLE_REPOSITORY } from '../src/modules/admin-roles/domain/admin-role.repository.port';
import { USER_REPOSITORY } from '../src/modules/users/domain/user.repository.port';
import { User } from '../src/modules/users/domain/user.entity';
import { InMemoryAdminRoleRepository } from './fakes/in-memory-admin-role.repository';
import { InMemoryUserRepository } from './fakes/in-memory-user.repository';
import { finalizeTestApp } from './utils/finalize-test-app';

describe('Admin roles RBAC (e2e)', () => {
  let app: INestApplication;
  let jwt: JwtService;
  let users: InMemoryUserRepository;
  let roles: InMemoryAdminRoleRepository;

  function tokenFor(userId: string, role: 'acheteur' | 'technicien' | 'admin') {
    return jwt.sign({ sub: userId, role, email: `${userId}@example.com` });
  }

  beforeEach(async () => {
    users = new InMemoryUserRepository();
    roles = new InMemoryAdminRoleRepository();

    users.seed(new User('admin-1', 'admin1@example.com', 'Admin One', 'admin', 'password'));
    users.seed(new User('admin-2', 'admin2@example.com', 'Admin Two', 'admin', 'password'));
    users.seed(new User('buyer-1', 'buyer1@example.com', 'Buyer One', 'acheteur', 'password'));

    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        JwtModule.register({ global: true, secret: process.env.JWT_SECRET }),
        AdminRolesModule,
      ],
    })
      .overrideProvider(USER_REPOSITORY)
      .useValue(users)
      .overrideProvider(ADMIN_ROLE_REPOSITORY)
      .useValue(roles)
      .compile();

    app = await finalizeTestApp(moduleRef);
    jwt = moduleRef.get(JwtService);
  });

  afterEach(() => app.close());

  it('403 pour un rôle non-admin', async () => {
    await request(app.getHttpServer())
      .get('/api/admin/roles')
      .set('Cookie', `session=${tokenFor('buyer-1', 'acheteur')}`)
      .expect(403);
  });

  it('le rôle Super Admin est auto-créé au premier accès et regroupe tous les admins sans rôle explicite', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/admin/roles')
      .set('Cookie', `session=${tokenFor('admin-1', 'admin')}`)
      .expect(200);

    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({ name: 'Super Admin', isSystem: true, userCount: 2 });
  });

  it('crée un rôle avec un sous-ensemble de permissions, rejette une permission inconnue', async () => {
    await request(app.getHttpServer())
      .post('/api/admin/roles')
      .set('Cookie', `session=${tokenFor('admin-1', 'admin')}`)
      .send({ name: 'Support Agent', permissions: ['support:view', 'support:manage'] })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/admin/roles')
      .set('Cookie', `session=${tokenFor('admin-1', 'admin')}`)
      .send({ name: 'Rôle invalide', permissions: ['not:a-real-permission'] })
      .expect(400);
  });

  it('assigne un admin à un rôle, ce qui déplace le compteur du Super Admin vers le nouveau rôle', async () => {
    await request(app.getHttpServer())
      .get('/api/admin/roles')
      .set('Cookie', `session=${tokenFor('admin-1', 'admin')}`)
      .expect(200);

    const created = await request(app.getHttpServer())
      .post('/api/admin/roles')
      .set('Cookie', `session=${tokenFor('admin-1', 'admin')}`)
      .send({ name: 'Financial Auditor', permissions: ['finance:view'] })
      .expect(201);

    await request(app.getHttpServer())
      .patch('/api/admin/admins/admin-2/role')
      .set('Cookie', `session=${tokenFor('admin-1', 'admin')}`)
      .send({ admin_role_id: created.body.id })
      .expect(200);

    const rolesAfter = await request(app.getHttpServer())
      .get('/api/admin/roles')
      .set('Cookie', `session=${tokenFor('admin-1', 'admin')}`)
      .expect(200);

    const superAdmin = rolesAfter.body.find((r: any) => r.isSystem);
    const auditor = rolesAfter.body.find((r: any) => r.id === created.body.id);
    expect(superAdmin.userCount).toBe(1);
    expect(auditor.userCount).toBe(1);
  });

  it('clone un rôle existant avec les mêmes permissions', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/admin/roles')
      .set('Cookie', `session=${tokenFor('admin-1', 'admin')}`)
      .send({ name: 'Platform Manager', permissions: ['platform:view'] })
      .expect(201);

    const cloned = await request(app.getHttpServer())
      .post(`/api/admin/roles/${created.body.id}/clone`)
      .set('Cookie', `session=${tokenFor('admin-1', 'admin')}`)
      .send({ name: 'Platform Manager (copie)' })
      .expect(201);

    expect(cloned.body.permissions).toEqual(['platform:view']);
    expect(cloned.body.isSystem).toBe(false);
  });

  it('refuse de modifier les permissions ou de supprimer le rôle Super Admin', async () => {
    const rolesRes = await request(app.getHttpServer())
      .get('/api/admin/roles')
      .set('Cookie', `session=${tokenFor('admin-1', 'admin')}`)
      .expect(200);
    const superAdminId = rolesRes.body[0].id;

    await request(app.getHttpServer())
      .patch(`/api/admin/roles/${superAdminId}/permissions`)
      .set('Cookie', `session=${tokenFor('admin-1', 'admin')}`)
      .send({ permissions: [] })
      .expect(403);

    await request(app.getHttpServer())
      .delete(`/api/admin/roles/${superAdminId}`)
      .set('Cookie', `session=${tokenFor('admin-1', 'admin')}`)
      .expect(403);
  });

  it('refuse de supprimer un rôle encore assigné à un admin (409), journalise les actions RBAC', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/admin/roles')
      .set('Cookie', `session=${tokenFor('admin-1', 'admin')}`)
      .send({ name: 'Support Agent', permissions: ['support:view'] })
      .expect(201);

    await request(app.getHttpServer())
      .patch('/api/admin/admins/admin-2/role')
      .set('Cookie', `session=${tokenFor('admin-1', 'admin')}`)
      .send({ admin_role_id: created.body.id })
      .expect(200);

    await request(app.getHttpServer())
      .delete(`/api/admin/roles/${created.body.id}`)
      .set('Cookie', `session=${tokenFor('admin-1', 'admin')}`)
      .expect(409);

    const auditLog = await request(app.getHttpServer())
      .get('/api/admin/audit-log')
      .set('Cookie', `session=${tokenFor('admin-1', 'admin')}`)
      .expect(200);
    const actions = auditLog.body.items.map((e: any) => e.action);
    expect(actions).toEqual(expect.arrayContaining(['role.created', 'user.role_assigned']));
  });

  it('expose le catalogue de permissions groupées par domaine', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/admin/permissions')
      .set('Cookie', `session=${tokenFor('admin-1', 'admin')}`)
      .expect(200);

    expect(res.body.map((g: any) => g.key)).toEqual(['users', 'finance', 'support', 'platform']);
  });
});
