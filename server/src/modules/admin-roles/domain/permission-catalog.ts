// Catalogue fixe de permissions groupées par domaine (US-ADMIN-01), reprises du
// prototype ("Gestion des utilisateurs, Finances, Support, Paramètres plateforme").
// Volontairement figé en dur (comme ReportSectionType) plutôt que stocké en base :
// ajouter une permission est un changement de code, pas une opération d'admin.
export type PermissionKey =
  | 'users:view'
  | 'users:manage'
  | 'finance:view'
  | 'finance:manage'
  | 'support:view'
  | 'support:manage'
  | 'platform:view'
  | 'platform:manage-roles';

export interface PermissionGroup {
  key: string;
  label: string;
  permissions: { key: PermissionKey; label: string }[];
}

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    key: 'users',
    label: 'Gestion des utilisateurs',
    permissions: [
      { key: 'users:view', label: 'Consulter les acheteurs et les experts' },
      { key: 'users:manage', label: 'Valider, suspendre ou modifier un compte' },
    ],
  },
  {
    key: 'finance',
    label: 'Finances',
    permissions: [
      { key: 'finance:view', label: 'Consulter les paiements et factures' },
      { key: 'finance:manage', label: 'Effectuer des remboursements ou ajustements' },
    ],
  },
  {
    key: 'support',
    label: 'Support',
    permissions: [
      { key: 'support:view', label: 'Consulter les tickets support' },
      { key: 'support:manage', label: 'Traiter et clôturer les tickets' },
    ],
  },
  {
    key: 'platform',
    label: 'Paramètres plateforme',
    permissions: [
      { key: 'platform:view', label: 'Consulter la configuration de la plateforme' },
      { key: 'platform:manage-roles', label: 'Gérer les rôles et permissions admin' },
    ],
  },
];

export const ALL_PERMISSIONS: PermissionKey[] = PERMISSION_GROUPS.flatMap((g) => g.permissions.map((p) => p.key));

export function isValidPermission(value: string): value is PermissionKey {
  return (ALL_PERMISSIONS as string[]).includes(value);
}
