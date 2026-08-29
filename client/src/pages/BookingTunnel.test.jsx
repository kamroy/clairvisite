import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { api } from "../lib/api";
import { createTestQueryClient } from "../../test/utils";
import BookingTunnel from "./BookingTunnel";

vi.mock("../lib/api", () => ({
  api: {
    getTechnician: vi.fn(),
    createBooking: vi.fn(),
  },
}));

vi.mock("../components/AddressMap", () => ({ default: () => null }));

function renderTunnel(technicianId = "deco-1") {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter initialEntries={[`/technicians/${technicianId}/book`]}>
        <Routes>
          <Route path="/technicians/:id/book" element={<BookingTunnel />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function decoTechnician() {
  return {
    id: "deco-1",
    fullName: "Sophie Laurent",
    category: "decoration",
    availableSlots: [
      { id: "slot-1", startDatetime: "2026-09-10T09:00:00Z", endDatetime: "2026-09-10T10:00:00Z" },
    ],
  };
}

function techniqueTechnician() {
  return {
    id: "tech-1",
    fullName: "Jean Dupont",
    category: "technique",
    availableSlots: [
      { id: "slot-1", startDatetime: "2026-09-10T09:00:00Z", endDatetime: "2026-09-10T10:00:00Z" },
    ],
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("BookingTunnel — étape 1 adaptée à la catégorie du technicien (US-BOOK-03)", () => {
  it("affiche les champs déco (pièces concernées, description) pour une décoratrice", async () => {
    api.getTechnician.mockResolvedValue(decoTechnician());
    renderTunnel("deco-1");

    expect(await screen.findByText("Parlez-nous de votre projet déco")).toBeInTheDocument();
    expect(screen.getByLabelText("Pièces concernées (séparées par une virgule)")).toBeInTheDocument();
    expect(screen.getByLabelText(/Décrivez votre projet/)).toBeInTheDocument();
  });

  it("n'affiche pas les champs déco pour une contre-visite technique", async () => {
    api.getTechnician.mockResolvedValue(techniqueTechnician());
    renderTunnel("tech-1");

    expect(await screen.findByText("Parlez-nous de votre bien")).toBeInTheDocument();
    expect(screen.queryByLabelText("Pièces concernées (séparées par une virgule)")).not.toBeInTheDocument();
  });

  it("envoie les pièces concernées et la description du projet à la création de la réservation", async () => {
    api.getTechnician.mockResolvedValue(decoTechnician());
    api.createBooking.mockResolvedValue({ id: "booking-1" });
    renderTunnel("deco-1");

    await screen.findByText("Parlez-nous de votre projet déco");
    fireEvent.click(screen.getByRole("button", { name: "Maison" }));
    fireEvent.change(screen.getByLabelText("Surface estimée (m²)"), { target: { value: "60" } });
    fireEvent.change(screen.getByLabelText("Adresse du bien"), { target: { value: "10 rue de Rivoli" } });
    fireEvent.change(screen.getByLabelText("Pièces concernées (séparées par une virgule)"), {
      target: { value: "Salon, Cuisine" },
    });
    fireEvent.change(screen.getByLabelText(/Décrivez votre projet/), {
      target: { value: "Style scandinave, budget serré." },
    });

    fireEvent.click(screen.getByRole("button", { name: "Continuer" }));
    fireEvent.click(screen.getByText(/09:00/));
    fireEvent.change(screen.getByLabelText("Votre téléphone"), { target: { value: "0611112222" } });
    fireEvent.click(screen.getByRole("button", { name: "Continuer" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmer la réservation" }));

    await waitFor(() =>
      expect(api.createBooking).toHaveBeenCalledWith(
        expect.objectContaining({
          rooms_concerned: ["Salon", "Cuisine"],
          project_description: "Style scandinave, budget serré.",
        }),
      ),
    );
  });
});
