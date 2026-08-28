import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { queryKeys } from "../lib/queryKeys";
import { PAGE_SIZE } from "../lib/pagination";

export function useSearchTechnicians(params, options = {}) {
  return useInfiniteQuery({
    queryKey: queryKeys.technicians.search(params),
    queryFn: ({ pageParam }) => api.searchTechnicians({ ...params, page: pageParam, pageSize: PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    ...options,
  });
}

export function useTechnician(id) {
  return useQuery({
    queryKey: queryKeys.technicians.detail(id),
    queryFn: () => api.getTechnician(id),
    enabled: Boolean(id),
  });
}

export function useSimilarTechnicians(id) {
  return useQuery({
    queryKey: queryKeys.technicians.similar(id),
    queryFn: () => api.getSimilarTechnicians(id),
    enabled: Boolean(id),
  });
}

export function useTechnicianPricingItems(id) {
  return useQuery({
    queryKey: queryKeys.technicians.pricingItems(id),
    queryFn: () => api.technicianPricingItems(id),
    enabled: Boolean(id),
  });
}

export function useTechnicianPortfolio(id) {
  return useQuery({
    queryKey: queryKeys.technicians.portfolio(id),
    queryFn: () => api.technicianPortfolio(id),
    enabled: Boolean(id),
  });
}

export function useAddTechnicianPricingItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ label, price }) => api.addTechnicianPricingItem(label, price),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["technicians", "pricingItems"] }),
  });
}

export function useRemoveTechnicianPricingItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (itemId) => api.removeTechnicianPricingItem(itemId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["technicians", "pricingItems"] }),
  });
}

// Même logique en 3 étapes que useUploadTechnicianDocument (upload direct sur le
// stockage objet, hors de notre API).
export function useUploadTechnicianPortfolioItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, caption }) => {
      const { uploadUrl, key } = await api.requestTechnicianPortfolioUploadUrl(file.name, file.type);
      const uploadRes = await fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      if (!uploadRes.ok) throw new Error("Échec du dépôt du fichier");
      return api.attachTechnicianPortfolioItem(key, caption);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["technicians", "portfolio"] }),
  });
}

export function useRemoveTechnicianPortfolioItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (itemId) => api.removeTechnicianPortfolioItem(itemId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["technicians", "portfolio"] }),
  });
}

export function useMyTechnicianProfile() {
  return useQuery({
    queryKey: queryKeys.technicians.myProfile,
    queryFn: () => api.getMyTechnicianProfile(),
  });
}

export function useUpdateMyTechnicianProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.updateMyProfile(data),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.technicians.myProfile, updated);
      queryClient.invalidateQueries({ queryKey: queryKeys.technicians.all });
    },
  });
}

export function useMyTechnicianDocuments() {
  return useQuery({
    queryKey: queryKeys.technicians.myDocuments,
    queryFn: () => api.myTechnicianDocuments(),
  });
}

// Dépose une pièce justificative en 3 étapes : URL pré-signée -> upload direct vers
// le stockage objet (pas via notre API, donc pas de credentials/CSRF) -> on
// enregistre la référence côté serveur une fois l'upload confirmé.
export function useUploadTechnicianDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file) => {
      const { uploadUrl, key } = await api.requestTechnicianDocumentUploadUrl(file.name, file.type);
      const uploadRes = await fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      if (!uploadRes.ok) throw new Error("Échec du dépôt du fichier");
      return api.attachTechnicianDocument(key, file.name);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.technicians.myDocuments }),
  });
}
