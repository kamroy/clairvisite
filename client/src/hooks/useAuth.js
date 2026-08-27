import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { queryKeys } from "../lib/queryKeys";

export function useMe(options = {}) {
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: () => api.me(),
    retry: false,
    ...options,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (credentials) => {
      await api.login(credentials);
      return api.me();
    },
    onSuccess: (me) => queryClient.setQueryData(queryKeys.me, me),
  });
}

export function useRegister() {
  return useMutation({ mutationFn: (data) => api.register(data) });
}

export function useResendVerification() {
  return useMutation({ mutationFn: (email) => api.resendVerification(email) });
}

export function useUpdateMyAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.updateMyAccount(data),
    onSuccess: (updated) => queryClient.setQueryData(queryKeys.me, updated),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.logout(),
    onSuccess: () => queryClient.setQueryData(queryKeys.me, null),
  });
}
