export type TechnicianStatus = 'pending' | 'approved' | 'rejected';

export class Technician {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly phone: string,
    public readonly specialties: string[],
    public readonly regions: string[],
    public readonly hourlyRate: number | null,
    public readonly status: TechnicianStatus,
    public readonly bio: string | null,
  ) {}

  get isApproved(): boolean {
    return this.status === 'approved';
  }
}
