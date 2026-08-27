import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { api } from "../lib/api";
import { queryKeys } from "../lib/queryKeys";
import { createTestQueryClient, wrapperWithClient } from "../../test/utils";
import { useCreateAvailability, useDeleteAvailability } from "./useAvailabilities";

vi.mock("../lib/api", () => ({
  api: {
    createAvailability: vi.fn(),
    deleteAvailability: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useCreateAvailability", () => {
  it("invalide availabilities.mine et technicians.all après création", async () => {
    api.createAvailability.mockResolvedValue({ id: "a1" });
    const client = createTestQueryClient();
    const invalidateSpy = vi.spyOn(client, "invalidateQueries");
    const { result } = renderHook(() => useCreateAvailability(), { wrapper: wrapperWithClient(client) });

    await act(async () => {
      await result.current.mutateAsync({ startDatetime: "2026-09-01T09:00:00Z", endDatetime: "2026-09-01T10:00:00Z" });
    });

    await waitFor(() => expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.availabilities.mine }));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.technicians.all });
  });
});

describe("useDeleteAvailability", () => {
  it("invalide availabilities.mine et technicians.all après suppression", async () => {
    api.deleteAvailability.mockResolvedValue(null);
    const client = createTestQueryClient();
    const invalidateSpy = vi.spyOn(client, "invalidateQueries");
    const { result } = renderHook(() => useDeleteAvailability(), { wrapper: wrapperWithClient(client) });

    await act(async () => {
      await result.current.mutateAsync("a1");
    });

    expect(api.deleteAvailability).toHaveBeenCalledWith("a1");
    await waitFor(() => expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.availabilities.mine }));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.technicians.all });
  });
});
