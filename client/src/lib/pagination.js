export const PAGE_SIZE = 12;

export function flattenPages(data) {
  return data?.pages.flatMap((p) => p.items) ?? [];
}
