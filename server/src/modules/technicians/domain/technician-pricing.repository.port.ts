export const TECHNICIAN_PRICING_REPOSITORY = Symbol('TECHNICIAN_PRICING_REPOSITORY');

export interface TechnicianPricingItem {
  id: string;
  technicianId: string;
  label: string;
  price: number;
  position: number;
}

export interface TechnicianPricingRepositoryPort {
  create(technicianId: string, label: string, price: number): Promise<TechnicianPricingItem>;
  findAllByTechnicianId(technicianId: string): Promise<TechnicianPricingItem[]>;
  // Ne supprime que si `technicianId` correspond (contrôle IDOR au niveau repository) —
  // renvoie false si l'item n'existe pas ou n'appartient pas à ce technicien.
  delete(id: string, technicianId: string): Promise<boolean>;
}
