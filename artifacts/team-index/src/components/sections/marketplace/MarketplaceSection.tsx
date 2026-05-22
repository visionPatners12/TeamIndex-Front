import React from "react";
import { motion } from "framer-motion";
import { GradientHeading } from "@/components/ui/GradientHeading";
import { ANIMATION, staggerDelay } from "@/utils/animation";

const ORDER_BOOK_BIDS = [
  { price: "1.0842", size: "12,450", fill: 95 },
  { price: "1.0838", size: "8,320", fill: 72 },
  { price: "1.0835", size: "5,100", fill: 55 },
  { price: "1.0831", size: "3,200", fill: 38 },
  { price: "1.0828", size: "1,850", fill: 22 },
];

const ORDER_BOOK_ASKS = [
  { price: "1.0845", size: "9,800", fill: 85 },
  { price: "1.0849", size: "6,420", fill: 65 },
  { price: "1.0852", size: "4,750", fill: 48 },
  { price: "1.0856", size: "2,900", fill: 32 },
  { price: "1.0860", size: "1,200", fill: 15 },
];

const FEATURES = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
      </svg>
    ),
    title: "Instant Trading",
    desc: "Buy and sell Team Index tokens with real-time order matching and deep liquidity.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
      </svg>
    ),
    title: "Cross-Index Swaps",
    desc: "Swap between different Team Index positions in a single transaction. Zero slippage.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
      </svg>
    ),
    title: "Portfolio Analytics",
    desc: "Live P&L tracking, price charts, and performance analytics across all your positions.",
  },
];

const MiniChart: React.FC = () => {
  const points = "0,40 15,35 30,38 45,25 60,28 75,15 90,18 105,8 120,12 135,5 150,10";
  return (
    <svg viewBox="0 0 150 45" className="w-full h-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FEB413" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#FEB413" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,45 ${points} 150,45`} fill="url(#chartGrad)" />
      <polyline points={points} fill="none" stroke="#FEB413" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
};

export const MarketplaceSection: React.FC = () => (
  <section className="w-full py-24 px-4 sm:px-10 lg:px-30 bg-[#0D0A06]">
    <div
      className="w-full"
      style={{
        padding: "2px",
        borderRadius: "30px",
        background:
          "linear-gradient(135deg, #FEB413 0%, rgba(254,180,19,0.4) 30%, rgba(254,180,19,0.08) 60%, rgba(254,180,19,0.4) 85%, #FEB413 100%)",
      }}
    >
      <div
        className="flex flex-col gap-12 sm:gap-16 px-4 sm:px-8 lg:px-16 py-12 sm:py-16"
        style={{
          borderRadius: "28px",
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(254, 180, 19, 0.06) 0%, rgba(254, 180, 19, 0.00) 60%), #0D0A06",
        }}
      >
        <div className="flex flex-col items-center text-center gap-6">
          <motion.span
            initial={{ y: ANIMATION.y, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: ANIMATION.duration }}
            viewport={{ once: ANIMATION.once, amount: 0.2 }}
            className="inline-flex px-4 py-1.5 rounded-full bg-[#FEB413]/10 border border-[#FEB413]/25"
          >
            <span className="font-jura text-xs font-bold text-[#FEB413] uppercase tracking-widest">
              Coming Soon
            </span>
          </motion.span>

          <motion.div
            initial={{ y: ANIMATION.y, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: ANIMATION.duration, delay: 0.1 }}
            viewport={{ once: ANIMATION.once, amount: 0.2 }}
          >
            <GradientHeading className="text-4xl sm:text-5xl lg:text-7xl max-w-4xl">
              THE TEAM INDEX MARKETPLACE
            </GradientHeading>
          </motion.div>

          <motion.p
            initial={{ y: ANIMATION.y, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: ANIMATION.duration, delay: 0.2 }}
            viewport={{ once: ANIMATION.once, amount: 0.2 }}
            className="font-golos text-base sm:text-lg text-white/50 max-w-2xl leading-relaxed"
          >
            A dedicated exchange for Team Index tokens. Trade positions, swap
            between indexes, and track your portfolio — all in one place.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          <motion.div
            initial={{ x: -30, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            transition={{ duration: ANIMATION.duration, delay: 0.3 }}
            viewport={{ once: ANIMATION.once, amount: 0.2 }}
            className="rounded-2xl border border-[#2a2720] bg-[#12100B] p-5 sm:p-6 flex flex-col gap-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#FEB413]/15 flex items-center justify-center">
                  <span className="text-[#FEB413] font-bold text-xs">A</span>
                </div>
                <div>
                  <span className="font-jura text-sm font-bold text-white">pAFC / USDC</span>
                  <p className="font-golos text-[11px] text-white/45">Arsenal Index</p>
                </div>
              </div>
              <div className="text-right">
                <span className="font-mono text-sm font-bold text-white">$1.0842</span>
                <p className="font-mono text-[10px] text-[#3FC86A]">+2.41%</p>
              </div>
            </div>

            <div className="h-12 w-full opacity-60">
              <MiniChart />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[11px] text-[#3FC86A]/80 uppercase tracking-wider">Bids</span>
                  <span className="font-mono text-[11px] text-white/40">Size</span>
                </div>
                {ORDER_BOOK_BIDS.map((row, i) => (
                  <div key={i} className="relative flex items-center justify-between py-[3px] px-1.5 rounded-sm mb-[2px]">
                    <div
                      className="absolute inset-0 rounded-sm bg-[#3FC86A]/8"
                      style={{ width: `${row.fill}%` }}
                    />
                    <span className="relative font-mono text-[11px] text-[#3FC86A]">{row.price}</span>
                    <span className="relative font-mono text-[11px] text-white/50">{row.size}</span>
                  </div>
                ))}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[11px] text-[#FF5A5A]/80 uppercase tracking-wider">Asks</span>
                  <span className="font-mono text-[11px] text-white/40">Size</span>
                </div>
                {ORDER_BOOK_ASKS.map((row, i) => (
                  <div key={i} className="relative flex items-center justify-between py-[3px] px-1.5 rounded-sm mb-[2px]">
                    <div
                      className="absolute right-0 inset-y-0 rounded-sm bg-[#FF5A5A]/8"
                      style={{ width: `${row.fill}%` }}
                    />
                    <span className="relative font-mono text-[11px] text-[#FF5A5A]">{row.price}</span>
                    <span className="relative font-mono text-[11px] text-white/50">{row.size}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <div className="flex gap-4">
                <div>
                  <span className="font-mono text-[11px] text-white/40 block">24h Vol</span>
                  <span className="font-mono text-xs text-white/70">$847.2K</span>
                </div>
                <div>
                  <span className="font-mono text-[11px] text-white/40 block">Spread</span>
                  <span className="font-mono text-xs text-white/70">0.03%</span>
                </div>
              </div>
              <div className="flex gap-2">
                <span className="px-3 py-1 rounded-full bg-[#3FC86A]/10 border border-[#3FC86A]/20 font-jura text-[10px] font-bold text-[#3FC86A] uppercase">
                  Buy
                </span>
                <span className="px-3 py-1 rounded-full bg-[#FF5A5A]/10 border border-[#FF5A5A]/20 font-jura text-[10px] font-bold text-[#FF5A5A] uppercase">
                  Sell
                </span>
              </div>
            </div>
          </motion.div>

          <div className="flex flex-col gap-4">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                {...staggerDelay(i, 0.12)}
                className="flex items-start gap-4 p-5 sm:p-6 rounded-2xl border border-[#2a2720] bg-[#12100B] hover:border-[#FEB413]/20 transition-colors duration-300"
              >
                <div className="shrink-0 w-11 h-11 rounded-xl bg-[#FEB413]/8 border border-[#FEB413]/15 flex items-center justify-center text-[#FEB413]">
                  {f.icon}
                </div>
                <div className="flex flex-col gap-1.5 min-w-0">
                  <span className="font-jura text-base font-bold text-white uppercase tracking-wide">
                    {f.title}
                  </span>
                  <p className="font-golos text-sm text-white/40 leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ y: ANIMATION.y, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: ANIMATION.duration, delay: 0.4 }}
          viewport={{ once: ANIMATION.once, amount: 0.2 }}
          className="flex flex-col items-center gap-4"
        >
          <button
            disabled
            aria-disabled="true"
            className="relative px-10 py-3.5 rounded-full font-jura text-sm font-bold uppercase tracking-wider cursor-not-allowed"
            style={{
              background: "linear-gradient(135deg, rgba(254,180,19,0.12) 0%, rgba(254,180,19,0.04) 100%)",
              border: "1px solid rgba(254,180,19,0.25)",
              color: "rgba(254,180,19,0.6)",
            }}
          >
            Get Early Access
          </button>
          <p className="font-golos text-xs text-white/40">
            Be the first to trade when the marketplace launches.
          </p>
        </motion.div>
      </div>
    </div>
  </section>
);
