import React from "react";
import { GradientHeading } from "@/components/ui/GradientHeading";
import { GoldButton } from "@/components/ui/GoldButton";
import chzLogo from "@assets/CHZ_1776150749884.png";

export const HeroTextBlock: React.FC = () => (
  <div className="w-full xl:flex-1 xl:min-w-0 flex flex-col gap-6">
    {/* Heading — gradient white → gold across two lines */}
    <GradientHeading
      as="h2"
      className="text-[38px] sm:text-[52px] lg:text-[63px] leading-[108%]"
      style={{ letterSpacing: "0.8px" }}
    >
      BACK THE TEAM.
      <br />
      SHARE THE UPSIDE.
    </GradientHeading>

    {/* Body */}
    <div className="flex flex-col gap-4">
      <p className="font-golos text-[16px] sm:text-[18px] leading-[1.6] text-white/70">
        Team Index gives fans a new way to back their favorite teams through a
        live team-based pool. Capital is deployed on Polymarket, across match
        markets and futures markets linked to the team.
      </p>
      <p className="font-golos text-[16px] sm:text-[18px] leading-[1.6] text-white/70">
        Instead of a one-off bet, you enter a dynamic index that evolves over
        time with team performance and market results.
      </p>
    </div>

    {/* CTA buttons */}
    <div className="flex flex-wrap gap-3 sm:gap-4 mt-2">
      <GoldButton className="text-sm sm:text-base">Explore Live Indexes</GoldButton>
      <button className="px-5 sm:px-7 py-3 sm:py-3.5 rounded-full border border-white/20 bg-white/5 text-white font-jura font-bold text-sm sm:text-base uppercase tracking-wide hover:bg-white/10 transition-all">
        How It Works
      </button>
    </div>

    {/* Partner badges */}
    <div className="flex flex-col gap-2 mt-2">
      <div className="flex items-center gap-2">
        <img
          src={import.meta.env.BASE_URL + "icons/polymart.svg"}
          alt="Polymarket"
          className="w-5 h-5"
        />
        <span className="font-golos text-sm text-white/50">
          Polymarket &nbsp;·&nbsp; Powered by Polymarket. Built for fans.
        </span>
      </div>
      <div className="flex items-center gap-2">
        <img
          src={chzLogo}
          alt="Chiliz"
          className="w-5 h-5 rounded-full"
        />
        <span className="font-golos text-sm text-white/50">
          Chiliz &nbsp;·&nbsp; Pay with CHZ & Fan Tokens on Chiliz Chain.
        </span>
      </div>
    </div>
  </div>
);
