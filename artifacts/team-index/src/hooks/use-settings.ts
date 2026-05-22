import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

/**
 * Public platform settings. Only the fields the user-facing app needs are exposed.
 * Refreshed every 60s so admin toggles propagate without a full reload.
 */
export function usePublicSettings() {
  return useQuery({
    queryKey: ["settings", "public"],
    queryFn: () => api.getPublicSettings(),
    refetchInterval: 60_000,
    staleTime: 30_000,
    retry: 1,
  });
}

/**
 * Real-time CHZ/USD price. The backend caches for ~30s so this polls every 45s.
 */
export function useChzPrice() {
  return useQuery({
    queryKey: ["chz", "price"],
    queryFn: () => api.getChzPrice(),
    refetchInterval: 45_000,
    staleTime: 30_000,
    retry: 1,
  });
}
