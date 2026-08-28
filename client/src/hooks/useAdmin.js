import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { queryKeys } from "../lib/queryKeys";
import { PAGE_SIZE } from "../lib/pagination";

export function useAdminTechnicians(params = {}) {
  return useInfiniteQuery({
    queryKey: queryKeys.admin.technicians(params),
    queryFn: ({ pageParam }) => api.adminTechnicians({ ...params, page: pageParam, pageSize: PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
  });
}

export function useSetTechnicianStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) => api.adminSetTechnicianStatus(id, status),
    onSuccess: () => {
      // Préfixe seul (sans les filtres) : invalide toutes les combinaisons de filtres en cache.
      queryClient.invalidateQueries({ queryKey: ["admin", "technicians"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.technicians.all });
    },
  });
}
