import React from "react";
import { GradientHeading } from "@/components/ui/GradientHeading";
import { ExoticIndexCard } from "./ExoticIndexCard";

const EXOTIC_INDEXES = [
  {
    name: "NFL Powerhouse",
    symbol: "pNFL",
    emoji: "NFL",
    description:
      "A future pool for top NFL contenders across regular season, playoff, and championship markets.",
    clubs: ["Chiefs", "Eagles", "49ers", "Bills", "Cowboys"],
  },
  {
    name: "NBA Elite",
    symbol: "pNBA",
    emoji: "NBA",
    description:
      "A future pool for leading NBA contenders, built around live season and playoff markets.",
    clubs: ["Celtics", "Nuggets", "Lakers", "Bucks"],
  },
  {
    name: "MLB Contenders",
    symbol: "pMLB",
    emoji: "MLB",
    description:
      "A future pool for baseball contenders across pennant, series, and season-level markets.",
    clubs: ["Dodgers", "Yankees", "Braves", "Astros"],
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

        <p className="font-golos text-white/70 text-sm sm:text-base max-w-2xl leading-relaxed mt-2">
          Coming next: special team baskets and league pools. The core action
          stays the same: enter a pool, receive an index token, and track your
          share.
        </p>
      </div>
    </div>

    <div className="w-full grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 items-stretch">
      {EXOTIC_INDEXES.map((idx) => (
        <ExoticIndexCard
          key={idx.symbol}
          name={idx.name}
          symbol={idx.symbol}
          emoji={idx.emoji}
          description={idx.description}
          clubs={idx.clubs}
        />
      ))}
    </div>
  </section>
);
