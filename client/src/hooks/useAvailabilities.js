import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { queryKeys } from "../lib/queryKeys";

export function useMyAvailabilities() {
  return useQuery({ queryKey: queryKeys.availabilities.mine, queryFn: () => api.myAvailabilities() });
}

export function useCreateAvailability() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.createAvailability(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.availabilities.mine });
      queryClient.invalidateQueries({ queryKey: queryKeys.technicians.all });
    },
  });
}

export function useDeleteAvailability() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.deleteAvailability(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.availabilities.mine });
      queryClient.invalidateQueries({ queryKey: queryKeys.technicians.all });
    },
  });
}
