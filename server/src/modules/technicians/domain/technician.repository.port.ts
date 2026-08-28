import { PageResult } from '../../../common/pagination';
import { Technician, TechnicianCategory, TechnicianStatus } from './technician.entity';

export const TECHNICIAN_REPOSITORY = Symbol('TECHNICIAN_REPOSITORY');

// 'availability_desc' délibérément absent : trier par nombre de créneaux libres futurs
// nécessiterait un ORDER BY sur un COUNT de relation filtré, non supporté nativement
// par Prisma sans requête brute — pas justifié pour ce volume de données.
export type TechnicianSortBy = 'relevance' | 'price_asc';

export interface TechnicianSearchCriteria {
  region?: string;
  specialty?: string;
  category?: TechnicianCategory;
  availableFrom?: Date;
  minYearsOfExperience?: number;
  sortBy?: TechnicianSortBy;
  page: number;
  pageSize: number;
}

export interface UpsertTechnicianProfileData {
  phone: string;
  specialties: string[];
  regions: string[];
  hourlyRate?: number | null;
  bio?: string | null;
  // Optionnel : collecté par le formulaire d'inscription expert (étape "Expertise",
  // Phase 1) — un profil créé sans catégorie explicite reste "technique" par défaut.
  category?: TechnicianCategory;
  companyName?: string | null;
  siret?: string | null;
  yearsOfExperience?: number | null;
}

// Vue dénormalisée pour les résultats de recherche publics : agrège des données qui
// n'appartiennent pas à l'entité Technician elle-même (nom du compte utilisateur lié,
// nombre de créneaux libres) — volontairement distincte du domaine (cf. règle
// "DTO de sortie != entité de domaine").
export interface TechnicianSearchResult {
  id: string;
  fullName: string;
  specialties: string[];
  regions: string[];
  category: TechnicianCategory;
  hourlyRate: number | null;
  yearsOfExperience: number | null;
  availableSlotsCount: number;
}

export interface AvailableSlot {
  id: string;
  startDatetime: Date;
  endDatetime: Date;
}

export interface TechnicianDetail {
  id: string;
  fullName: string;
  phone: string;
  specialties: string[];
  regions: string[];
  category: TechnicianCategory;
  hourlyRate: number | null;
  yearsOfExperience: number | null;
  status: TechnicianStatus;
  bio: string | null;
  availableSlots: AvailableSlot[];
}

export interface TechnicianAdminListCriteria {
  status?: TechnicianStatus;
  category?: TechnicianCategory;
  // Recherche libre sur le nom ou l'email du compte utilisateur lié.
  search?: string;
  page: number;
  pageSize: number;
}

export interface TechnicianRepositoryPort {
  findById(id: string): Promise<Technician | null>;
  findByUserId(userId: string): Promise<Technician | null>;
  // Fiche publique complète (nom + créneaux réservables) consommée par la page de
  // profil technicien côté acheteur — distincte de findById (utilisé en interne,
  // sans ces jointures, par ex. pour les contrôles de propriété IDOR).
  findDetailById(id: string): Promise<TechnicianDetail | null>;
  search(criteria: TechnicianSearchCriteria): Promise<PageResult<TechnicianSearchResult>>;
  upsertForUser(userId: string, data: UpsertTechnicianProfileData): Promise<Technician>;
  setStatus(id: string, status: TechnicianStatus): Promise<Technician>;
  findAll(criteria: TechnicianAdminListCriteria): Promise<PageResult<Technician>>;
}
