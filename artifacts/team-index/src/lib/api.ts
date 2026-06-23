import { API_BASE_URL } from "./config";

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(body.error || `API ${res.status}`, res.status, body.code);
  }
  return res.json();
}

export interface PoolResponse {
  ok: boolean;
  pool: {
    id: string;
    clubName: string;
    symbol: string;
    vaultAddress: string | null;
    cash: string;
    openPositionsValue: string;
    realizedPnl: string;
    totalPoolValue: string;
    totalTokenSupply: string;
    officialTokenPrice: string;
    riskParams: Record<string, unknown>;
    status: string;
  };
}

export interface PoolsListResponse {
  ok: boolean;
  pools: PoolResponse["pool"][];
}

export interface PriceSnapshotResponse {
  ok: boolean;
  snapshot: {
    officialTokenPrice: string;
    totalPoolValue: string;
    cash: string;
    positionsValue: string;
    snapshotTime: string;
  } | null;
}

export interface TxResponse {
  ok: boolean;
  tx: { to: string; data: string };
  vaultAddress?: string;
  assetAddress?: string;
  txs?: {
    approveTx: PreparedTx;
    depositTx: PreparedTx;
  };
}

export interface PreparedTx {
  to: string;
  data: string;
  value?: string;
  gas?: string;
  gasLimit?: string;
}

export interface BaseUsdcDepositTxResponse {
  ok: boolean;
  receiverAddress: string;
  usdcAddress: string;
  poolIdHash: string;
  txs: {
    approveTx: PreparedTx;
    depositTx: PreparedTx;
  };
}

export interface BaseChainDeposit {
  id: string;
  poolIdHash: string;
  clubPoolId: string | null;
  userAddress: string;
  sourceToken: string;
  sourceAmount: string;
  baseDepositId: string | number;
  baseTxHash: string | null;
  releaseTxHash: string | null;
  usdcAmount: string | null;
  sharesMinted: string | null;
  baseMintTxHash: string | null;
  status: string;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TeamEntry {
  id: string;
  name: string;
  logoUrl: string | null;
}

export interface LimitlessTeamMarket {
  id: string;
  conditionId?: string | null;
  question?: string | null;
  title?: string | null;
  endDateIso?: string | null;
  liquidity?: number | string | null;
  volume24h?: number | string | null;
  yesPrice?: number | string | null;
  noPrice?: number | string | null;
  active?: boolean | null;
  closed?: boolean | null;
  eventId?: string | null;
  eventSlug?: string | null;
  eventTitle?: string | null;
  gameStartTime?: string | null;
  marketType?: "game" | "future" | null;
  sideHint: "HOME" | "AWAY";
}

export type { VaultPosition } from '@/types/polymarket';
import type { VaultPosition, AllocationProposal, SelectedMarket } from '@/types/polymarket';

export const api = {
  getTeams: () =>
    apiFetch<{ ok: boolean; teams: TeamEntry[] }>(`/teams?limitlessOnly=1`),

  getTeamLimitlessMarkets: (teamId: string) =>
    apiFetch<{ ok: boolean; markets: LimitlessTeamMarket[] }>(
      `/teams/${encodeURIComponent(teamId)}/limitless-markets`
    ),

  getPool: (poolId: string) =>
    apiFetch<PoolResponse>(`/pools/${poolId}`),

  getPoolCandidates: (poolId: string) =>
    apiFetch<{ ok: boolean; candidates: unknown[] }>(`/pools/${poolId}/candidates`),

  getPoolPositions: (poolId: string) =>
    apiFetch<{ ok: boolean; positions: VaultPosition[] }>(`/pools/${poolId}/positions`),

  /** Admin: save accepted allocation proposal for a pool */
  saveAllocationProposal: (
    poolId: string,
    adminKey: string,
    proposal: AllocationProposal,
    selectedMarkets: SelectedMarket[]
  ) =>
    apiFetch<{ ok: boolean }>(
      `/admin/pools/${poolId}/allocation-proposal`,
      {
        method: 'POST',
        headers: { 'x-admin-key': adminKey },
        body: JSON.stringify({ proposal, selectedMarkets }),
      }
    ),

  getLatestSnapshot: (poolId: string) =>
    apiFetch<PriceSnapshotResponse>(`/pools/${poolId}/price-snapshots/latest`),

  prepareDeposit: (poolId: string, assets: string, receiver: string) =>
    apiFetch<TxResponse>(`/pools/${poolId}/tx/deposit`, {
      method: "POST",
      body: JSON.stringify({ assets, receiver }),
    }),

  confirmPoolDeposit: (poolId: string, txHash: string) =>
    apiFetch<{ ok: boolean; pool: PoolResponse["pool"] & { holdersCount?: number } }>(
      `/pools/${poolId}/deposit/confirm`,
      {
        method: "POST",
        body: JSON.stringify({ txHash }),
      }
    ),

  prepareBaseUsdcDeposit: (poolId: string, amount: string) =>
    apiFetch<BaseUsdcDepositTxResponse>(`/base/tx/deposit-usdc`, {
      method: "POST",
      body: JSON.stringify({ poolId, amount }),
    }),

  confirmBaseDeposit: (txHash: string) =>
    apiFetch<{ ok: boolean; deposits: BaseChainDeposit[] }>(`/base/deposits/confirm`, {
      method: "POST",
      body: JSON.stringify({ txHash }),
    }),

  getBaseDeposits: (userAddress: string) =>
    apiFetch<{ ok: boolean; deposits: BaseChainDeposit[] }>(
      `/base/deposits/user/${userAddress}`
    ),

  getBaseDeposit: (depositId: string) =>
    apiFetch<{ ok: boolean; deposit: BaseChainDeposit }>(
      `/base/deposits/${depositId}`
    ),

  prepareMint: (poolId: string, shares: string, receiver: string) =>
    apiFetch<TxResponse>(`/pools/${poolId}/tx/mint`, {
      method: "POST",
      body: JSON.stringify({ shares, receiver }),
    }),

  prepareWithdraw: (poolId: string, assets: string, receiver: string, owner: string) =>
    apiFetch<TxResponse>(`/pools/${poolId}/tx/withdraw`, {
      method: "POST",
      body: JSON.stringify({ assets, receiver, owner }),
    }),

  prepareRedeem: (poolId: string, shares: string, receiver: string, owner: string) =>
    apiFetch<TxResponse>(`/pools/${poolId}/tx/redeem`, {
      method: "POST",
      body: JSON.stringify({ shares, receiver, owner }),
    }),
};
