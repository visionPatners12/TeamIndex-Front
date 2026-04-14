import { useQuery, useQueryClient } from "@tanstack/react-query";
import { API_BASE_URL } from "@/lib/config";
import type { PoolData } from "@/types/pool";

export interface BackendPool {
  id: string;
  clubName: string;
  symbol: string;
  polymarketTeamId?: string | null;
  vaultAddress: string | null;
  depositCap: string;
  cash: string;
  totalPoolValue: string;
  totalTokenSupply: string;
  officialTokenPrice: string;
  status: string;
  createdAt: string;
  holdersCount?: number;
}

function depositCapToHuman(raw: string): { cap: number; unlimited: boolean } {
  const n = parseFloat(raw) || 0;
  if (n <= 0 || n >= 1e18) return { cap: 0, unlimited: true };
  return { cap: n / 1e6, unlimited: false };
}

export function totalPoolValueToHuman(raw: string): number {
  const value = parseFloat(raw) || 0;
  if (value === 0) return 0;
  if (raw.includes(".") && value < 1e6) return value;
  return value / 1e6;
}

export function tokenPriceUsdPerWholeShare(
  officialTokenPrice: string,
  totalPoolValue: string,
  totalTokenSupply: string
): number {
  const price = parseFloat(officialTokenPrice) || 0;
  if (price > 0 && price < 100) return price;
  const navHuman = totalPoolValueToHuman(totalPoolValue);
  const rawSupply = parseFloat(totalTokenSupply) || 0;
  const supplyHuman = rawSupply / 1e6;
  if (supplyHuman > 0) return navHuman / supplyHuman;
  return 1.0;
}

export function mapToPoolData(p: BackendPool): PoolData {
  const tokenValue = tokenPriceUsdPerWholeShare(
    p.officialTokenPrice,
    p.totalPoolValue,
    p.totalTokenSupply
  );
  const poolSize = totalPoolValueToHuman(p.totalPoolValue);
  const { cap: poolCap, unlimited: capUnlimited } = depositCapToHuman(p.depositCap);

  let status: PoolData["status"] = "Open";
  if (p.status === "PAUSED") status = "Closed";
  else if (!capUnlimited && poolCap > 0 && poolSize / poolCap > 0.9) status = "Closing Soon";

  return {
    id: p.id,
    team: p.clubName,
    symbol: p.symbol,
    status,
    poolSize,
    poolCap,
    tokenValue,
    change24h: 0,
    holders: p.holdersCount ?? 0,
    sparklineData: [tokenValue],
    vaultAddress: p.vaultAddress ?? undefined,
    capUnlimited,
  };
}

export function usePools() {
  return useQuery<PoolData[]>({
    queryKey: ["pools"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/health`);
      if (!res.ok) throw new Error("Backend unreachable");

      const poolsRes = await fetch(`${API_BASE_URL}/pools`, {
        headers: { "Content-Type": "application/json" },
      });
      if (poolsRes.status === 404) return [];
      if (!poolsRes.ok) throw new Error(`Failed to fetch pools: ${poolsRes.status}`);

      const data = await poolsRes.json();
      const pools: BackendPool[] = data.pools || [];
      return pools.map(mapToPoolData);
    },
    refetchInterval: 30_000,
    retry: 2,
  });
}

export function usePool(poolId: string | undefined) {
  return useQuery<PoolData | null>({
    queryKey: ["pool", poolId],
    enabled: !!poolId,
    queryFn: async () => {
      if (!poolId) return null;
      const res = await fetch(`${API_BASE_URL}/pools/${poolId}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data.pool ? mapToPoolData(data.pool) : null;
    },
  });
}

export function useAdminPools(adminKey: string) {
  return useQuery<BackendPool[]>({
    queryKey: ["admin-pools", adminKey],
    enabled: !!adminKey,
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/pools`, {
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
      });
      if (!res.ok) throw new Error("Failed to fetch pools");
      const data = await res.json();
      return data.pools || [];
    },
    refetchInterval: 15_000,
  });
}
