import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { api } from "../lib/api";
import { createTestQueryClient } from "../../test/utils";
import TechnicianReportEditor from "./TechnicianReportEditor";

vi.mock("../lib/api", () => ({
  api: {
    technicianBookings: vi.fn(),
    getBookingReport: vi.fn(),
    updateReportConclusion: vi.fn(),
    updateReportSection: vi.fn(),
    submitReport: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  api.technicianBookings.mockResolvedValue({ items: [], page: 1, pageSize: 12, hasMore: false });
});

function renderEditor(state) {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter
        initialEntries={[{ pathname: "/technician/bookings/booking-1/report", state }]}
      >
        <Routes>
          <Route path="/technician/bookings/:bookingId/report" element={<TechnicianReportEditor />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function draftReport() {
  return {
    id: "r1",
    status: "draft",
    generalConclusion: "",
    sections: [
      { id: "s1", sectionType: "introduction", content: "", status: null, photos: [] },
      { id: "s2", sectionType: "structure", content: "", status: null, photos: [] },
      { id: "s3", sectionType: "electricity", content: "", status: null, photos: [] },
      { id: "s4", sectionType: "plumbing", content: "", status: null, photos: [] },
      { id: "s5", sectionType: "heating", content: "", status: null, photos: [] },
    ],
  };
}

describe("TechnicianReportEditor (US-REPORT-01)", () => {
  it("affiche les 5 sections prédéfinies et le récapitulatif transmis par navigation", async () => {
    api.getBookingReport.mockResolvedValue(draftReport());
    renderEditor({ booking: { buyerFullName: "Ada Buyer", propertyAddress: "1 rue de Paris", slotStart: "2026-09-01T10:00:00Z" } });

    expect(await screen.findByText("Introduction & Contexte")).toBeInTheDocument();
    expect(screen.getByText("Analyse Structurelle")).toBeInTheDocument();
    expect(screen.getByText("Ada Buyer")).toBeInTheDocument();
    expect(screen.getByText("1 rue de Paris")).toBeInTheDocument();
  });

  it("enregistre le brouillon en appelant la conclusion et les 5 sections", async () => {
    api.getBookingReport.mockResolvedValue(draftReport());
    api.updateReportConclusion.mockResolvedValue({});
    api.updateReportSection.mockResolvedValue({});
    renderEditor();

    await screen.findByText("Introduction & Contexte");
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer le brouillon" }));

    await waitFor(() => expect(api.updateReportConclusion).toHaveBeenCalledWith("booking-1", ""));
    expect(api.updateReportSection).toHaveBeenCalledTimes(5);
    expect(api.updateReportSection).toHaveBeenCalledWith("booking-1", "electricity", { content: "", status: null });
  });

  it("le bouton Gras entoure la sélection de **", async () => {
    api.getBookingReport.mockResolvedValue(draftReport());
    renderEditor();

    await screen.findByText("Introduction & Contexte");
    const textareas = document.querySelectorAll("textarea");
    const introTextarea = textareas[0];
    fireEvent.change(introTextarea, { target: { value: "attention" } });
    introTextarea.setSelectionRange(0, "attention".length);
    fireEvent.click(screen.getAllByRole("button", { name: "G" })[0]);

    expect(introTextarea.value).toBe("**attention**");
  });

  it("soumet le rapport après avoir enregistré le brouillon", async () => {
    api.getBookingReport.mockResolvedValue(draftReport());
    api.updateReportConclusion.mockResolvedValue({});
    api.updateReportSection.mockResolvedValue({});
    api.submitReport.mockResolvedValue({ status: "submitted" });
    renderEditor();

    await screen.findByText("Introduction & Contexte");
    fireEvent.click(screen.getByRole("button", { name: "Soumettre le rapport" }));

    await waitFor(() => expect(api.submitReport).toHaveBeenCalledWith("booking-1"));
  });

  it("masque les actions d'édition une fois le rapport soumis", async () => {
    api.getBookingReport.mockResolvedValue({ ...draftReport(), status: "submitted" });
    renderEditor();

    await screen.findByText("Rapport soumis");
    expect(screen.queryByRole("button", { name: "Enregistrer le brouillon" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Soumettre le rapport" })).not.toBeInTheDocument();
  });
});
