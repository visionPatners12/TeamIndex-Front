import { API_BASE_URL } from "./config";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `API ${res.status}`);
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
}

export interface PreparedTx {
  to: string;
  data: string;
  value?: string;
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

export interface DepositWrapChzResponse {
  ok: boolean;
  meta: Record<string, string>;
  txs: {
    approveWrapChzTx: { to: string; data: string };
    swapTx: { to: string; data: string };
    approveUsdcTx: { to: string; data: string };
    depositTx: { to: string; data: string };
  };
}

export interface ChilizTxResponse {
  ok: boolean;
  receiverAddress: string;
  poolIdHash: string;
  tx: { to: string; data: string };
}

export interface ChilizTokenTxResponse {
  ok: boolean;
  receiverAddress: string;
  poolIdHash: string;
  txs: {
    approveTx: { to: string; data: string };
    depositTx: { to: string; data: string };
  };
}

export interface CrossChainDeposit {
  id: string;
  poolId: string;
  userAddress: string;
  sourceToken: string;
  sourceAmount: string;
  status: string;
  sharesMinted: string | null;
  createdAt: string;
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
  lifiBridgeTxHash: string | null;
  polygonBalanceBeforeBridge: string | null;
  usdcAmount: string | null;
  polygonDepositTxHash: string | null;
  sharesMinted: string | null;
  baseMintTxHash: string | null;
  status: string;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TeamEntry {
  id: string;
  internalClubName: string;
  polymarketTeamId: string;
}

export type { VaultPosition } from '@/types/polymarket';
import type { VaultPosition, AllocationProposal, SelectedMarket, GammaMarket } from '@/types/polymarket';

export const api = {
  getTeams: () =>
    apiFetch<{ ok: boolean; teams: TeamEntry[] }>(`/teams`),

  /** Public platform settings (e.g. whether Chiliz network is enabled). */
  getPublicSettings: () =>
    apiFetch<{ ok: boolean; chilizEnabled: boolean; updatedAt: string }>(`/settings/public`),

  /** Real-time CHZ/USD price, always available. */
  getChzPrice: () =>
    apiFetch<{ ok: boolean; usd: number; cached?: boolean; stale?: boolean; fetchedAt: number }>(
      `/chz/price`
    ),

  /** Admin: toggle Chiliz network on/off. */
  setChilizEnabled: (enabled: boolean, adminKey: string) =>
    apiFetch<{ ok: boolean; settings: { chilizEnabled: boolean; updatedAt: string } }>(
      `/admin/settings/chiliz`,
      {
        method: 'PATCH',
        headers: { 'x-admin-key': adminKey },
        body: JSON.stringify({ enabled }),
      }
    ),

  getPool: (poolId: string) =>
    apiFetch<PoolResponse>(`/pools/${poolId}`),

  getPoolCandidates: (poolId: string) =>
    apiFetch<{ ok: boolean; candidates: unknown[] }>(`/pools/${poolId}/candidates`),

  getPoolPositions: (poolId: string) =>
    apiFetch<{ ok: boolean; positions: VaultPosition[] }>(`/pools/${poolId}/positions`),

  /** Admin: search Polymarket markets by team name / keyword */
  searchPolymarketMarkets: (query: string, adminKey: string) =>
    apiFetch<{ ok: boolean; markets: GammaMarket[] }>(
      `/admin/polymarket/search?q=${encodeURIComponent(query)}`,
      { headers: { 'x-admin-key': adminKey } }
    ),

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

  prepareDepositWrapChz: (poolId: string, body: {
    sender: string; receiver: string;
    wrapChzAmountIn: string; usdcAmountOutMin: string;
    depositAssets?: string;
  }) =>
    apiFetch<DepositWrapChzResponse>(`/pools/${poolId}/tx/deposit-wrapchz`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  prepareChilizDepositChz: (poolId: string) =>
    apiFetch<ChilizTxResponse>(`/chiliz/tx/deposit-chz`, {
      method: "POST",
      body: JSON.stringify({ poolId }),
    }),

  prepareChilizDepositToken: (poolId: string, token: string, amount: string) =>
    apiFetch<ChilizTokenTxResponse>(`/chiliz/tx/deposit-token`, {
      method: "POST",
      body: JSON.stringify({ poolId, token, amount }),
    }),

  getChilizDeposits: (userAddress: string) =>
    apiFetch<{ ok: boolean; deposits: CrossChainDeposit[] }>(
      `/chiliz/deposits/user/${userAddress}`
    ),

  getChilizDeposit: (depositId: string) =>
    apiFetch<{ ok: boolean; deposit: CrossChainDeposit }>(
      `/chiliz/deposits/${depositId}`
    ),
};
