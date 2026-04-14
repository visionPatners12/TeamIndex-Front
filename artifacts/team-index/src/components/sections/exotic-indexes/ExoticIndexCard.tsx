import React from "react";

export type ExoticIndexCardProps = {
  name: string;
  description: string;
  clubs: string[];
  symbol: string;
};

export const ExoticIndexCard: React.FC<ExoticIndexCardProps> = ({
  name,
  description,
  clubs,
  symbol,
}) => (
  <div
    className="relative flex flex-col rounded-[10px] border border-[#232323] bg-[#18140F] p-5 sm:p-[25px] w-full min-h-[340px] sm:min-h-[390px] gap-4 sm:gap-5 opacity-80"
    style={{ boxShadow: "0 2px 16px 0 rgba(0,0,0,0.25)" }}
  >
    <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-[#FEB413]/15 border border-[#FEB413]/30">
      <span className="font-jura text-[10px] font-bold text-[#FEB413] uppercase tracking-wider">
        Coming Soon
      </span>
    </div>

    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#23201A] border border-[#232323] shrink-0">
        <span className="text-lg font-bold text-[#FEB413]">{name.charAt(0)}</span>
      </div>
      <div className="flex flex-col min-w-0 flex-1">
        <span className="text-white font-bold text-base uppercase leading-tight tracking-wide truncate">
          {name}
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-[#B3B3B3] text-xs font-medium">{symbol}</span>
          <span className="text-[#B3B3B3] text-xs">·</span>
          <span className="text-xs font-medium text-[#FEB413]/70">Multi-Club</span>
        </div>
      </div>
    </div>

    <p className="font-golos text-sm text-white/50 leading-relaxed">
      {description}
    </p>

    <div className="flex flex-col gap-2">
      <span className="text-[#B3B3B3] text-xs font-medium uppercase">Clubs Included</span>
      <div className="flex flex-wrap gap-1.5">
        {clubs.map((club) => (
          <span
            key={club}
            className="px-2.5 py-1 rounded-full bg-[#23201A] border border-[#232323] text-xs text-white/60 font-medium"
          >
            {club}
          </span>
        ))}
      </div>
    </div>

    <div className="flex gap-2 sm:gap-3 w-full mt-auto">
      <div className="flex-1 bg-[#23201A] rounded-lg px-2 sm:px-2.5 py-2 flex flex-col items-start min-w-0">
        <span className="text-[#B3B3B3] text-xs font-medium mb-1">TOKEN VALUE</span>
        <span className="text-white/30 text-sm font-bold mt-1">--</span>
      </div>
      <div className="flex-1 bg-[#23201A] rounded-lg px-2 sm:px-2.5 py-2 flex flex-col items-start min-w-0">
        <span className="text-[#B3B3B3] text-xs font-medium mb-1">HOLDERS</span>
        <span className="text-white/30 text-sm font-bold mt-1">--</span>
      </div>
    </div>

    <button
      className="w-full h-10 rounded-full text-base font-semibold bg-[#23201A] text-[#555] border border-[#232323] cursor-not-allowed"
      disabled
    >
      Coming Soon
    </button>
  </div>
);
