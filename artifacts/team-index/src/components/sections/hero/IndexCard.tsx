import React from "react";

export const IndexCard: React.FC = () => (
  <div className="w-105 xl:w-115 h-113.5 bg-[#504220] border border-white/10 rounded-[20px] p-8 flex flex-col gap-6 shadow-2xl">

    {/* Header */}
    <div className="flex items-center gap-3">
      <div className="w-11 h-11 rounded-full bg-[#4c422a] flex items-center justify-center text-xl font-bold text-[#ffffff] shrink-0">
        A
      </div>
      <div className="flex flex-col min-w-0">
        <span className="font-jura font-bold text-base text-white uppercase tracking-wide">
          ARSENAL INDEX
        </span>
        <span className="font-golos text-xs text-white/50">pAFC · Arsenal F.C.</span>
      </div>
      <span className="ml-auto shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/15 border border-green-500/25 text-green-400 text-[11px] font-semibold">
        <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
        Live
      </span>
    </div>

    {/* Index value */}
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <span className="font-jura font-bold text-4xl text-white">$12,450.80</span>
        <span className="font-golos text-base font-semibold text-green-400">+12.4%</span>
      </div>
      <span className="font-golos text-xs text-white/40">Current Index Value</span>
    </div>

    {/* Stats row */}
    <div className="flex gap-3">
      {/* Holders */}
      <div className="flex-1 bg-white/5 rounded-xl p-4 border border-white/8 flex flex-col items-start gap-1">
        <img
          src={import.meta.env.BASE_URL + "icons/users.svg"}
          alt="Holders"
          className="w-5 h-5 mb-0.5"
        />
        <span className="font-golos text-[11px] text-white/40">Current Holders</span>
        <span className="font-jura font-bold text-xl text-white">847</span>
      </div>

      {/* Listing status */}
      <div className="flex-1 bg-white/5 rounded-xl p-4 border border-white/8 flex flex-col items-start gap-1">
        <img
          src={import.meta.env.BASE_URL + "icons/upload.svg"}
          alt="Listing"
          className="w-5 h-5 mb-0.5"
        />
        <span className="font-golos text-[11px] text-white/40">Current Holders</span>
        <span className="font-golos border p-2 border-[#7c7159] rounded-2xl text-sm font-semibold text-white/50">Listing soon</span>
      </div>
    </div>

    {/* Enter Pool button */}
    <button className="w-full py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-jura font-bold text-base uppercase tracking-wide transition-all">
      Enter Pool
    </button>
  </div>
);
