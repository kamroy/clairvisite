import { toPageResult } from './pagination';

describe('toPageResult', () => {
  it('renvoie hasMore=false et toutes les lignes quand il y en a moins que pageSize', () => {
    const result = toPageResult(['a', 'b'], 1, 5);

    expect(result).toEqual({ items: ['a', 'b'], page: 1, pageSize: 5, hasMore: false });
  });

  it("renvoie hasMore=false quand il y a exactement pageSize lignes (cas limite)", () => {
    const result = toPageResult(['a', 'b', 'c'], 1, 3);

    expect(result).toEqual({ items: ['a', 'b', 'c'], page: 1, pageSize: 3, hasMore: false });
  });

  it('renvoie hasMore=true et retire la ligne en trop quand il y a pageSize + 1 lignes', () => {
    const result = toPageResult(['a', 'b', 'c', 'd'], 1, 3);

    expect(result).toEqual({ items: ['a', 'b', 'c'], page: 1, pageSize: 3, hasMore: true });
  });

  it('renvoie une page vide sans lignes', () => {
    const result = toPageResult([], 1, 10);

    expect(result).toEqual({ items: [], page: 1, pageSize: 10, hasMore: false });
  });

  it('conserve le numéro de page transmis (page > 1)', () => {
    const result = toPageResult(['a'], 4, 10);

    expect(result.page).toBe(4);
  });
});
