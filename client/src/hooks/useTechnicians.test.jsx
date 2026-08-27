import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { api } from "../lib/api";
import { queryKeys } from "../lib/queryKeys";
import { PAGE_SIZE } from "../lib/pagination";
import { createTestQueryClient, wrapperWithClient } from "../../test/utils";
import {
  useSearchTechnicians,
  useTechnician,
  useMyTechnicianProfile,
  useUpdateMyTechnicianProfile,
} from "./useTechnicians";

vi.mock("../lib/api", () => ({
  api: {
    searchTechnicians: vi.fn(),
    getTechnician: vi.fn(),
    getMyTechnicianProfile: vi.fn(),
    updateMyProfile: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useSearchTechnicians", () => {
  it("charge la première page avec page=1 et le pageSize par défaut", async () => {
    api.searchTechnicians.mockResolvedValue({ items: [{ id: "t1" }], page: 1, pageSize: PAGE_SIZE, hasMore: false });
    const { result } = renderHook(() => useSearchTechnicians({ region: "idf" }, { enabled: true }), {
      wrapper: wrapperWithClient(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.searchTechnicians).toHaveBeenCalledWith({ region: "idf", page: 1, pageSize: PAGE_SIZE });
    expect(result.current.hasNextPage).toBe(false);
  });

  it("charge la page suivante via fetchNextPage quand hasMore est true", async () => {
    api.searchTechnicians
      .mockResolvedValueOnce({ items: [{ id: "t1" }], page: 1, pageSize: PAGE_SIZE, hasMore: true })
      .mockResolvedValueOnce({ items: [{ id: "t2" }], page: 2, pageSize: PAGE_SIZE, hasMore: false });

    const { result } = renderHook(() => useSearchTechnicians({}, { enabled: true }), {
      wrapper: wrapperWithClient(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.hasNextPage).toBe(true);

    await act(async () => {
      await result.current.fetchNextPage();
    });
    await waitFor(() => expect(result.current.data.pages).toHaveLength(2));

    expect(api.searchTechnicians).toHaveBeenLastCalledWith({ page: 2, pageSize: PAGE_SIZE });
    expect(result.current.hasNextPage).toBe(false);
  });

  it("ne fetch rien tant que enabled est false", async () => {
    renderHook(() => useSearchTechnicians({}, { enabled: false }), { wrapper: wrapperWithClient() });
    expect(api.searchTechnicians).not.toHaveBeenCalled();
  });

  it("passe en erreur si l'API échoue", async () => {
    api.searchTechnicians.mockRejectedValue(new Error("Erreur API (500)"));
    const { result } = renderHook(() => useSearchTechnicians({}, { enabled: true }), {
      wrapper: wrapperWithClient(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error.message).toBe("Erreur API (500)");
  });
});

describe("useTechnician", () => {
  it("ne fetch rien sans id", () => {
    renderHook(() => useTechnician(undefined), { wrapper: wrapperWithClient() });
    expect(api.getTechnician).not.toHaveBeenCalled();
  });

  it("fetch la fiche technicien quand un id est fourni", async () => {
    api.getTechnician.mockResolvedValue({ id: "t1", fullName: "Alice" });
    const { result } = renderHook(() => useTechnician("t1"), { wrapper: wrapperWithClient() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.getTechnician).toHaveBeenCalledWith("t1");
  });
});

describe("useMyTechnicianProfile", () => {
  it("renvoie null quand le technicien n'a pas encore créé de profil", async () => {
    api.getMyTechnicianProfile.mockResolvedValue(null);
    const { result } = renderHook(() => useMyTechnicianProfile(), { wrapper: wrapperWithClient() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
  });

  it("renvoie le profil existant", async () => {
    api.getMyTechnicianProfile.mockResolvedValue({ status: "approved", phone: "0600000000" });
    const { result } = renderHook(() => useMyTechnicianProfile(), { wrapper: wrapperWithClient() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ status: "approved", phone: "0600000000" });
  });
});

describe("useUpdateMyTechnicianProfile", () => {
  it("met à jour le cache myProfile et invalide les recherches publiques", async () => {
    api.updateMyProfile.mockResolvedValue({ status: "pending", phone: "0611111111" });
    const client = createTestQueryClient();
    const invalidateSpy = vi.spyOn(client, "invalidateQueries");
    const { result } = renderHook(() => useUpdateMyTechnicianProfile(), { wrapper: wrapperWithClient(client) });

    await act(async () => {
      await result.current.mutateAsync({ phone: "0611111111" });
    });

    expect(client.getQueryData(queryKeys.technicians.myProfile)).toEqual({
      status: "pending",
      phone: "0611111111",
    });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.technicians.all });
  });
});
