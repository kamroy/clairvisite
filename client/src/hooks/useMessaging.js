import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { queryKeys } from "../lib/queryKeys";
import { PAGE_SIZE } from "../lib/pagination";

// Pas de WebSocket (voir server/src/modules/messaging) : on rafraîchit à intervalle
// court pendant que la messagerie est affichée, seul compromis raisonnable sans
// introduire une dépendance socket.io côté client.
const MESSAGES_POLL_MS = 4000;
const CONVERSATIONS_POLL_MS = 10000;

export function useMyConversations() {
  return useQuery({
    queryKey: queryKeys.conversations.mine({ page: 1, pageSize: PAGE_SIZE }),
    queryFn: () => api.myConversations({ page: 1, pageSize: PAGE_SIZE }),
    refetchInterval: CONVERSATIONS_POLL_MS,
  });
}

export function useConversationMessages(bookingId) {
  return useQuery({
    queryKey: queryKeys.conversations.forBooking(bookingId),
    queryFn: () => api.conversationMessages(bookingId),
    enabled: Boolean(bookingId),
    refetchInterval: MESSAGES_POLL_MS,
  });
}

export function useSendMessage(bookingId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.sendMessage(bookingId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations.forBooking(bookingId) });
      queryClient.invalidateQueries({ queryKey: ["conversations", "mine"] });
    },
  });
}

// Même logique en 3 étapes que useUploadReportPhoto : URL pré-signée -> upload
// direct sur le stockage objet -> envoi du message avec la référence au fichier.
export function useSendAttachment(bookingId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file) => {
      const { uploadUrl, key } = await api.requestMessageAttachmentUploadUrl(bookingId, file.name, file.type);
      const uploadRes = await fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      if (!uploadRes.ok) throw new Error("Échec du dépôt de la pièce jointe");
      return api.sendMessage(bookingId, { attachment_key: key, attachment_file_name: file.name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations.forBooking(bookingId) });
      queryClient.invalidateQueries({ queryKey: ["conversations", "mine"] });
    },
  });
}
