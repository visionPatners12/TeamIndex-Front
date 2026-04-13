import type { PoolData, LiveIndexPool } from "@/types/pool";

/** Convert backend PoolData → LiveIndexPool for section components */
export function toLiveIndexPool(p: PoolData): LiveIndexPool {
  const fillPct = Math.min(100, Math.round((p.poolSize / p.poolCap) * 100));
  const statusMap: Record<PoolData["status"], LiveIndexPool["status"]> = {
    Open: "open",
    "Closing Soon": "closing soon",
    Closed: "closed",
  };
  return {
    id: p.id,
    teamName: p.team.toUpperCase(),
    symbol: `$${p.symbol}`,
    status: statusMap[p.status],
    indexValue: p.tokenValue,
    change: p.change24h,
    holders: p.holders,
    poolFill: `${fillPct}%`,
    poolSize: `$${(p.poolSize / 1000).toFixed(1)}K`,
    poolCap: `$${(p.poolCap / 1000).toFixed(0)}K`,
    tags: ["USDC / CHZ", "Gains Eligible", "Listing Soon"],
    disabled: p.status === "Closed",
  };
}
