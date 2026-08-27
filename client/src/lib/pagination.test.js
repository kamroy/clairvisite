import { describe, expect, it } from "vitest";
import { flattenPages } from "./pagination";

describe("flattenPages", () => {
  it("concatène les items de chaque page dans l'ordre", () => {
    const data = {
      pages: [
        { items: [{ id: "a" }, { id: "b" }], page: 1, pageSize: 2, hasMore: true },
        { items: [{ id: "c" }], page: 2, pageSize: 2, hasMore: false },
      ],
    };
    expect(flattenPages(data).map((i) => i.id)).toEqual(["a", "b", "c"]);
  });

  it("renvoie un tableau vide quand data est absent (avant le premier fetch)", () => {
    expect(flattenPages(undefined)).toEqual([]);
  });
});
