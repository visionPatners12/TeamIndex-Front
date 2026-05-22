import { useQuery } from "@tanstack/react-query";
import { API_BASE_URL } from "@/lib/config";

export interface UserHolding {
  poolId: string;
  clubName: string;
  symbol: string;
  vaultAddress: string | null;
  status: string;
  /** Share balance in whole units (e.g. 12.5 shares) */
  shares: number;
  /** Raw on-chain share balance (6-decimal integer as string) */
  tokenBalanceRaw: string;
  /** Current price per share in USD */
  tokenPriceUsd: number;
  /** shares × tokenPriceUsd */
  valueUsd: number;
  updatedAt: string;
}

export interface UserHoldingsResponse {
  ok: boolean;
  address: string;
  holdings: UserHolding[];
  totalValueUsd: number;
}

/**
 * Fetch every pool the connected wallet has a share balance in, plus the live
 * USD value of each holding and a portfolio total.
 *
 * The query is automatically disabled when no `address` is provided so it's
 * safe to call unconditionally from components that may be unauthenticated.
 */
export function useUserHoldings(address: string | undefined | null) {
  return useQuery<UserHoldingsResponse>({
    queryKey: ["user-holdings", address?.toLowerCase() ?? null],
    enabled: !!address,
    queryFn: async () => {
      const res = await fetch(
        `${API_BASE_URL}/users/${encodeURIComponent(address as string)}/holdings`,
        { headers: { "Content-Type": "application/json" } }
      );
      if (!res.ok) throw new Error(`Failed to fetch holdings: ${res.status}`);
      return res.json();
    },
    refetchInterval: 30_000,
    retry: 1,
  });
}

/** Convenience accessor: holding for one pool (or undefined if none). */
export function useUserHoldingForPool(
  address: string | undefined | null,
  poolId: string | undefined | null
): UserHolding | undefined {
  const { data } = useUserHoldings(address);
  if (!data || !poolId) return undefined;
  return data.holdings.find((h) => h.poolId === poolId);
}
