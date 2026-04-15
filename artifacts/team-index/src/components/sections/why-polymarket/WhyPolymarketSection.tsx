import React from "react";
import { GradientHeading } from "@/components/ui/GradientHeading";
import { motion } from "framer-motion";
import { ANIMATION } from "@/utils/animation";

// ─── Stat card ────────────────────────────────────────────────────────────────

// Bracket SVG component
const BracketSvg = ({ flipped = false }: { flipped?: boolean }) => (
  <svg
    className={`absolute top-1/2 -translate-y-1/2 pointer-events-none ${
      flipped ? "right-0 -scale-x-100" : "left-0"
    }`}
    width="7"
    height="27"
    viewBox="0 0 7 27"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M0.307678 6.30762V0.307617H6.30768"
      stroke="white"
      strokeWidth="0.615385"
    />
    <path
      d="M6.30768 26.3076L0.307678 26.3076L0.307678 20.3076"
      stroke="white"
      strokeWidth="0.615385"
    />
  </svg>
);

interface StatCardProps {
  value: string;
  label: string;
}

const StatCard: React.FC<StatCardProps> = ({ value, label }) => (
  <div className="flex-1 flex flex-col items-center justify-center gap-2 px-8 py-6 rounded-xl border border-[#3f392b] bg-[#161104]/60 backdrop-blur-sm min-w-35">
    <span className="font-jura font-bold text-3xl sm:text-4xl text-white tracking-tight">
      {value}
    </span>
    <span className="font-golos text-xs sm:text-sm text-white/40 text-center leading-snug">
      {label}
    </span>
  </div>
);

// ─── Section ─────────────────────────────────────────────────────────────────

export const WhyPolymarketSection: React.FC = () => (
  <section className="w-full py-24 px-4 sm:px-10 lg:px-30 bg-[#0D0A06]">
    {/* Gradient-border wrapper: outer div is the fading gold "border", inner div is the card */}
    <div
      className="w-full"
      style={{
        padding: "13px",
        borderRadius: "30px",
        background:
          "linear-gradient(to bottom, #FEB413 0%, rgba(254,180,19,0.6) 40%, rgba(254,180,19,0.1) 75%, rgba(254,180,19,0) 100%)",
      }}
    >
      <div
        className="flex flex-col items-center gap-8 sm:gap-10 text-center px-4 sm:px-8 lg:px-16 py-10 sm:py-14"
        style={{
          borderRadius: "17px",
          background:
            "radial-gradient(141.42% 70.71% at 50% 0%, rgba(254, 180, 19, 0.08) 0%, rgba(254, 180, 19, 0.00) 60%), #0D0A06",
        }}
      >
      <motion.span
        initial={{ y: ANIMATION.y, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        transition={{ duration: ANIMATION.duration, delay: 0 }}
        viewport={{ once: ANIMATION.once, amount: 0.2 }}
        className="inline-flex mb-4 uppercase text-sm md:text-base leading-normal text-white font-sans relative z-1 p-2"
      >
        <BracketSvg />
        <BracketSvg flipped />
        WHY POLYMARKET?
      </motion.span>

      {/* Heading */}
      <GradientHeading className="text-4xl sm:text-5xl lg:text-6xl max-w-4xl">
        THE WORLD'S LARGEST PREDICTION MARKET — AND THE INFRASTRUCTURE BEHIND
        EVERY TEAM INDEX.
      </GradientHeading>
      {/* Stat cards */}
      <div className="w-full flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center mt-2">
        <StatCard value="96.7%" label="Accuracy 4 hours out" />
        <StatCard value="90.4%" label="Accuracy 1 month out" />
        <StatCard value="$30.5B" label="Total volume traded" />
      </div>

      {/* Accuracy timeline */}
      <div className="w-full max-w-xl mx-auto mt-2">
        <p className="font-jura text-[10px] uppercase tracking-widest text-white/30 mb-3 text-center">Accuracy prior to resolution</p>
        <div className="flex justify-between gap-2">
          {[
            { label: '4 Hrs', value: '96.7%' },
            { label: '12 Hrs', value: '96.4%' },
            { label: '1 Day', value: '95.8%' },
            { label: '1 Week', value: '94%' },
            { label: '1 Month', value: '90.4%' },
          ].map((item) => (
            <div key={item.label} className="flex flex-col items-center gap-1">
              <span className="font-jura font-bold text-sm text-white">{item.value}</span>
              <span className="font-golos text-[10px] text-white/30">{item.label}</span>
            </div>
          ))}
        </div>
        <p className="font-golos text-[10px] text-white/20 text-center mt-2">Brier Score: 0.0641</p>
      </div>

      {/* Body */}
      <p className="font-golos text-sm sm:text-base text-white/40 max-w-2xl leading-relaxed">
        Polymarket odds are right over 90% of the time — even a full month before the
        event resolves.
      </p>
      {/* Link */}
      <a
        href="https://polymarket.com/accuracy"
        target="_blank"
        rel="noopener noreferrer"
        className="font-golos text-sm font-semibold text-[#FEB413] hover:text-[#e6a800] flex items-center gap-1.5 transition-colors underline-offset-4 hover:underline"
      >
        View accuracy data <span aria-hidden="true">→</span>
      </a>
      </div>
    </div>
  </section>
);
