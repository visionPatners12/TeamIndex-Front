import { useQuery, useQueryClient } from "@tanstack/react-query";
import { API_BASE_URL } from "@/lib/config";
import type { PoolData } from "@/components/PoolCard";

/** On-chain / DB deposit cap is always USDC 6-decimal integer (human = raw / 1e6). */
export function depositCapToHuman(raw: string | undefined | null): number {
  if (raw === undefined || raw === null || raw === "") return 0;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return n / 1_000_000;
}

/**
 * `totalPoolValue`: backend stores human USD (often with decimals). Legacy rows may be plain
 * integers meaning raw USDC base units (e.g. 180000 → $0.18).
 */
export function totalPoolValueToHuman(raw: string | undefined | null): number {
  if (raw === undefined || raw === null || raw === "") return 0;
  const s = String(raw).trim();
  const n = Number(s);
  if (!Number.isFinite(n) || n <= 0) return 0;
  if (s.includes(".") || /[eE]/i.test(s)) return n;
  if (/^\d+$/.test(s)) return n / 1_000_000;
  return n;
}

export interface BackendPool {
  id: string;
  clubName: string;
  symbol: string;
  polymarketTeamId?: string | null;
  /** Distinct users with vault shares synced into club_pool_users */
  holdersCount?: number;
  vaultAddress: string | null;
  depositCap: string;
  cash: string;
  totalPoolValue: string;
  totalTokenSupply: string;
  officialTokenPrice: string;
  status: string;
  createdAt: string;
}

/** Matches on-chain `USDC4626Vault.decimals()` — `totalTokenSupply` from DB is raw units. */
const VAULT_SHARE_DECIMALS = 6;

/**
 * USD per **1.0** vault share for UI + deposit estimates.
 * Backend used to store `officialTokenPrice` as TVL/rawSupply (per 1e-6 share); detect and fix.
 */
export function tokenPriceUsdPerWholeShare(p: BackendPool): number {
  const stored = parseFloat(p.officialTokenPrice);
  const tvl = totalPoolValueToHuman(p.totalPoolValue);
  const rawSup = Number(p.totalTokenSupply);
  const sharesHuman =
    Number.isFinite(rawSup) && rawSup > 0 ? rawSup / 10 ** VAULT_SHARE_DECIMALS : 0;

  if (sharesHuman > 0 && tvl > 0) {
    const nav = tvl / sharesHuman;
    if (Number.isFinite(nav) && nav > 0 && Number.isFinite(stored) && stored > 0) {
      const ratio = nav / stored;
      if (ratio > 10_000) return nav;
    }
    if ((!Number.isFinite(stored) || stored <= 0) && Number.isFinite(nav) && nav > 0) return nav;
  }

  if (Number.isFinite(stored) && stored > 0) return stored;
  return 1.0;
}

export function mapToPoolData(p: BackendPool): PoolData {
  const tokenValue = tokenPriceUsdPerWholeShare(p);
  const poolSize = totalPoolValueToHuman(p.totalPoolValue);
  const rawCap = Number(p.depositCap);
  const capUnlimited = !Number.isFinite(rawCap) || rawCap <= 0;
  const poolCap = capUnlimited ? 0 : depositCapToHuman(p.depositCap);

  // Status from backend
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
    capUnlimited,
    tokenValue,
    change24h: 0,
    holders: typeof p.holdersCount === "number" ? p.holdersCount : 0,
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
