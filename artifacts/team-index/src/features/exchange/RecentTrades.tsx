import React from "react";
import { cn } from "@/lib/utils";
import { fmtPrice, fmtSize, type TapeTrade } from "./data";

export function RecentTrades({ trades, className }: { trades: TapeTrade[]; className?: string }) {
  return (
    <div className={cn("flex flex-col rounded-2xl border border-[#2a2720] bg-[#12100B] overflow-hidden", className)}>
      <div className="px-3 py-2.5 border-b border-[#221f18]">
        <span className="font-jura text-xs font-bold uppercase tracking-wider text-white">Recent Trades</span>
      </div>
      <div className="grid grid-cols-3 px-3 py-1.5 text-[10px] font-jura font-bold uppercase tracking-wider text-white/30">
        <span>Price</span>
        <span className="text-right">Size</span>
        <span className="text-right">Time</span>
      </div>
      <div className="flex-1 overflow-y-auto min-h-0">
        {trades.map((t) => (
          <div key={t.id} className="grid grid-cols-3 px-3 h-[22px] items-center hover:bg-white/[0.03]">
            <span
              className={cn(
                "font-mono text-[11px]",
                t.side === "buy" ? "text-[#3FC86A]" : "text-[#FF5A5A]",
              )}
            >
              {fmtPrice(t.price)}
            </span>
            <span className="font-mono text-[11px] text-white/60 text-right">{fmtSize(t.size)}</span>
            <span className="font-mono text-[10px] text-white/35 text-right">{t.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
