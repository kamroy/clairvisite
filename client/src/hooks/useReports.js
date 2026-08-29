import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { queryKeys } from "../lib/queryKeys";

export function useBookingReport(bookingId, options = {}) {
  return useQuery({
    queryKey: queryKeys.reports.forBooking(bookingId),
    queryFn: () => api.getBookingReport(bookingId),
    enabled: Boolean(bookingId),
    retry: false,
    ...options,
  });
}

function invalidateReport(queryClient, bookingId) {
  queryClient.invalidateQueries({ queryKey: queryKeys.reports.forBooking(bookingId) });
}

export function useUpdateReportConclusion(bookingId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (generalConclusion) => api.updateReportConclusion(bookingId, generalConclusion),
    onSuccess: () => invalidateReport(queryClient, bookingId),
  });
}

export function useUpdateReportSection(bookingId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sectionType, ...data }) => api.updateReportSection(bookingId, sectionType, data),
    onSuccess: () => invalidateReport(queryClient, bookingId),
  });
}

export function useSubmitReport(bookingId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.submitReport(bookingId),
    onSuccess: () => invalidateReport(queryClient, bookingId),
  });
}

// Même logique en 3 étapes que useUploadTechnicianPortfolioItem : URL pré-signée ->
// upload direct sur le stockage objet -> on enregistre la référence côté serveur.
export function useUploadReportPhoto(bookingId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ sectionType, file, caption, role }) => {
      const { uploadUrl, key } = await api.requestReportPhotoUploadUrl(bookingId, sectionType, file.name, file.type);
      const uploadRes = await fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      if (!uploadRes.ok) throw new Error("Échec du dépôt de la photo");
      return api.attachReportPhoto(bookingId, sectionType, key, caption ?? null, role ?? null);
    },
    onSuccess: () => invalidateReport(queryClient, bookingId),
  });
}

export function useRemoveReportPhoto(bookingId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (photoId) => api.removeReportPhoto(bookingId, photoId),
    onSuccess: () => invalidateReport(queryClient, bookingId),
  });
}
