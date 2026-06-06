import React from "react";
import { ChevronDown, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtPrice, fmtUsd, type ExchangeMarket } from "./data";

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="flex flex-col">
      <span className="font-jura text-[10px] font-bold uppercase tracking-wider text-white/30">{label}</span>
      <span className={cn("font-mono text-[13px] text-white/90 mt-0.5", accent)}>{value}</span>
    </div>
  );
}

export function MarketHeader({
  market,
  onPickMarket,
}: {
  market: ExchangeMarket;
  onPickMarket?: () => void;
}) {
  const up = market.change24h >= 0;
  return (
    <div className="flex flex-wrap items-center gap-x-8 gap-y-4 rounded-2xl border border-[#2a2720] bg-[#12100B] px-4 sm:px-5 py-4">
      {/* Pair selector */}
      <button
        onClick={onPickMarket}
        className="flex items-center gap-3 shrink-0 group"
      >
        <div className="w-10 h-10 rounded-full bg-[#FEB413]/12 border border-[#FEB413]/20 flex items-center justify-center overflow-hidden p-1.5">
          <img
            src={import.meta.env.BASE_URL + "images/logo_img.svg"}
            alt={market.symbol}
            className="w-full h-full object-contain"
          />
        </div>
        <div className="text-left">
          <div className="flex items-center gap-1.5">
            <span className="font-jura text-lg font-bold text-white tracking-wide">{market.pair}</span>
            <ChevronDown className="w-4 h-4 text-white/40 group-hover:text-white transition-colors lg:hidden" />
          </div>
          <span className="font-golos text-[11px] text-white/40">{market.name}</span>
        </div>
      </button>

      {/* Last price + change */}
      <div className="flex flex-col">
        <span className={cn("font-mono text-2xl font-bold leading-none", up ? "text-[#3FC86A]" : "text-[#FF5A5A]")}>
          {fmtPrice(market.price)}
        </span>
        <div className={cn("flex items-center gap-1 mt-1 font-mono text-xs", up ? "text-[#3FC86A]" : "text-[#FF5A5A]")}>
          {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {up ? "+" : ""}
          {market.change24h.toFixed(2)}%
        </div>
      </div>

      {/* Divider */}
      <div className="hidden sm:block h-9 w-px bg-white/10" />

      {/* Stats */}
      <div className="flex items-center gap-6 sm:gap-8">
        <Stat label="24h High" value={fmtPrice(market.high24h)} accent="text-[#3FC86A]" />
        <Stat label="24h Low" value={fmtPrice(market.low24h)} accent="text-[#FF5A5A]" />
        <Stat label="24h Volume" value={fmtUsd(market.volume24h)} />
        <Stat label="Holders" value={market.holders.toLocaleString()} />
      </div>
    </div>
  );
}
