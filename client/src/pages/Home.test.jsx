import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { api } from "../lib/api";
import { createTestQueryClient } from "../../test/utils";
import Home from "./Home";

vi.mock("../lib/api", () => ({
  api: {
    me: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  api.me.mockRejectedValue(new Error("401"));
});

function renderHome() {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("Home — page d'accueil marketing (US-SEARCH-04)", () => {
  it("présente les deux services avec un CTA dédié vers la recherche filtrée par catégorie", () => {
    renderHome();

    expect(screen.getByText("Contre-visite Technique")).toBeInTheDocument();
    expect(screen.getByText("Décoration & Idées")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Réserver une contre-visite" })).toHaveAttribute(
      "href",
      "/search?category=technique",
    );
    expect(screen.getByRole("link", { name: "Explorer la décoration" })).toHaveAttribute(
      "href",
      "/search?category=decoration",
    );
  });

  it("affiche la frise en 4 étapes du parcours", () => {
    renderHome();

    for (const step of ["Diagnostic", "Comparaison", "Clé en main", "Exécution"]) {
      expect(screen.getByText(step)).toBeInTheDocument();
    }
  });

  it("le CTA principal du hero mène vers la recherche", () => {
    renderHome();
    expect(screen.getByRole("link", { name: "Réserver" })).toHaveAttribute("href", "/search");
  });
});
