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
