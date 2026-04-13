export type PoolStatus = "Open" | "Closing Soon" | "Closed";
export type LiveIndexStatus = "open" | "closing soon" | "closed";

export interface PoolData {
  id: string;
  team: string;
  symbol: string;
  status: PoolStatus;
  poolSize: number;
  poolCap: number;
  tokenValue: number;
  change24h: number;
  holders: number;
  sparklineData: number[];
  vaultAddress?: string;
}

export interface LiveIndexPool {
  id: string;
  teamName: string;
  teamLogoUrl?: string;
  symbol: string;
  indexValue: number;
  change: number;
  status: LiveIndexStatus;
  holders: number;
  poolFill: string;
  poolSize: string;
  poolCap: string;
  tags: string[];
  disabled?: boolean;
}
