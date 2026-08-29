// Reprend telle quelle la taxonomie du prototype Stitch (US-COMM-02). "devis_finances"
// et "compte_profil" n'ont pour l'instant aucun producteur (pas de module paiement/
// document) : la catégorie existe déjà côté filtre, prête à être alimentée plus tard.
export type NotificationCategory = 'visite_technique' | 'decoration' | 'devis_finances' | 'compte_profil';

export class Notification {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly category: NotificationCategory,
    public readonly title: string,
    public readonly body: string | null,
    public readonly ctaLabel: string | null,
    public readonly ctaUrl: string | null,
    public readonly isRead: boolean,
    public readonly createdAt: Date,
  ) {}
}
