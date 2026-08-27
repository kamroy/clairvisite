import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { api } from "../lib/api";
import { queryKeys } from "../lib/queryKeys";
import { PAGE_SIZE } from "../lib/pagination";
import { createTestQueryClient, wrapperWithClient } from "../../test/utils";
import { useAdminTechnicians, useSetTechnicianStatus } from "./useAdmin";

vi.mock("../lib/api", () => ({
  api: {
    adminTechnicians: vi.fn(),
    adminSetTechnicianStatus: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useAdminTechnicians", () => {
  it("demande la page 1 avec le pageSize par défaut", async () => {
    api.adminTechnicians.mockResolvedValue({ items: [], page: 1, pageSize: PAGE_SIZE, hasMore: false });
    const { result } = renderHook(() => useAdminTechnicians(), { wrapper: wrapperWithClient() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.adminTechnicians).toHaveBeenCalledWith({ page: 1, pageSize: PAGE_SIZE });
  });

  it("passe en erreur si l'API échoue (ex. 403 pour un rôle non admin)", async () => {
    api.adminTechnicians.mockRejectedValue(new Error("Erreur API (403)"));
    const { result } = renderHook(() => useAdminTechnicians(), { wrapper: wrapperWithClient() });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error.message).toBe("Erreur API (403)");
  });
});

describe("useSetTechnicianStatus", () => {
  it("transmet id et status à l'API et invalide les listes admin + technicians", async () => {
    api.adminSetTechnicianStatus.mockResolvedValue({ id: "t1", status: "approved" });
    const client = createTestQueryClient();
    const invalidateSpy = vi.spyOn(client, "invalidateQueries");
    const { result } = renderHook(() => useSetTechnicianStatus(), { wrapper: wrapperWithClient(client) });

    await act(async () => {
      await result.current.mutateAsync({ id: "t1", status: "approved" });
    });

    expect(api.adminSetTechnicianStatus).toHaveBeenCalledWith("t1", "approved");
    await waitFor(() => expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.admin.technicians }));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.technicians.all });
  });
});
