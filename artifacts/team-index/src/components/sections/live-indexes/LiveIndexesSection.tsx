import React from "react";
import { LiveIndexCard } from "./LiveIndexCard";
import { GradientHeading } from "@/components/ui/GradientHeading";
import type { LiveIndexPool } from "@/types/pool";
import { DEMO_POOLS } from "@/constants/pools";

export type { LiveIndexPool };

interface LiveIndexesSectionProps {
  pools?: LiveIndexPool[];
  onEnterPool?: (pool: LiveIndexPool) => void;
}

export const LiveIndexesSection: React.FC<LiveIndexesSectionProps> = ({
  pools = DEMO_POOLS,
  onEnterPool,
}) => (
  <section className="w-full py-20 px-4 sm:px-8 md:px-12 xl:px-30 bg-[#0D0A06] flex flex-col items-center gap-10">
    <div className="w-full flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <GradientHeading
          as="h2"
          className="text-[38px] sm:text-[52px] lg:text-[63px] leading-[108%]"
          style={{ letterSpacing: "0.8px" }}
        >
          LIVE TEAM INDEXES
        </GradientHeading>

        <p className="font-golos text-white/80 text-lg max-w-2xl">
          Pools are available only during their live entry window. Once a pool
          reaches its cap or closes, new entries are paused until the next
          phase.
        </p>
      </div>
      <a
        href="#"
        className="font-golos text-[#FEB413] text-base font-semibold flex items-center gap-2 hover:underline shrink-0"
      >
        View All History <span className="text-xl">→</span>
      </a>
    </div>

    <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 items-stretch">
      {pools.map((pool) => (
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
        />
      ))}
    </div>
  </section>
);
