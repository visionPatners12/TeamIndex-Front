import React from "react";
import { LiveIndexCard } from "./LiveIndexCard";
import { GradientHeading } from "@/components/ui/GradientHeading";
import type { LiveIndexPool } from "@/types/pool";
import { DEMO_POOLS } from "@/constants/pools";
import type { UserHolding } from "@/hooks/use-user-holdings";

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
}) => (
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
            disabled={pool.disabled}
            onEnter={() => onEnterPool?.(pool)}
            isAuthenticated={isAuthenticated}
            userShares={holding?.shares}
            userSharesByChain={holding?.sharesByChain}
            userValueUsd={holding?.valueUsd}
            onLogin={onLogin}
          />
        );
      })}
    </div>
  </section>
);
