import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { api } from "../lib/api";
import { createTestQueryClient } from "../../test/utils";
import TechnicianDashboard from "./TechnicianDashboard";

vi.mock("../lib/api", () => ({
  api: {
    me: vi.fn(),
    getMyTechnicianProfile: vi.fn(),
    technicianBookings: vi.fn(),
  },
}));

function renderDashboard(initialEntry = "/technician/dashboard") {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/technician/*" element={<TechnicianDashboard />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function bookingsPage(items) {
  return { items, page: 1, pageSize: 12, hasMore: false };
}

beforeEach(() => {
  vi.clearAllMocks();
  api.me.mockResolvedValue({ fullName: "Jean Dupont", role: "technicien" });
});

describe("TechnicianDashboard — tableau de bord (US-DASH-01)", () => {
  it("affiche le message de bienvenue et les KPI calculés à partir des réservations", async () => {
    api.getMyTechnicianProfile.mockResolvedValue({ id: "t1", hourlyRate: 100 });
    api.technicianBookings.mockResolvedValue(
      bookingsPage([
        {
          id: "b1",
          buyerFullName: "Alice Martin",
          propertyAddress: "1 rue A, Paris",
          propertyType: "apartment",
          slotStart: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: "b2",
          buyerFullName: "Bob Dupont",
          propertyAddress: "2 rue B, Paris",
          propertyType: "house",
          slotStart: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ]),
    );

    renderDashboard();

    expect(await screen.findByText("Bonjour, Jean.")).toBeInTheDocument();
    expect(screen.getByText("Projets actifs")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument(); // 2 projets actifs (les deux sont futurs)
    expect(screen.getByText("1")).toBeInTheDocument(); // 1 visite sous 7 jours
    expect(screen.getByText("200 €")).toBeInTheDocument(); // honoraires estimés : 2 x 100€
    expect(screen.getByText("Alice Martin")).toBeInTheDocument();
    expect(screen.getByText("Bob Dupont")).toBeInTheDocument();
  });

  it("invite à renseigner un tarif horaire quand il n'est pas défini, sans planter le calcul", async () => {
    api.getMyTechnicianProfile.mockResolvedValue({ id: "t1", hourlyRate: null });
    api.technicianBookings.mockResolvedValue(bookingsPage([]));

    renderDashboard();

    expect(await screen.findByText("0 €")).toBeInTheDocument();
    expect(
      screen.getByText("Renseignez votre tarif horaire dans l'onglet Profil pour affiner cette estimation."),
    ).toBeInTheDocument();
    expect(screen.getByText("Aucun dossier en cours.")).toBeInTheDocument();
  });
});
