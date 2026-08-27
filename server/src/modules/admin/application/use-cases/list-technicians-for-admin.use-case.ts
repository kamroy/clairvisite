import { Inject, Injectable } from '@nestjs/common';
import { TECHNICIAN_REPOSITORY, TechnicianRepositoryPort } from '../../../technicians/domain/technician.repository.port';
import { USER_REPOSITORY, UserRepositoryPort } from '../../../users/domain/user.repository.port';

@Injectable()
export class ListTechniciansForAdminUseCase {
  constructor(
    @Inject(TECHNICIAN_REPOSITORY) private readonly technicians: TechnicianRepositoryPort,
    @Inject(USER_REPOSITORY) private readonly users: UserRepositoryPort,
  ) {}

  async execute(page: number, pageSize: number) {
    const page_ = await this.technicians.findAll(page, pageSize);
    // Une seule requête groupée plutôt qu'un findById() par technicien (N+1).
    const users = await this.users.findByIds(page_.items.map((t) => t.userId));
    const userById = new Map(users.map((u) => [u.id, u]));

    return {
      ...page_,
      items: page_.items.map((t) => {
        const user = userById.get(t.userId);
        return {
          id: t.id,
          fullName: user?.fullName,
          email: user?.email,
          specialty: t.specialties[0],
          status: t.status,
        };
      }),
    };
  }
}
