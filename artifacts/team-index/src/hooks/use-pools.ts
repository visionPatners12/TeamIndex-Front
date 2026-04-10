import { useQuery, useQueryClient } from "@tanstack/react-query";
import { API_BASE_URL } from "@/lib/config";
import type { PoolData } from "@/components/PoolCard";

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
}

export function mapToPoolData(p: BackendPool): PoolData {
  const tokenValue = parseFloat(p.officialTokenPrice) || 1.0;
  const poolSize = parseFloat(p.totalPoolValue) || 0;
  const depositCap = parseFloat(p.depositCap) || 0;
  // Convert USDC 6-decimal cap to human readable
  const poolCap = depositCap > 0 ? depositCap / 1e6 : 200_000;

  // Status from backend
  let status: PoolData["status"] = "Open";
  if (p.status === "PAUSED") status = "Closed";
  else if (poolCap > 0 && poolSize / poolCap > 0.9) status = "Closing Soon";

  return {
    id: p.id,
    team: p.clubName,
    symbol: p.symbol,
    status,
    poolSize,
    poolCap,
    tokenValue,
    change24h: 0,
    holders: 0,
    sparklineData: [tokenValue],
    vaultAddress: p.vaultAddress ?? undefined,
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
