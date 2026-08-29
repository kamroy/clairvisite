import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { api } from "../lib/api";
import { createTestQueryClient } from "../../test/utils";
import MyProjects from "./MyProjects";

vi.mock("../lib/api", () => ({
  api: {
    myBookings: vi.fn(),
  },
}));

function renderMyProjects() {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter>
        <MyProjects />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function bookingsPage(items) {
  return { items, page: 1, pageSize: 12, hasMore: false };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("MyProjects — tableau de bord transverse des réservations", () => {
  it("affiche 'Consultation déco' pour une réservation avec une décoratrice (US-BOOK-03)", async () => {
    api.myBookings.mockResolvedValue(
      bookingsPage([
        {
          id: "b1",
          status: "confirmed",
          slotStart: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          propertyAddress: "10 rue de Rivoli, Paris",
          technicianFullName: "Sophie Laurent",
          technicianEmail: "sophie@example.com",
          technicianCategory: "decoration",
        },
      ]),
    );

    renderMyProjects();

    expect(await screen.findByText("Consultation déco")).toBeInTheDocument();
    expect(screen.queryByText("Contre-visite technique")).not.toBeInTheDocument();
  });

  it("affiche une carte projet en cours avec le bandeau d'alerte et les CTA", async () => {
    api.myBookings.mockResolvedValue(
      bookingsPage([
        {
          id: "b1",
          status: "confirmed",
          slotStart: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          propertyAddress: "10 rue de Rivoli, Paris",
          technicianFullName: "Jean Dupont",
          technicianEmail: "jean@example.com",
        },
      ]),
    );

    renderMyProjects();

    expect(await screen.findByText("Jean Dupont")).toBeInTheDocument();
    expect(screen.getByText("1 projet en cours")).toBeInTheDocument();
    expect(screen.getByText("RDV confirmé")).toBeInTheDocument();
    expect(screen.getByText("Voir les détails")).toBeInTheDocument();
    expect(screen.getByText("Contacter l'expert").closest("a")).toHaveAttribute("href", "/messages/b1");
  });

  it("classe les réservations passées et annulées dans l'historique plutôt qu'en cours", async () => {
    api.myBookings.mockResolvedValue(
      bookingsPage([
        {
          id: "b1",
          status: "confirmed",
          slotStart: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          propertyAddress: "1 rue A",
          technicianFullName: "Ancien RDV",
          technicianEmail: "a@example.com",
        },
        {
          id: "b2",
          status: "cancelled",
          slotStart: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          propertyAddress: "2 rue B",
          technicianFullName: "RDV Annulé",
          technicianEmail: "b@example.com",
        },
      ]),
    );

    renderMyProjects();

    expect(await screen.findByText("Ancien RDV")).toBeInTheDocument();
    expect(screen.getByText("RDV Annulé")).toBeInTheDocument();
    expect(screen.getByText("Terminée")).toBeInTheDocument();
    expect(screen.getByText("Annulée")).toBeInTheDocument();
    expect(screen.queryByText(/^\d+ projets? en cours$/)).not.toBeInTheDocument();
    expect(
      screen.getByText("Aucun projet en cours. Lancez une recherche pour réserver votre première prestation."),
    ).toBeInTheDocument();
  });

  it("propose toujours le CTA nouveau projet et le lien vers l'historique complet", async () => {
    api.myBookings.mockResolvedValue(bookingsPage([]));

    renderMyProjects();

    await screen.findByText("Aucun historique pour le moment.");
    expect(screen.getByText("+ Nouveau projet").closest("a")).toHaveAttribute("href", "/search");
    expect(screen.getByText("Voir tout l'historique")).toHaveAttribute("href", "/bookings");
  });
});
