import { describe, expect, it } from "vitest";
import { initials, formatDateTime, formatSlotRange, parseCommaList } from "./format";

describe("initials", () => {
  it("prend les deux premières initiales d'un nom complet", () => {
    expect(initials("Alice Martin")).toBe("AM");
  });

  it("gère un nom composé de plus de deux mots en ne gardant que les deux premières initiales", () => {
    expect(initials("Jean Paul Dupont")).toBe("JP");
  });

  it("renvoie une chaîne vide pour une valeur absente", () => {
    expect(initials(undefined)).toBe("");
    expect(initials("")).toBe("");
  });
});

describe("formatDateTime", () => {
  it("formate une date ISO en français", () => {
    const result = formatDateTime("2026-09-01T09:00:00.000Z");
    expect(result).toEqual(expect.any(String));
    expect(result.length).toBeGreaterThan(0);
  });

  it("renvoie une chaîne vide pour une valeur absente", () => {
    expect(formatDateTime(null)).toBe("");
    expect(formatDateTime(undefined)).toBe("");
  });
});

describe("formatSlotRange", () => {
  it("inclut l'heure de fin quand elle est fournie", () => {
    const result = formatSlotRange("2026-09-01T09:00:00.000Z", "2026-09-01T10:00:00.000Z");
    expect(result).toContain("–");
  });

  it("n'affiche que le début quand la fin est absente", () => {
    const result = formatSlotRange("2026-09-01T09:00:00.000Z");
    expect(result).not.toContain("–");
  });

  it("renvoie une chaîne vide sans date de début", () => {
    expect(formatSlotRange(null, "2026-09-01T10:00:00.000Z")).toBe("");
  });
});

describe("parseCommaList", () => {
  it("découpe et nettoie une liste séparée par des virgules", () => {
    expect(parseCommaList("électricité, plomberie")).toEqual(["électricité", "plomberie"]);
  });

  it("ignore les espaces superflus et les entrées vides", () => {
    expect(parseCommaList(" idf ,, normandie ,")).toEqual(["idf", "normandie"]);
  });

  it("renvoie un tableau vide pour une chaîne vide", () => {
    expect(parseCommaList("")).toEqual([]);
  });
});
