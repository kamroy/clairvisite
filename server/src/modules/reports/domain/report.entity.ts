export type ReportStatus = 'draft' | 'submitted';
export type ReportSectionType = 'introduction' | 'structure' | 'electricity' | 'plumbing' | 'heating';
export type SystemStatus = 'good' | 'medium' | 'critical';
export type PhotoRole = 'before' | 'after';

// Ordre d'affichage stable (formulaire technicien, synthèse acheteur) — les trois
// derniers portent un SystemStatus, les deux premiers sont narratifs uniquement.
export const REPORT_SECTION_TYPES: ReportSectionType[] = [
  'introduction',
  'structure',
  'electricity',
  'plumbing',
  'heating',
];

export const SYSTEM_SECTION_TYPES: ReportSectionType[] = ['electricity', 'plumbing', 'heating'];

export class ReportPhoto {
  constructor(
    public readonly id: string,
    public readonly key: string,
    public readonly caption: string | null,
    public readonly role: PhotoRole | null,
    public readonly position: number,
  ) {}
}

export class ReportSection {
  constructor(
    public readonly id: string,
    public readonly sectionType: ReportSectionType,
    public readonly content: string | null,
    public readonly status: SystemStatus | null,
    public readonly photos: ReportPhoto[] = [],
  ) {}
}

export class TechnicalReport {
  constructor(
    public readonly id: string,
    public readonly bookingId: string,
    public readonly status: ReportStatus,
    public readonly generalConclusion: string | null,
    public readonly submittedAt: Date | null,
    public readonly createdAt: Date,
    public readonly sections: ReportSection[] = [],
  ) {}
}
