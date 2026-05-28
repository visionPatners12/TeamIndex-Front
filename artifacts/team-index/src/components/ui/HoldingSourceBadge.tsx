import React from "react";
import { cn } from "@/lib/utils";

interface HoldingSourceBadgeProps {
  polygon: number;
  base: number;
  /** Compact = single-line tiny badge for use inside cards/lists.
   *  Wide = two-line stacked layout for the Dashboard. */
  variant?: "compact" | "wide";
  className?: string;
}

function fmt(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "0";
  if (n >= 1_000) return n.toFixed(0);
  if (n >= 1) return n.toFixed(2);
  return n.toFixed(4);
}

/** Visualises the cross-chain provenance of a user's pool shares.
 *
 * A user might hold some shares directly on the Polygon vault (deposited
 * from Polygon-side USDC) and some as wrapped ERC20 on Base (deposited via
 * the Base bridge). Showing both makes it clear where their balance lives. */
export function HoldingSourceBadge({
  polygon,
  base,
  variant = "compact",
  className,
}: HoldingSourceBadgeProps) {
  const hasPolygon = polygon > 0;
  const hasBase = base > 0;
  if (!hasPolygon && !hasBase) return null;

  // Single-chain users get a smaller "source: Polygon" / "source: Base" tag,
  // multi-chain users get the side-by-side breakdown.
  if (variant === "compact") {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1 text-[10px] font-mono",
          className
        )}
      >
        {hasPolygon && (
          <span className="px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30">
            ⬢ Polygon · {fmt(polygon)}
          </span>
        )}
        {hasBase && (
          <span className="px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30">
            ◆ Base · {fmt(base)}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-2 gap-2 text-xs", className)}>
      <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg px-2.5 py-2 flex flex-col">
        <span className="text-[10px] uppercase tracking-wider text-purple-300/80 font-medium">
          ⬢ Polygon (direct)
        </span>
        <span className="font-mono font-bold text-white text-sm mt-0.5">{fmt(polygon)}</span>
      </div>
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg px-2.5 py-2 flex flex-col">
        <span className="text-[10px] uppercase tracking-wider text-blue-300/80 font-medium">
          ◆ Base (wrapped)
        </span>
        <span className="font-mono font-bold text-white text-sm mt-0.5">{fmt(base)}</span>
      </div>
    </div>
  );
}
