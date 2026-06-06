import React, { useMemo, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { motion } from "framer-motion";
import { Search, ArrowLeftRight, ShieldCheck, Tag } from "lucide-react";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { GradientHeading } from "@/components/ui/GradientHeading";
import { usePools } from "@/hooks/use-pools";
import { buildMarkets, type ExchangeMarket } from "@/features/exchange/data";
import { TeamIndexCard } from "@/features/exchange/TeamIndexCard";
import { TradeModal } from "@/features/exchange/TradeModal";

type SortKey = "trending" | "premium" | "discount";

const EXPLAINERS = [
  {
    icon: <Tag className="w-4 h-4" />,
    title: "Exchange price",
    desc: "What fans are paying for a share right now — set by the market.",
  },
  {
    icon: <ShieldCheck className="w-4 h-4" />,
    title: "Real value (NAV)",
    desc: "What one share is actually worth inside the vault.",
  },
  {
    icon: <ArrowLeftRight className="w-4 h-4" />,
    title: "Buy or Sell anytime",
    desc: "Trade your team's index in one tap, settled in USDC on Base.",
  },
];

export default function Exchange() {
  const { ready, authenticated, login } = usePrivy();
  const { data: pools } = usePools();

  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("trending");
  const [trade, setTrade] = useState<{ market: ExchangeMarket; side: "buy" | "sell" } | null>(null);

  const markets = useMemo(() => buildMarkets(pools), [pools]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = markets.filter(
      (m) => !q || m.name.toLowerCase().includes(q) || m.symbol.toLowerCase().includes(q)
    );
    list = [...list].sort((a, b) => {
      if (sort === "premium") return b.premiumPct - a.premiumPct;
      if (sort === "discount") return a.premiumPct - b.premiumPct;
      return b.volume24h - a.volume24h; // trending
    });
    return list;
  }, [markets, query, sort]);

  return (
    <div className="min-h-screen bg-[#0D0A06] selection:bg-[#FEB413]/30 selection:text-white flex flex-col">
      <div className="fixed top-0 inset-x-0 z-[60] bg-[#FEB413] text-[#0D0A06] text-center py-1 font-jura font-bold text-[10px] sm:text-xs uppercase tracking-widest">
        ⚠️ Mainnet Test — This is a live test environment
      </div>
      <Navbar topOffset />

      <main className="flex-1 pt-32 pb-20 px-4 sm:px-8 md:px-12 xl:px-30 flex flex-col gap-10">
        {/* Header */}
        <div className="flex flex-col gap-3">
          <span className="inline-flex w-fit px-3 py-1 rounded-full bg-[#FEB413]/10 border border-[#FEB413]/25 font-jura text-[11px] font-bold text-[#FEB413] uppercase tracking-widest">
            Pryzen Exchange
          </span>
          <GradientHeading as="h1" className="text-[36px] sm:text-[48px] lg:text-[60px] leading-[108%]" style={{ letterSpacing: "0.8px" }}>
            TRADE YOUR TEAM
          </GradientHeading>
          <p className="font-golos text-white/70 text-base max-w-2xl">
            Back your club or cash out in seconds. Every index shows its live exchange
            price next to its real value (NAV) — so you always know what you're paying for.
          </p>
        </div>

        {/* Explainer cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {EXPLAINERS.map((e, i) => (
            <motion.div
              key={e.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="flex items-start gap-3 rounded-xl bg-[#18140F] border border-[#232323] p-4"
            >
              <div className="w-9 h-9 rounded-lg bg-[#FEB413]/10 border border-[#FEB413]/20 flex items-center justify-center text-[#FEB413] shrink-0">
                {e.icon}
              </div>
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-white font-jura font-bold text-sm uppercase tracking-wide">{e.title}</span>
                <span className="text-white/50 text-xs leading-relaxed">{e.desc}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
          <div className="flex items-center gap-2 rounded-full bg-[#18140F] border border-[#232323] px-4 h-11 sm:max-w-xs w-full focus-within:border-[#FEB413]/40 transition-colors">
            <Search className="w-4 h-4 text-white/40 shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search a team…"
              className="flex-1 bg-transparent outline-none text-white text-sm placeholder:text-white/30"
            />
          </div>
          <div className="flex items-center gap-1.5 p-1 rounded-full bg-[#18140F] border border-[#232323] w-fit">
            {([
              ["trending", "Trending"],
              ["premium", "Top premium"],
              ["discount", "Best deals"],
            ] as [SortKey, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setSort(key)}
                className={`px-3.5 h-8 rounded-full font-jura text-xs font-bold uppercase tracking-wide transition-all ${
                  sort === key ? "bg-[#FEB413] text-[#0D0A06]" : "text-white/55 hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-[#232323] bg-[#18140F] p-10 text-center text-white/55 text-sm">
            No team matches “{query}”.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((m, i) => (
              <TeamIndexCard
                key={m.id}
                market={m}
                index={i}
                onTrade={(market, side) => setTrade({ market, side })}
              />
            ))}
          </div>
        )}
      </main>

      <Footer />

      <TradeModal
        market={trade?.market ?? null}
        initialSide={trade?.side ?? "buy"}
        onClose={() => setTrade(null)}
        isAuthenticated={ready ? authenticated : undefined}
        onLogin={login}
      />
    </div>
  );
}
