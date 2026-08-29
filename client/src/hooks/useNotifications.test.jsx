import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { api } from "../lib/api";
import { wrapperWithClient } from "../../test/utils";
import { useMyNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from "./useNotifications";

vi.mock("../lib/api", () => ({
  api: {
    notifications: vi.fn(),
    markNotificationRead: vi.fn(),
    markAllNotificationsRead: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useMyNotifications", () => {
  it("charge les notifications de l'utilisateur courant", async () => {
    api.notifications.mockResolvedValue({ items: [], page: 1, pageSize: 12, hasMore: false, unreadCount: 0 });
    const { result } = renderHook(() => useMyNotifications(), { wrapper: wrapperWithClient() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.notifications).toHaveBeenCalledWith({ page: 1, pageSize: 12 });
  });

  it("n'appelle pas l'API quand enabled est faux", () => {
    renderHook(() => useMyNotifications({ enabled: false }), { wrapper: wrapperWithClient() });
    expect(api.notifications).not.toHaveBeenCalled();
  });
});

describe("useMarkNotificationRead", () => {
  it("marque une notification comme lue", async () => {
    api.markNotificationRead.mockResolvedValue(undefined);
    const { result } = renderHook(() => useMarkNotificationRead(), { wrapper: wrapperWithClient() });

    await act(async () => {
      await result.current.mutateAsync("notif-1");
    });

    expect(api.markNotificationRead).toHaveBeenCalledWith("notif-1");
  });
});

describe("useMarkAllNotificationsRead", () => {
  it("marque toutes les notifications comme lues", async () => {
    api.markAllNotificationsRead.mockResolvedValue(undefined);
    const { result } = renderHook(() => useMarkAllNotificationsRead(), { wrapper: wrapperWithClient() });

    await act(async () => {
      await result.current.mutateAsync();
    });

    expect(api.markAllNotificationsRead).toHaveBeenCalled();
  });
});
