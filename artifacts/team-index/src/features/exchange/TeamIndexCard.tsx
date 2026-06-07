import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Lock, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sparkline } from "@/features/pools/Sparkline";
import type { ExchangeMarket } from "./data";
import { fmtPrice, fmtUsd } from "./data";

interface Props {
  market: ExchangeMarket;
  index: number;
  onTrade: (market: ExchangeMarket, side: "buy" | "sell") => void;
  onOpen: (market: ExchangeMarket) => void;
}

export function TeamIndexCard({ market, index, onTrade, onOpen }: Props) {
  const up = market.change24h >= 0;
  const premiumUp = market.premiumPct >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.04, 0.3) }}
      onClick={() => onOpen(market)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(market);
        }
      }}
      className="group relative rounded-2xl bg-[#18140F] border border-[#232323] p-5 flex flex-col gap-4 hover:border-[#FEB413]/30 transition-colors duration-300 cursor-pointer outline-none focus-visible:border-[#FEB413]/50"
      style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.25)" }}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-[#23201A] border border-[#232323] flex items-center justify-center overflow-hidden p-1.5 shrink-0">
          <img src={import.meta.env.BASE_URL + "images/logo_img.svg"} alt="" className="w-full h-full object-contain" />
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-white font-bold text-sm leading-tight truncate">{market.name}</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[#B3B3B3] text-xs font-mono">{market.pair}</span>
          </div>
        </div>
        {market.redeemLocked ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-[#FEB413] bg-[#FEB413]/10 border border-[#FEB413]/25 px-2 py-1 rounded-full shrink-0">
            <Lock className="w-3 h-3" /> Exit via market
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-[#3FC86A] bg-[#3FC86A]/10 border border-[#3FC86A]/25 px-2 py-1 rounded-full shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3FC86A]" /> Live
          </span>
        )}
      </div>

      {/* Prices: Market (hero) + NAV (reference) */}
      <div className="flex items-end justify-between gap-3">
        <div className="flex flex-col">
          <span className="text-[#B3B3B3] text-[10px] font-medium uppercase tracking-wider">Exchange price</span>
          <span className="text-[#FEB413] text-2xl font-bold font-mono leading-tight">${fmtPrice(market.marketPrice)}</span>
          <span className={cn("inline-flex items-center gap-1 text-xs font-mono mt-0.5", up ? "text-[#3FC86A]" : "text-[#FF5A5A]")}>
            {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {up ? "+" : ""}{market.change24h}% 24h
          </span>
        </div>
        <div className="opacity-70 mb-1">
          <Sparkline
            data={market.sparkline}
            width={84}
            height={36}
            color={up ? "#3FC86A" : "#FF5A5A"}
          />
        </div>
      </div>

      {/* NAV + premium row */}
      <div className="flex items-center justify-between rounded-xl bg-[#23201A] border border-[#232323] px-3 py-2.5">
        <div className="flex flex-col">
          <span className="text-[#B3B3B3] text-[10px] font-medium uppercase tracking-wider">Real value (NAV)</span>
          <span className="text-white text-sm font-bold font-mono">${fmtPrice(market.nav)}</span>
        </div>
        <span
          className={cn(
            "text-[11px] font-bold font-mono px-2 py-1 rounded-md",
            premiumUp ? "text-[#3FC86A] bg-[#3FC86A]/10" : "text-[#FF5A5A] bg-[#FF5A5A]/10"
          )}
          title="How far the market price sits above or below the index's real value"
        >
          {premiumUp ? "+" : ""}{market.premiumPct}% {premiumUp ? "premium" : "discount"}
        </span>
      </div>

      {/* Meta */}
      <div className="flex items-center justify-between text-[11px] text-white/45 font-mono">
        <span className="inline-flex items-center gap-1"><Users className="w-3 h-3" /> {market.holders.toLocaleString()} fans</span>
        <span>Vol {fmtUsd(market.volume24h)}</span>
      </div>

      {/* Buy / Sell */}
      <div className="grid grid-cols-2 gap-2.5 mt-auto">
        <button
          onClick={(e) => { e.stopPropagation(); onTrade(market, "buy"); }}
          className="h-11 rounded-full font-jura font-bold text-sm uppercase tracking-wide bg-[#3FC86A] text-[#0D0A06] hover:bg-[#4ad879] active:scale-[0.98] transition-all"
        >
          Buy
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onTrade(market, "sell"); }}
          className="h-11 rounded-full font-jura font-bold text-sm uppercase tracking-wide bg-transparent text-[#FF5A5A] border border-[#FF5A5A]/40 hover:bg-[#FF5A5A]/10 active:scale-[0.98] transition-all"
        >
          Sell
        </button>
      </div>
    </motion.div>
  );
}
