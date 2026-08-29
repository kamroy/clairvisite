import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { api } from "../lib/api";
import { createTestQueryClient } from "../../test/utils";
import BookingReport from "./BookingReport";

vi.mock("../lib/api", () => ({
  api: {
    getBookingReport: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

function renderReport() {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter initialEntries={["/bookings/booking-1/report"]}>
        <Routes>
          <Route path="/bookings/:bookingId/report" element={<BookingReport />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function report(overrides = {}) {
  return {
    id: "r1",
    status: "submitted",
    generalConclusion: "Bien globalement sain.",
    sections: [
      { id: "s1", sectionType: "introduction", content: "Contexte général.", status: null, photos: [] },
      { id: "s2", sectionType: "structure", content: "RAS.", status: null, photos: [] },
      { id: "s3", sectionType: "electricity", content: "Tableau récent.", status: "good", photos: [] },
      { id: "s4", sectionType: "plumbing", content: "Fuite détectée.", status: "critical", photos: [] },
      { id: "s5", sectionType: "heating", content: null, status: null, photos: [] },
    ],
    ...overrides,
  };
}

describe("BookingReport — synthèse acheteur (US-REPORT-02)", () => {
  it("affiche la conclusion générale et la synthèse par système", async () => {
    api.getBookingReport.mockResolvedValue(report());
    renderReport();

    expect(await screen.findByText("Bien globalement sain.")).toBeInTheDocument();
    expect(screen.getByText("Bon")).toBeInTheDocument();
    expect(screen.getAllByText("Critique").length).toBeGreaterThan(0);
    expect(screen.getByText("Non évalué")).toBeInTheDocument();
  });

  it("liste les points d'attention prioritaires (statuts non 'good')", async () => {
    api.getBookingReport.mockResolvedValue(report());
    renderReport();

    const attentionSection = (await screen.findByText("Points d'attention prioritaires")).closest("div");
    expect(attentionSection).toHaveTextContent("Plomberie");
    expect(attentionSection).not.toHaveTextContent("Électricité");
  });

  it("échappe le HTML brut dans le contenu des sections (anti-XSS)", async () => {
    api.getBookingReport.mockResolvedValue(
      report({
        sections: [
          { id: "s1", sectionType: "introduction", content: "<img src=x onerror=alert(1)>", status: null, photos: [] },
        ],
      }),
    );
    const { container } = renderReport();

    await screen.findByText("Rapport technique");
    expect(container.querySelector("img[onerror]")).not.toBeInTheDocument();
    expect(container.textContent).toContain("<img src=x onerror=alert(1)>");
  });

  it("affiche un message d'indisponibilité quand le rapport n'est pas encore soumis", async () => {
    api.getBookingReport.mockRejectedValue(new Error("Aucun rapport disponible pour cette réservation pour l'instant."));
    renderReport();

    expect(await screen.findByText("Aucun rapport disponible pour cette réservation pour l'instant.")).toBeInTheDocument();
  });
});
