import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, TrendingUp, TrendingDown, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ExchangeMarket } from "./data";
import { buildNavMarketSeries, fmtPrice, fmtUsd, type Timeframe } from "./data";

const TIMEFRAMES: Timeframe[] = ["1H", "4H", "1D", "1W"];

// SVG coordinate space (scaled to container width via preserveAspectRatio + non-scaling strokes)
const W = 1000;
const H = 300;
const PAD_X = 12;
const PAD_Y = 18;

interface Props {
  market: ExchangeMarket | null;
  onClose: () => void;
  onTrade: (market: ExchangeMarket, side: "buy" | "sell") => void;
}

export function IndexDetailModal({ market, onClose, onTrade }: Props) {
  const [tf, setTf] = useState<Timeframe>("1D");
  const [hover, setHover] = useState<number | null>(null);

  React.useEffect(() => {
    setTf("1D");
    setHover(null);
  }, [market?.id]);

  const series = useMemo(() => (market ? buildNavMarketSeries(market, tf) : null), [market, tf]);

  const geo = useMemo(() => {
    if (!series || series.points.length === 0) return null;
    const n = series.points.length;
    const range = series.max - series.min || 1;
    const lo = series.min - range * 0.08;
    const hi = series.max + range * 0.08;
    const span = hi - lo || 1;
    const xFor = (i: number) => PAD_X + (i / (n - 1)) * (W - 2 * PAD_X);
    const yFor = (val: number) => H - PAD_Y - ((val - lo) / span) * (H - 2 * PAD_Y);
    const marketPts = series.points.map((p, i) => `${xFor(i)},${yFor(p.market)}`).join(" ");
    const navPts = series.points.map((p, i) => `${xFor(i)},${yFor(p.nav)}`).join(" ");
    const areaPts = `${PAD_X},${H - PAD_Y} ${marketPts} ${W - PAD_X},${H - PAD_Y}`;
    return { n, xFor, yFor, marketPts, navPts, areaPts };
  }, [series]);

  if (!market || !series || !geo) return null;

  const up = series.marketChangePct >= 0;
  const lineColor = up ? "#3FC86A" : "#FF5A5A";
  const premiumUp = market.premiumPct >= 0;
  const hoverPt = hover != null ? series.points[hover] : null;

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    setHover(Math.round(ratio * (geo.n - 1)));
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

        <motion.div
          initial={{ y: 40, opacity: 0, scale: 0.98 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 40, opacity: 0, scale: 0.98 }}
          transition={{ type: "spring", damping: 30, stiffness: 320 }}
          className="relative w-full sm:max-w-[620px] max-h-[92vh] overflow-y-auto bg-[#12100B] border border-[#2a2720] rounded-t-3xl sm:rounded-3xl"
          style={{ boxShadow: "0 -8px 40px rgba(0,0,0,0.5)" }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-5 sm:px-6 pt-5 pb-4 border-b border-white/5 sticky top-0 bg-[#12100B] z-10">
            <div className="w-10 h-10 rounded-full bg-[#23201A] border border-[#232323] flex items-center justify-center overflow-hidden p-1.5 shrink-0">
              <img src={import.meta.env.BASE_URL + "images/logo_img.svg"} alt="" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-white font-bold text-base leading-tight truncate">{market.name}</span>
              <span className="text-[#B3B3B3] text-xs font-mono">{market.pair}</span>
            </div>
            {market.redeemLocked && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-[#FEB413] bg-[#FEB413]/10 border border-[#FEB413]/25 px-2 py-1 rounded-full shrink-0">
                <Lock className="w-3 h-3" /> Exit via market
              </span>
            )}
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center border border-white/10 transition-all shrink-0"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-white/70" />
            </button>
          </div>

          <div className="px-5 sm:px-6 py-5 flex flex-col gap-5">
            {/* Price summary */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-[#18140F] border border-[#FEB413]/20 p-3 flex flex-col gap-0.5">
                <span className="text-[#B3B3B3] text-[10px] font-medium uppercase tracking-wider">Exchange price</span>
                <span className="text-[#FEB413] text-2xl font-bold font-mono leading-tight">${fmtPrice(market.marketPrice)}</span>
                <span className={cn("inline-flex items-center gap-1 text-xs font-mono", up ? "text-[#3FC86A]" : "text-[#FF5A5A]")}>
                  {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {up ? "+" : ""}{series.marketChangePct}% ({tf})
                </span>
              </div>
              <div className="rounded-xl bg-[#18140F] border border-[#232323] p-3 flex flex-col gap-0.5">
                <span className="text-[#B3B3B3] text-[10px] font-medium uppercase tracking-wider">Real value (NAV)</span>
                <span className="text-white text-2xl font-bold font-mono leading-tight">${fmtPrice(market.nav)}</span>
                <span className={cn("text-xs font-mono", premiumUp ? "text-[#3FC86A]" : "text-[#FF5A5A]")}>
                  {premiumUp ? "+" : ""}{market.premiumPct}% {premiumUp ? "premium" : "discount"}
                </span>
              </div>
            </div>

            {/* Timeframe + legend */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-1 p-1 rounded-full bg-[#0D0A06] border border-[#232323]">
                {TIMEFRAMES.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTf(t)}
                    className={`px-3 h-7 rounded-full font-jura text-xs font-bold uppercase tracking-wide transition-all ${
                      tf === t ? "bg-[#FEB413] text-[#0D0A06]" : "text-white/55 hover:text-white"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-4 text-[11px]">
                <span className="inline-flex items-center gap-1.5 text-white/70">
                  <span className="w-4 h-[2px] rounded-full" style={{ background: lineColor }} /> Exchange
                </span>
                <span className="inline-flex items-center gap-1.5 text-white/70">
                  <span className="w-4 border-t-2 border-dashed border-white/55" /> NAV
                </span>
              </div>
            </div>

            {/* Chart */}
            <div className="relative rounded-xl bg-[#0D0A06] border border-[#232323] p-2">
              <svg
                viewBox={`0 0 ${W} ${H}`}
                className="w-full h-[220px] sm:h-[260px]"
                preserveAspectRatio="none"
                onMouseMove={onMove}
                onMouseLeave={() => setHover(null)}
              >
                <defs>
                  <linearGradient id="exGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={lineColor} stopOpacity="0.28" />
                    <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* area under market line */}
                <polygon points={geo.areaPts} fill="url(#exGrad)" />

                {/* NAV reference (dashed) */}
                <polyline
                  points={geo.navPts}
                  fill="none"
                  stroke="rgba(255,255,255,0.55)"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />

                {/* Market line */}
                <polyline
                  points={geo.marketPts}
                  fill="none"
                  stroke={lineColor}
                  strokeWidth={2.5}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />

                {/* hover crosshair + dots */}
                {hover != null && hoverPt && (
                  <g>
                    <line
                      x1={geo.xFor(hover)}
                      y1={PAD_Y}
                      x2={geo.xFor(hover)}
                      y2={H - PAD_Y}
                      stroke="rgba(255,255,255,0.18)"
                      strokeWidth={1}
                      vectorEffect="non-scaling-stroke"
                    />
                    <circle cx={geo.xFor(hover)} cy={geo.yFor(hoverPt.market)} r={4} fill={lineColor} vectorEffect="non-scaling-stroke" />
                    <circle cx={geo.xFor(hover)} cy={geo.yFor(hoverPt.nav)} r={3.5} fill="#fff" vectorEffect="non-scaling-stroke" />
                  </g>
                )}
              </svg>

              {/* hover tooltip */}
              {hover != null && hoverPt && (
                <div
                  className="absolute top-3 pointer-events-none rounded-lg bg-[#18140F] border border-[#2a2720] px-3 py-2 flex flex-col gap-0.5"
                  style={{
                    left: `calc(${(hover / (geo.n - 1)) * 100}% )`,
                    transform: `translateX(${hover / (geo.n - 1) > 0.7 ? "-110%" : "10px"})`,
                  }}
                >
                  <span className="text-[10px] text-[#B3B3B3]">
                    Exchange <span className="text-[#FEB413] font-mono font-bold">${fmtPrice(hoverPt.market)}</span>
                  </span>
                  <span className="text-[10px] text-[#B3B3B3]">
                    NAV <span className="text-white font-mono font-bold">${fmtPrice(hoverPt.nav)}</span>
                  </span>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                ["24h High", `$${fmtPrice(market.high24h)}`],
                ["24h Low", `$${fmtPrice(market.low24h)}`],
                ["24h Volume", fmtUsd(market.volume24h)],
                ["Fans", market.holders.toLocaleString()],
              ].map(([label, val]) => (
                <div key={label} className="rounded-lg bg-[#18140F] border border-[#232323] px-3 py-2 flex flex-col">
                  <span className="text-[#B3B3B3] text-[10px] font-medium uppercase tracking-wider">{label}</span>
                  <span className="text-white text-sm font-bold font-mono">{val}</span>
                </div>
              ))}
            </div>

            {/* NAV explainer */}
            <div className="rounded-xl bg-[#23201A] border border-[#232323] p-3">
              <p className="text-white/55 text-xs leading-relaxed">
                The <span className="text-[#FEB413] font-semibold">exchange price</span> is what fans pay right now; the{" "}
                <span className="text-white font-semibold">NAV</span> is the index's real value in the vault. When they
                drift apart, the index trades at a {premiumUp ? "premium" : "discount"}.
              </p>
            </div>

            {/* Buy / Sell */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => onTrade(market, "buy")}
                className="h-12 rounded-full font-jura font-bold text-sm uppercase tracking-wide bg-[#3FC86A] text-[#0D0A06] hover:bg-[#4ad879] active:scale-[0.98] transition-all"
              >
                Buy
              </button>
              <button
                onClick={() => onTrade(market, "sell")}
                className="h-12 rounded-full font-jura font-bold text-sm uppercase tracking-wide bg-transparent text-[#FF5A5A] border border-[#FF5A5A]/40 hover:bg-[#FF5A5A]/10 active:scale-[0.98] transition-all"
              >
                Sell
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
