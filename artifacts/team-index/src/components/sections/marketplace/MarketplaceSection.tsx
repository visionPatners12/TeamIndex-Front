import React from "react";
import { GradientHeading } from "@/components/ui/GradientHeading";

export const MarketplaceSection: React.FC = () => (
  <section className="w-full py-20 px-4 sm:px-10 lg:px-30 bg-[#0D0A06]">
    <div className="w-full mx-auto flex flex-col items-center gap-10">
      <div className="flex flex-col items-center text-center gap-6 max-w-3xl">
        <div className="flex items-center gap-4 flex-wrap justify-center">
          <GradientHeading
            as="h2"
            className="text-[38px] sm:text-[52px] lg:text-[63px] leading-[108%]"
            style={{ letterSpacing: "0.8px" }}
          >
            MARKETPLACE
          </GradientHeading>
          <span className="px-4 py-1.5 rounded-full bg-[#FEB413]/15 border border-[#FEB413]/30 font-jura text-xs font-bold text-[#FEB413] uppercase tracking-wider self-center">
            Coming Soon
          </span>
        </div>

        <p className="font-golos text-white/80 text-lg max-w-2xl">
          A dedicated marketplace to trade Team Index tokens. Buy, sell, and
          swap your positions with other holders in real time.
        </p>
      </div>

      <div className="w-full max-w-4xl rounded-2xl border border-[#232323] bg-[#18140F] p-8 sm:p-12 flex flex-col items-center gap-8"
        style={{ boxShadow: "0 2px 24px 0 rgba(0,0,0,0.3)" }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full">
          <div className="flex flex-col items-center gap-3 p-6 rounded-xl bg-[#23201A] border border-[#2a2720]">
            <div className="w-12 h-12 rounded-full bg-[#FEB413]/10 border border-[#FEB413]/20 flex items-center justify-center">
              <span className="text-[#FEB413] text-xl font-bold">$</span>
            </div>
            <span className="font-jura text-sm font-bold text-white uppercase tracking-wide">Trade</span>
            <p className="font-golos text-xs text-white/50 text-center leading-relaxed">
              Buy and sell Team Index tokens directly on the marketplace
            </p>
          </div>

          <div className="flex flex-col items-center gap-3 p-6 rounded-xl bg-[#23201A] border border-[#2a2720]">
            <div className="w-12 h-12 rounded-full bg-[#FEB413]/10 border border-[#FEB413]/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-[#FEB413]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </div>
            <span className="font-jura text-sm font-bold text-white uppercase tracking-wide">Swap</span>
            <p className="font-golos text-xs text-white/50 text-center leading-relaxed">
              Swap between different Team Index positions instantly
            </p>
          </div>

          <div className="flex flex-col items-center gap-3 p-6 rounded-xl bg-[#23201A] border border-[#2a2720]">
            <div className="w-12 h-12 rounded-full bg-[#FEB413]/10 border border-[#FEB413]/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-[#FEB413]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <span className="font-jura text-sm font-bold text-white uppercase tracking-wide">Track</span>
            <p className="font-golos text-xs text-white/50 text-center leading-relaxed">
              Live order book, price history, and portfolio tracking
            </p>
          </div>
        </div>

        <button
          className="px-8 py-3 rounded-full text-sm font-semibold bg-[#23201A] text-[#555] border border-[#232323] cursor-not-allowed"
          disabled
        >
          Coming Soon
        </button>
      </div>
    </div>
  </section>
);
