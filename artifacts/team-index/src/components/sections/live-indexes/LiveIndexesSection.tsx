import React, { useState } from "react";
import { LiveIndexCard } from "./LiveIndexCard";
import { GradientHeading } from "@/components/ui/GradientHeading";
import { VaultPositionsModal } from "@/features/pools/VaultPositionsModal";
import type { LiveIndexPool } from "@/types/pool";
import { DEMO_POOLS } from "@/constants/pools";
import type { UserHolding } from "@/hooks/use-user-holdings";
import { api, type TradingCapability } from "@/lib/api";
import { AlertTriangle, ExternalLink } from "lucide-react";

export type { LiveIndexPool };

interface LiveIndexesSectionProps {
  pools?: LiveIndexPool[];
  onEnterPool?: (pool: LiveIndexPool) => void;
  /** True once wallet auth + Privy are ready. Omit to hide user-balance UI. */
  isAuthenticated?: boolean;
  /** All holdings for the connected user (keyed by poolId inside) */
  userHoldings?: UserHolding[];
  onLogin?: () => void;
}

export const LiveIndexesSection: React.FC<LiveIndexesSectionProps> = ({
  pools = DEMO_POOLS,
  onEnterPool,
  isAuthenticated,
  userHoldings,
  onLogin,
}) => {
  const [positionsPool, setPositionsPool] = useState<{ id: string; name: string } | null>(null);
  const [trading, setTrading] = useState<TradingCapability | null>(null);

  React.useEffect(() => {
    let active = true;
    api.getHealth()
      .then((health) => {
        if (active) setTrading(health.trading ?? null);
      })
      .catch(() => {
        if (active) setTrading(null);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
  <section className="w-full py-12 sm:py-16 lg:py-20 px-4 sm:px-8 md:px-12 xl:px-30 bg-[#0D0A06] flex flex-col items-center gap-7 sm:gap-10">
    <div className="w-full flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <GradientHeading
          as="h2"
          className="text-[34px] sm:text-[48px] lg:text-[58px] leading-[108%]"
          style={{ letterSpacing: "0.8px" }}
        >
          LIVE INDEXES
        </GradientHeading>

        <p className="font-golos text-white/70 text-sm sm:text-base max-w-2xl leading-relaxed mt-2">
          Choose a team pool, see the current index token value, and enter
          when the live window is open. Once connected, your wallet balance
          appears on the same cards.
        </p>
      </div>
    </div>

    {trading && !trading.canTrade && (
      <div
        role="status"
        className="w-full rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-100"
      >
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
          <div className="min-w-0">
            <p className="text-sm font-semibold">Trading Polymarket temporairement désactivé</p>
            <p className="mt-1 text-xs leading-relaxed text-amber-100/70">{trading.reason}</p>
            <a
              href={trading.documentationUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-amber-300 hover:text-amber-200"
            >
              Documentation Polymarket <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    )}

    <div className="w-full grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 items-stretch">
      {pools.map((pool) => {
        const holding = userHoldings?.find((h) => h.poolId === pool.id);
        return (
          <LiveIndexCard
            key={pool.id}
            teamName={pool.teamName}
            teamLogoUrl={pool.teamLogoUrl}
            indexValue={pool.indexValue}
            change={pool.change}
            status={pool.status}
            symbol={pool.symbol}
            holders={pool.holders}
            poolFill={pool.poolFill}
            poolSize={pool.poolSize}
            poolCap={pool.poolCap}
            tags={pool.tags}
            disabled={pool.disabled || Boolean(trading && !trading.canTrade)}
            buttonLabel={trading && !trading.canTrade ? "Trading indisponible" : undefined}
            onEnter={() => onEnterPool?.(pool)}
            onViewPositions={() => setPositionsPool({ id: pool.id, name: pool.teamName })}
            isAuthenticated={isAuthenticated}
            userShares={holding?.shares}
            userSharesByChain={holding?.sharesByChain}
            userValueUsd={holding?.valueUsd}
            onLogin={onLogin}
          />
        );
      })}
    </div>

    {positionsPool && (
      <VaultPositionsModal
        poolId={positionsPool.id}
        poolName={positionsPool.name}
        onClose={() => setPositionsPool(null)}
      />
    )}
  </section>
  );
};
