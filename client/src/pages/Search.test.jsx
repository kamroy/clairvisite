import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { api } from "../lib/api";
import { createTestQueryClient } from "../../test/utils";
import Search from "./Search";

vi.mock("../lib/api", () => ({
  api: {
    me: vi.fn(),
    logout: vi.fn(),
    regions: vi.fn(),
    searchTechnicians: vi.fn(),
  },
}));

function renderSearch(client = createTestQueryClient()) {
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <Search />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

let intersectionCallback;

beforeEach(() => {
  vi.clearAllMocks();
  // vi.fn() n'est pas constructible avec `new` ; une vraie classe est nécessaire ici.
  global.IntersectionObserver = class {
    constructor(callback) {
      intersectionCallback = callback;
    }
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  api.me.mockRejectedValue(new Error("401"));
  api.regions.mockResolvedValue([{ id: "idf", name: "Île-de-France" }]);
});

function technicianPage(id, fullName, { hasMore, page }) {
  return {
    items: [{ id, fullName, specialties: [], regions: [], hourlyRate: null, availableSlotsCount: 1 }],
    page,
    pageSize: 12,
    hasMore,
  };
}

describe("Search — recherche et scroll infini", () => {
  it("n'affiche aucun résultat et ne fetch rien avant la première recherche", () => {
    renderSearch();

    expect(
      screen.getByText("Lancez une recherche pour voir les techniciens disponibles."),
    ).toBeInTheDocument();
    expect(api.searchTechnicians).not.toHaveBeenCalled();
  });

  it("affiche les résultats de la première page après une recherche", async () => {
    api.searchTechnicians.mockResolvedValue(technicianPage("t1", "Alice Martin", { hasMore: false, page: 1 }));

    renderSearch();
    fireEvent.click(screen.getByRole("button", { name: "Rechercher" }));

    await waitFor(() => expect(screen.getByText(/Alice Martin/)).toBeInTheDocument());
    expect(api.searchTechnicians).toHaveBeenCalledWith({
      region: "",
      date: "",
      specialty: "",
      category: "",
      experience: "",
      sort: "",
      page: 1,
      pageSize: 12,
    });
  });

  it("charge la page suivante quand la sentinelle de scroll devient visible", async () => {
    api.searchTechnicians
      .mockResolvedValueOnce(technicianPage("t1", "Alice Martin", { hasMore: true, page: 1 }))
      .mockResolvedValueOnce(technicianPage("t2", "Bob Dupont", { hasMore: false, page: 2 }));

    renderSearch();
    fireEvent.click(screen.getByRole("button", { name: "Rechercher" }));

    await waitFor(() => expect(screen.getByText(/Alice Martin/)).toBeInTheDocument());
    expect(screen.queryByText(/Bob Dupont/)).not.toBeInTheDocument();

    intersectionCallback([{ isIntersecting: true }]);

    await waitFor(() => expect(screen.getByText(/Bob Dupont/)).toBeInTheDocument());
    expect(screen.getByText(/Alice Martin/)).toBeInTheDocument();
    expect(api.searchTechnicians).toHaveBeenCalledTimes(2);
    expect(api.searchTechnicians).toHaveBeenLastCalledWith({
      region: "",
      date: "",
      specialty: "",
      category: "",
      experience: "",
      sort: "",
      page: 2,
      pageSize: 12,
    });
  });

  it("affiche un message dédié quand la recherche ne renvoie aucun résultat", async () => {
    api.searchTechnicians.mockResolvedValue({ items: [], page: 1, pageSize: 12, hasMore: false });

    renderSearch();
    fireEvent.click(screen.getByRole("button", { name: "Rechercher" }));

    await waitFor(() =>
      expect(screen.getByText("Aucun technicien disponible pour ces critères.")).toBeInTheDocument(),
    );
  });

  it("affiche le message d'erreur quand la recherche échoue", async () => {
    api.searchTechnicians.mockRejectedValue(new Error("Erreur API (500)"));

    renderSearch();
    fireEvent.click(screen.getByRole("button", { name: "Rechercher" }));

    await waitFor(() => expect(screen.getByText("Erreur API (500)")).toBeInTheDocument());
  });
});
