import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { queryKeys } from "../lib/queryKeys";
import { PAGE_SIZE } from "../lib/pagination";

export function useAdminTechnicians() {
  return useInfiniteQuery({
    queryKey: queryKeys.admin.technicians,
    queryFn: ({ pageParam }) => api.adminTechnicians({ page: pageParam, pageSize: PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
  });
}

export function useSetTechnicianStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) => api.adminSetTechnicianStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.technicians });
      queryClient.invalidateQueries({ queryKey: queryKeys.technicians.all });
    },
  });
}
