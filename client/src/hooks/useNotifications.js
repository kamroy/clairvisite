import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { queryKeys } from "../lib/queryKeys";
import { PAGE_SIZE } from "../lib/pagination";

// Pas de WebSocket ici non plus (même choix que la messagerie, voir useMessaging.js) :
// le badge de non-lues et la liste se rafraîchissent par polling.
const NOTIFICATIONS_POLL_MS = 15000;

export function useMyNotifications(options = {}) {
  return useQuery({
    queryKey: queryKeys.notifications.mine({ page: 1, pageSize: PAGE_SIZE }),
    queryFn: () => api.notifications({ page: 1, pageSize: PAGE_SIZE }),
    refetchInterval: NOTIFICATIONS_POLL_MS,
    ...options,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.markNotificationRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications", "mine"] }),
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.markAllNotificationsRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications", "mine"] }),
  });
}
