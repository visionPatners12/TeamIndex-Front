import React from "react";
import { useTranslation } from "react-i18next";

export type ExoticIndexCardProps = {
  name: string;
  description: string;
  clubs: string[];
  symbol: string;
  emoji?: string;
};

export const ExoticIndexCard: React.FC<ExoticIndexCardProps> = ({
  name,
  description,
  clubs,
  symbol,
  emoji,
}) => {
  const { t } = useTranslation();
  return (
    <div
      className="relative flex flex-col rounded-2xl border border-[#2a2720] bg-[#18140F] p-5 sm:p-6 w-full gap-4 sm:gap-5"
      style={{ boxShadow: "0 2px 16px 0 rgba(0,0,0,0.25)" }}
    >
      <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-[#FEB413]/15 border border-[#FEB413]/30">
        <span className="font-jura text-[10px] font-bold text-[#FEB413] uppercase tracking-wider">
          {t('liveIndexes.comingSoon')}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-full flex items-center justify-center bg-[#23201A] border border-[#2a2720] shrink-0">
          <span className="text-xl">{emoji || name.charAt(0)}</span>
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-white font-bold text-base uppercase leading-tight tracking-wide truncate">
            {name}
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-[#B3B3B3] text-xs font-medium">{symbol}</span>
            <span className="text-[#B3B3B3] text-xs">·</span>
            <span className="text-xs font-medium text-[#FEB413]/70">{t('liveIndexes.multiClub')}</span>
          </div>
        </div>
      </div>

      <p className="font-golos text-sm text-white/60 leading-relaxed">
        {description}
      </p>

      <div className="flex flex-col gap-2">
        <span className="font-jura text-[11px] font-bold text-white/40 uppercase tracking-wider">{t('liveIndexes.clubsIncluded')}</span>
        <div className="flex flex-wrap gap-1.5">
          {clubs.map((club) => (
            <span
              key={club}
              className="px-2.5 py-1 rounded-full bg-[#23201A] border border-[#2a2720] text-xs text-white/70 font-medium"
            >
              {club}
            </span>
          ))}
        </div>
      </div>

      <div className="flex gap-3 w-full mt-auto">
        <div className="flex-1 bg-[#1a1710] rounded-xl px-3 py-2.5 flex flex-col items-start border border-[#2a2720]">
          <span className="font-jura text-[10px] font-bold text-white/35 uppercase tracking-wider mb-1">{t('liveIndexes.tokenValueLabel')}</span>
          <span className="text-white/30 text-sm font-bold font-mono">--</span>
        </div>
        <div className="flex-1 bg-[#1a1710] rounded-xl px-3 py-2.5 flex flex-col items-start border border-[#2a2720]">
          <span className="font-jura text-[10px] font-bold text-white/35 uppercase tracking-wider mb-1">{t('liveIndexes.holdersLabel')}</span>
          <span className="text-white/30 text-sm font-bold font-mono">--</span>
        </div>
      </div>

      <button
        className="w-full h-10 rounded-full font-jura text-sm font-bold uppercase tracking-wider bg-[#23201A] text-white/25 border border-[#2a2720] cursor-not-allowed"
        disabled
      >
        {t('liveIndexes.comingSoon')}
      </button>
    </div>
  );
};
