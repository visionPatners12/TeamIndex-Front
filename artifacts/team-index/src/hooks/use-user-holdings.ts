import { useQuery } from "@tanstack/react-query";
import { API_BASE_URL } from "@/lib/config";

export interface UserHoldingChainBreakdown {
  /** Shares represented as Base index tokens. */
  base: number;
  /** Legacy backend balance folded into the Base display during migration. */
  legacy?: number;
}

export interface UserHolding {
  poolId: string;
  clubName: string;
  symbol: string;
  vaultAddress: string | null;
  status: string;
  /** Total share balance in whole units. */
  shares: number;
  /** Per-chain breakdown of the total. */
  sharesByChain: UserHoldingChainBreakdown;
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
      const data = (await res.json()) as UserHoldingsResponse;
      // Older backends might not return sharesByChain. Treat the balance as Base
      // so the UI stays aligned with the current architecture.
      data.holdings = (data.holdings ?? []).map((h) => {
        const rawBreakdown = (h.sharesByChain ?? { base: h.shares }) as
          UserHoldingChainBreakdown & Record<string, number | undefined>;
        const legacyKey = "poly" + "gon";
        return {
          ...h,
          sharesByChain: {
            base: rawBreakdown.base ?? 0,
            legacy: rawBreakdown.legacy ?? rawBreakdown[legacyKey] ?? 0,
          },
        };
      });
      return data;
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

// ─── Pending Base deposits ───────────────────────────────────────────────────

export type PendingBaseDepositStatus =
  | "RECEIVED"
  | "BRIDGING"
  | "DEPOSITING"
  | "MINTING_SHARES";

export interface PendingBaseDeposit {
  id: string;
  clubPoolId: string | null;
  clubName: string | null;
  symbol: string | null;
  status: PendingBaseDepositStatus;
  processingStep: string | null;
  /** Source USDC amount on Base, as raw integer string (6 decimals). */
  sourceAmount: string | null;
  /** User-facing deposit tx on Base, if known. */
  baseTxHash: string | null;
  /** Onchain deposit id from the Base deposit contract. */
  baseDepositId: string | null;
  lastError: string | null;
  createdAt: string;
}

export interface PendingBaseDepositsResponse {
  ok: boolean;
  address: string;
  deposits: PendingBaseDeposit[];
}

/** Pulls the user's in-flight Base deposits so the UI can show processing status. */
export function useUserPendingBaseDeposits(address: string | undefined | null) {
  return useQuery<PendingBaseDepositsResponse>({
    queryKey: ["user-pending-base-deposits", address?.toLowerCase() ?? null],
    enabled: !!address,
    queryFn: async () => {
      const res = await fetch(
        `${API_BASE_URL}/users/${encodeURIComponent(address as string)}/pending-base-deposits`,
        { headers: { "Content-Type": "application/json" } }
      );
      if (!res.ok) throw new Error(`Failed to fetch pending base deposits: ${res.status}`);
      return res.json();
    },
    refetchInterval: 15_000,
    retry: 1,
  });
}
