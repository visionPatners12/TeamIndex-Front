import React from "react";
import { GradientHeading } from "@/components/ui/GradientHeading";
import { ExoticIndexCard } from "./ExoticIndexCard";

const EXOTIC_INDEXES = [
  {
    name: "English Clubs",
    symbol: "pENGL",
    description:
      "An index tracking English club performances in international competitions. Covers Champions League, Europa League, and Conference League futures and match markets.",
    clubs: ["Arsenal", "Man City", "Liverpool", "Chelsea", "Man United"],
  },
  {
    name: "Top English Clubs",
    symbol: "pTOP4",
    description:
      "A concentrated index covering the top-performing English football clubs. Focused on Premier League title contenders and their domestic + European campaigns.",
    clubs: ["Arsenal", "Man City", "Liverpool"],
  },
  {
    name: "La Liga Elite",
    symbol: "pLIGA",
    description:
      "Tracks the top Spanish clubs across La Liga and European competition markets. Covers both match outcomes and season-level futures.",
    clubs: ["Real Madrid", "Barcelona", "Atletico Madrid"],
  },
];

export const ExoticIndexesSection: React.FC = () => (
  <section className="w-full py-20 px-4 sm:px-8 md:px-12 xl:px-30 bg-[#0D0A06] flex flex-col items-center gap-10">
    <div className="w-full flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <div className="flex items-center gap-4 flex-wrap">
          <GradientHeading
            as="h2"
            className="text-[38px] sm:text-[52px] lg:text-[63px] leading-[108%]"
            style={{ letterSpacing: "0.8px" }}
          >
            EXOTIC INDEXES
          </GradientHeading>
          <span className="px-4 py-1.5 rounded-full bg-[#FEB413]/15 border border-[#FEB413]/30 font-jura text-xs font-bold text-[#FEB413] uppercase tracking-wider self-center">
            Coming Soon
          </span>
        </div>

        <p className="font-golos text-white/80 text-lg max-w-2xl mt-2">
          Multi-club indexes that let you back entire leagues, rivalries, or
          competition brackets — not just a single team.
        </p>
      </div>
    </div>

    <div className="w-full grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 items-stretch">
      {EXOTIC_INDEXES.map((idx) => (
        <ExoticIndexCard
          key={idx.symbol}
          name={idx.name}
          symbol={idx.symbol}
          description={idx.description}
          clubs={idx.clubs}
        />
      ))}
    </div>
  </section>
);
