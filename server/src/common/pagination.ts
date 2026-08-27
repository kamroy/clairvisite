export interface PageResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Convention "over-fetch" : l'appelant récupère pageSize + 1 lignes (via take côté
// Prisma) pour déduire hasMore sans requête COUNT séparée ; cette fonction retire
// la ligne en trop avant de renvoyer la page au client.
export function toPageResult<T>(rows: T[], page: number, pageSize: number): PageResult<T> {
  const hasMore = rows.length > pageSize;
  return { items: hasMore ? rows.slice(0, pageSize) : rows, page, pageSize, hasMore };
}
