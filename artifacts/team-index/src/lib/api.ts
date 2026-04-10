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

export interface TeamEntry {
  id: string;
  internalClubName: string;
  polymarketTeamId: string;
}

export const api = {
  getTeams: () =>
    apiFetch<{ ok: boolean; teams: TeamEntry[] }>(`/teams`),

  getPool: (poolId: string) =>
    apiFetch<PoolResponse>(`/pools/${poolId}`),

  getPoolCandidates: (poolId: string) =>
    apiFetch<{ ok: boolean; candidates: unknown[] }>(`/pools/${poolId}/candidates`),

  getPoolPositions: (poolId: string) =>
    apiFetch<{ ok: boolean; positions: unknown[] }>(`/pools/${poolId}/positions`),

  getLatestSnapshot: (poolId: string) =>
    apiFetch<PriceSnapshotResponse>(`/pools/${poolId}/price-snapshots/latest`),

  prepareDeposit: (poolId: string, assets: string, receiver: string) =>
    apiFetch<TxResponse>(`/pools/${poolId}/tx/deposit`, {
      method: "POST",
      body: JSON.stringify({ assets, receiver }),
    }),

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
