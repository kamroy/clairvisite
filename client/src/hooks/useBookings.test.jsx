import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { api } from "../lib/api";
import { queryKeys } from "../lib/queryKeys";
import { PAGE_SIZE } from "../lib/pagination";
import { createTestQueryClient, wrapperWithClient } from "../../test/utils";
import { useMyBookings, useTechnicianBookings, useCreateBooking, useCancelBooking } from "./useBookings";

vi.mock("../lib/api", () => ({
  api: {
    myBookings: vi.fn(),
    technicianBookings: vi.fn(),
    createBooking: vi.fn(),
    cancelBooking: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useMyBookings", () => {
  it("demande la page 1 avec le pageSize par défaut", async () => {
    api.myBookings.mockResolvedValue({ items: [], page: 1, pageSize: PAGE_SIZE, hasMore: false });
    const { result } = renderHook(() => useMyBookings(), { wrapper: wrapperWithClient() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.myBookings).toHaveBeenCalledWith({ page: 1, pageSize: PAGE_SIZE });
  });

  it("passe en erreur si l'API échoue", async () => {
    api.myBookings.mockRejectedValue(new Error("Erreur API (500)"));
    const { result } = renderHook(() => useMyBookings(), { wrapper: wrapperWithClient() });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useTechnicianBookings", () => {
  it("demande la page 1 avec le pageSize par défaut", async () => {
    api.technicianBookings.mockResolvedValue({ items: [], page: 1, pageSize: PAGE_SIZE, hasMore: false });
    const { result } = renderHook(() => useTechnicianBookings(), { wrapper: wrapperWithClient() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.technicianBookings).toHaveBeenCalledWith({ page: 1, pageSize: PAGE_SIZE });
  });

  it("charge la page suivante quand hasMore est true", async () => {
    api.technicianBookings
      .mockResolvedValueOnce({ items: [{ id: "b1" }], page: 1, pageSize: PAGE_SIZE, hasMore: true })
      .mockResolvedValueOnce({ items: [{ id: "b2" }], page: 2, pageSize: PAGE_SIZE, hasMore: false });

    const { result } = renderHook(() => useTechnicianBookings(), { wrapper: wrapperWithClient() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.hasNextPage).toBe(true);

    await act(async () => {
      await result.current.fetchNextPage();
    });
    await waitFor(() => expect(result.current.data.pages).toHaveLength(2));
    expect(api.technicianBookings).toHaveBeenLastCalledWith({ page: 2, pageSize: PAGE_SIZE });
  });
});

describe("useCreateBooking", () => {
  it("invalide bookings.mine et technicians.all après une réservation réussie", async () => {
    api.createBooking.mockResolvedValue({ id: "b1" });
    const client = createTestQueryClient();
    const invalidateSpy = vi.spyOn(client, "invalidateQueries");
    const { result } = renderHook(() => useCreateBooking(), { wrapper: wrapperWithClient(client) });

    await act(async () => {
      await result.current.mutateAsync({ availability_id: "slot-1" });
    });

    await waitFor(() => expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.bookings.mine }));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.technicians.all });
  });
});

describe("useCancelBooking", () => {
  it("invalide bookings.mine et technicians.all après annulation", async () => {
    api.cancelBooking.mockResolvedValue(null);
    const client = createTestQueryClient();
    const invalidateSpy = vi.spyOn(client, "invalidateQueries");
    const { result } = renderHook(() => useCancelBooking(), { wrapper: wrapperWithClient(client) });

    await act(async () => {
      await result.current.mutateAsync("b1");
    });

    expect(api.cancelBooking).toHaveBeenCalledWith("b1");
    await waitFor(() => expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.bookings.mine }));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.technicians.all });
  });
});
