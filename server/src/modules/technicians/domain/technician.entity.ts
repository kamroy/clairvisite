export type TechnicianStatus = 'pending' | 'approved' | 'rejected';
export type TechnicianCategory = 'technique' | 'decoration' | 'architecture';

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
    // Optionnel avec valeur par défaut : évite de casser les call sites positionnels
    // existants (tests, fakes) qui ne connaissaient pas encore cette catégorie.
    public readonly category: TechnicianCategory = 'technique',
    public readonly companyName: string | null = null,
    public readonly siret: string | null = null,
    public readonly yearsOfExperience: number | null = null,
  ) {}

  get isApproved(): boolean {
    return this.status === 'approved';
  }
}
