import type { PoolData, LiveIndexPool } from "@/types/pool";

/** Short USD labels for pool size / cap (human dollars). */
export function fmtUsdShort(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "$0";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  if (n >= 1) return `$${n.toFixed(0)}`;
  return `$${n.toFixed(2)}`;
}

/** Convert backend PoolData → LiveIndexPool for section components */
export function toLiveIndexPool(p: PoolData): LiveIndexPool {
  const hasFiniteCap =
    Number.isFinite(p.poolCap) && p.poolCap > 0 && p.capUnlimited !== true;
  const fillPct = hasFiniteCap
    ? Math.min(100, Math.round((p.poolSize / p.poolCap) * 100))
    : 0;
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
    poolSize: fmtUsdShort(p.poolSize),
    poolCap: hasFiniteCap ? fmtUsdShort(p.poolCap) : "∞",
    tags: ["USDC / CHZ", "Gains Eligible", "Listing Soon"],
    disabled: p.status === "Closed",
  };
}
