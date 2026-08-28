export const TECHNICIAN_PORTFOLIO_REPOSITORY = Symbol('TECHNICIAN_PORTFOLIO_REPOSITORY');

export interface TechnicianPortfolioItem {
  id: string;
  technicianId: string;
  key: string;
  caption: string | null;
  position: number;
}

export interface TechnicianPortfolioRepositoryPort {
  create(technicianId: string, key: string, caption: string | null): Promise<TechnicianPortfolioItem>;
  findAllByTechnicianId(technicianId: string): Promise<TechnicianPortfolioItem[]>;
  delete(id: string, technicianId: string): Promise<boolean>;
}
