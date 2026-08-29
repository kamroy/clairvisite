import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { api } from "../lib/api";
import { createTestQueryClient, wrapperWithClient } from "../../test/utils";
import {
  useBookingReport,
  useUpdateReportConclusion,
  useUpdateReportSection,
  useSubmitReport,
  useUploadReportPhoto,
  useRemoveReportPhoto,
} from "./useReports";

vi.mock("../lib/api", () => ({
  api: {
    getBookingReport: vi.fn(),
    updateReportConclusion: vi.fn(),
    updateReportSection: vi.fn(),
    submitReport: vi.fn(),
    requestReportPhotoUploadUrl: vi.fn(),
    attachReportPhoto: vi.fn(),
    removeReportPhoto: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  global.fetch = vi.fn();
});

describe("useBookingReport", () => {
  it("charge le rapport d'une réservation donnée", async () => {
    api.getBookingReport.mockResolvedValue({ id: "r1", status: "draft" });
    const { result } = renderHook(() => useBookingReport("booking-1"), { wrapper: wrapperWithClient() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.getBookingReport).toHaveBeenCalledWith("booking-1");
    expect(result.current.data).toEqual({ id: "r1", status: "draft" });
  });

  it("ne fetch rien tant qu'aucun bookingId n'est fourni", () => {
    renderHook(() => useBookingReport(undefined), { wrapper: wrapperWithClient() });
    expect(api.getBookingReport).not.toHaveBeenCalled();
  });
});

describe("useUpdateReportConclusion", () => {
  it("transmet la conclusion à l'API et invalide le cache du rapport", async () => {
    api.updateReportConclusion.mockResolvedValue({ id: "r1" });
    const client = createTestQueryClient();
    const invalidateSpy = vi.spyOn(client, "invalidateQueries");
    const { result } = renderHook(() => useUpdateReportConclusion("booking-1"), { wrapper: wrapperWithClient(client) });

    await act(async () => {
      await result.current.mutateAsync("Bien globalement sain.");
    });

    expect(api.updateReportConclusion).toHaveBeenCalledWith("booking-1", "Bien globalement sain.");
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["reports", "booking-1"] });
  });
});

describe("useUpdateReportSection", () => {
  it("transmet le contenu et le statut de la section à l'API", async () => {
    api.updateReportSection.mockResolvedValue({ id: "r1" });
    const { result } = renderHook(() => useUpdateReportSection("booking-1"), { wrapper: wrapperWithClient() });

    await act(async () => {
      await result.current.mutateAsync({ sectionType: "electricity", content: "RAS", status: "good" });
    });

    expect(api.updateReportSection).toHaveBeenCalledWith("booking-1", "electricity", { content: "RAS", status: "good" });
  });
});

describe("useSubmitReport", () => {
  it("soumet le rapport de la réservation", async () => {
    api.submitReport.mockResolvedValue({ id: "r1", status: "submitted" });
    const { result } = renderHook(() => useSubmitReport("booking-1"), { wrapper: wrapperWithClient() });

    await act(async () => {
      await result.current.mutateAsync();
    });

    expect(api.submitReport).toHaveBeenCalledWith("booking-1");
  });
});

describe("useUploadReportPhoto", () => {
  it("enchaîne URL pré-signée, upload direct puis rattachement de la photo", async () => {
    api.requestReportPhotoUploadUrl.mockResolvedValue({ uploadUrl: "https://storage.test/upload", key: "reports/booking-1/structure/x.jpg" });
    global.fetch.mockResolvedValue({ ok: true });
    api.attachReportPhoto.mockResolvedValue({ id: "photo-1" });

    const file = new File(["data"], "fissure.jpg", { type: "image/jpeg" });
    const { result } = renderHook(() => useUploadReportPhoto("booking-1"), { wrapper: wrapperWithClient() });

    await act(async () => {
      await result.current.mutateAsync({ sectionType: "structure", file, caption: "Fissure" });
    });

    expect(api.requestReportPhotoUploadUrl).toHaveBeenCalledWith("booking-1", "structure", "fissure.jpg", "image/jpeg");
    expect(global.fetch).toHaveBeenCalledWith("https://storage.test/upload", expect.objectContaining({ method: "PUT" }));
    expect(api.attachReportPhoto).toHaveBeenCalledWith(
      "booking-1",
      "structure",
      "reports/booking-1/structure/x.jpg",
      "Fissure",
      null,
    );
  });

  it("échoue si le dépôt du fichier échoue, sans appeler attachReportPhoto", async () => {
    api.requestReportPhotoUploadUrl.mockResolvedValue({ uploadUrl: "https://storage.test/upload", key: "x" });
    global.fetch.mockResolvedValue({ ok: false });

    const file = new File(["data"], "fissure.jpg", { type: "image/jpeg" });
    const { result } = renderHook(() => useUploadReportPhoto("booking-1"), { wrapper: wrapperWithClient() });

    await expect(
      act(async () => {
        await result.current.mutateAsync({ sectionType: "structure", file });
      }),
    ).rejects.toThrow("Échec du dépôt de la photo");
    expect(api.attachReportPhoto).not.toHaveBeenCalled();
  });
});

describe("useRemoveReportPhoto", () => {
  it("retire une photo du rapport", async () => {
    api.removeReportPhoto.mockResolvedValue(null);
    const { result } = renderHook(() => useRemoveReportPhoto("booking-1"), { wrapper: wrapperWithClient() });

    await act(async () => {
      await result.current.mutateAsync("photo-1");
    });

    expect(api.removeReportPhoto).toHaveBeenCalledWith("booking-1", "photo-1");
  });
});
