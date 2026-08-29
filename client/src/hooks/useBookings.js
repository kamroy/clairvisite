import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { queryKeys } from "../lib/queryKeys";
import { PAGE_SIZE } from "../lib/pagination";

const getNextPageParam = (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined);

export function useMyBookings(options = {}) {
  return useInfiniteQuery({
    queryKey: queryKeys.bookings.mine,
    queryFn: ({ pageParam }) => api.myBookings({ page: pageParam, pageSize: PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam,
    ...options,
  });
}

export function useTechnicianBookings(options = {}) {
  return useInfiniteQuery({
    queryKey: queryKeys.bookings.technician,
    queryFn: ({ pageParam }) => api.technicianBookings({ page: pageParam, pageSize: PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam,
    ...options,
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.createBooking(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.mine });
      queryClient.invalidateQueries({ queryKey: queryKeys.technicians.all });
    },
  });
}

export function useCancelBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.cancelBooking(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.mine });
      queryClient.invalidateQueries({ queryKey: queryKeys.technicians.all });
    },
  });
}
