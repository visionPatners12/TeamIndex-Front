import React from "react";
import { useTranslation } from "react-i18next";
import { GradientHeading } from "@/components/ui/GradientHeading";
import { ExoticIndexCard } from "./ExoticIndexCard";

export const ExoticIndexesSection: React.FC = () => {
  const { t } = useTranslation();

  const EXOTIC_INDEXES = [
    {
      name: t('exoticIndexes.nflName'),
      symbol: "pNFL",
      emoji: "🏈",
      description: t('exoticIndexes.nflDesc'),
      clubs: ["Chiefs", "Eagles", "49ers", "Bills", "Cowboys"],
    },
    {
      name: t('exoticIndexes.nbaName'),
      symbol: "pNBA",
      emoji: "🏀",
      description: t('exoticIndexes.nbaDesc'),
      clubs: ["Celtics", "Nuggets", "Lakers", "Bucks"],
    },
    {
      name: t('exoticIndexes.mlbName'),
      symbol: "pMLB",
      emoji: "⚾",
      description: t('exoticIndexes.mlbDesc'),
      clubs: ["Dodgers", "Yankees", "Braves", "Astros"],
    },
  ];

  return (
    <section className="w-full py-20 px-4 sm:px-8 md:px-12 xl:px-30 bg-[#0D0A06] flex flex-col items-center gap-10">
      <div className="w-full flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-4 flex-wrap">
            <GradientHeading
              as="h2"
              className="text-[38px] sm:text-[52px] lg:text-[63px] leading-[108%]"
              style={{ letterSpacing: "0.8px" }}
            >
              {t('exoticIndexes.heading')}
            </GradientHeading>
            <span className="px-4 py-1.5 rounded-full bg-[#FEB413]/15 border border-[#FEB413]/30 font-jura text-xs font-bold text-[#FEB413] uppercase tracking-wider self-center">
              {t('exoticIndexes.comingSoon')}
            </span>
          </div>

          <p className="font-golos text-white/80 text-lg max-w-2xl mt-2">
            {t('exoticIndexes.body')}
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
};
