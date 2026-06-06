import React, { useMemo, useState } from "react";
import { Search, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sparkline } from "@/features/pools/Sparkline";
import { fmtPrice, type ExchangeMarket } from "./data";

export function MarketList({
  markets,
  selectedId,
  onSelect,
  className,
}: {
  markets: ExchangeMarket[];
  selectedId: string;
  onSelect: (m: ExchangeMarket) => void;
  className?: string;
}) {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"all" | "gainers">("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = markets;
    if (q) {
      list = list.filter(
        (m) =>
          m.symbol.toLowerCase().includes(q) ||
          m.pair.toLowerCase().includes(q) ||
          m.name.toLowerCase().includes(q),
      );
    }
    if (tab === "gainers") list = [...list].sort((a, b) => b.change24h - a.change24h);
    return list;
  }, [markets, query, tab]);

  return (
    <div className={cn("flex flex-col rounded-2xl border border-[#2a2720] bg-[#12100B] overflow-hidden", className)}>
      {/* Search */}
      <div className="p-3 border-b border-[#221f18]">
        <div className="flex items-center gap-2 px-3 h-9 rounded-lg bg-[#0D0A06] border border-[#221f18] focus-within:border-[#FEB413]/40 transition-colors">
          <Search className="w-3.5 h-3.5 text-white/30 shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search markets"
            className="bg-transparent w-full text-sm text-white placeholder:text-white/30 font-golos outline-none"
          />
        </div>
        <div className="flex gap-1 mt-2">
          {(["all", "gainers"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "flex-1 h-7 rounded-md font-jura text-[11px] font-bold uppercase tracking-wider transition-colors",
                tab === t ? "bg-[#FEB413]/12 text-[#FEB413]" : "text-white/40 hover:text-white/70",
              )}
            >
              {t === "all" ? "All Markets" : "Top Gainers"}
            </button>
          ))}
        </div>
      </div>

      {/* Column header */}
      <div className="grid grid-cols-[1fr_auto_auto] gap-2 px-3 py-2 text-[10px] font-jura font-bold uppercase tracking-wider text-white/30 border-b border-[#221f18]">
        <span>Market</span>
        <span className="text-right">Price</span>
        <span className="text-right w-16">24h</span>
      </div>

      {/* Rows */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {filtered.length === 0 && (
          <p className="text-center text-white/30 text-sm font-golos py-8">No markets found</p>
        )}
        {filtered.map((m) => {
          const up = m.change24h >= 0;
          const active = m.id === selectedId;
          return (
            <button
              key={m.id}
              onClick={() => onSelect(m)}
              className={cn(
                "w-full grid grid-cols-[1fr_auto_auto] items-center gap-2 px-3 py-2.5 text-left transition-colors border-l-2",
                active
                  ? "bg-[#FEB413]/8 border-[#FEB413]"
                  : "border-transparent hover:bg-white/[0.03]",
              )}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Star
                  className={cn(
                    "w-3 h-3 shrink-0",
                    active ? "text-[#FEB413] fill-[#FEB413]" : "text-white/15",
                  )}
                />
                <div className="min-w-0">
                  <div className="font-jura text-[13px] font-bold text-white truncate">{m.pair}</div>
                  <div className="font-golos text-[10px] text-white/35 truncate">{m.symbol} Index</div>
                </div>
              </div>

              <div className="flex flex-col items-end">
                <span className="font-mono text-[12px] text-white">{fmtPrice(m.price)}</span>
                <div className="opacity-50 -mr-1">
                  <Sparkline
                    data={m.sparkline}
                    width={44}
                    height={14}
                    color={up ? "#3FC86A" : "#FF5A5A"}
                  />
                </div>
              </div>

              <span
                className={cn(
                  "w-16 text-right font-mono text-[11px] font-medium",
                  up ? "text-[#3FC86A]" : "text-[#FF5A5A]",
                )}
              >
                {up ? "+" : ""}
                {m.change24h.toFixed(2)}%
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
