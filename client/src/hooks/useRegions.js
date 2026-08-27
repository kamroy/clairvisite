import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { queryKeys } from "../lib/queryKeys";

export function useRegions() {
  return useQuery({ queryKey: queryKeys.regions, queryFn: () => api.regions(), staleTime: Infinity });
}
