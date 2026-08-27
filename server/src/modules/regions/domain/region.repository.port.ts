export interface Region {
  id: string;
  name: string;
}

export const REGION_REPOSITORY = Symbol('REGION_REPOSITORY');

export interface RegionRepositoryPort {
  findAll(): Promise<Region[]>;
}
