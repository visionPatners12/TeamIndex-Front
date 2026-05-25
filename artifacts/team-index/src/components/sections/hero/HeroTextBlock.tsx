import React from "react";
import { useLocation } from "wouter";
import { BarChart2, ListChecks, Search } from "lucide-react";
import { GradientHeading } from "@/components/ui/GradientHeading";
import { GoldButton } from "@/components/ui/GoldButton";
import { scrollToId } from "@/utils/scroll";

const proofPoints = [
  "Index token = pool share",
  "Live pools by team",
  "Market exposure",
];

const BaseIcon: React.FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    fill="none"
    viewBox="0 0 24 24"
    className="h-5 w-5 shrink-0 rounded-sm"
    aria-hidden="true"
  >
    <path
      fill="#00F"
      d="M3 4.706c0-.585 0-.877.11-1.101.106-.215.28-.39.496-.495C3.83 3 4.122 3 4.706 3h14.588c.585 0 .876 0 1.101.11.215.105.389.28.494.495.111.225.111.517.111 1.101v14.588c0 .585 0 .876-.11 1.101-.106.215-.28.389-.495.494-.225.111-.517.111-1.101.111H4.706c-.585 0-.876 0-1.101-.11a1.08 1.08 0 0 1-.494-.495C3 20.17 3 19.878 3 19.294z"
    />
  </svg>
);

export const HeroTextBlock: React.FC = () => {
  const [, navigate] = useLocation();
  return (
  <div className="w-full xl:flex-1 xl:min-w-0 flex flex-col gap-5 sm:gap-6">
    <GradientHeading
      as="h1"
      className="text-[42px] sm:text-[58px] lg:text-[76px] leading-[96%]"
      style={{ letterSpacing: "0.8px" }}
    >
      TEAM INDEX
    </GradientHeading>

    <p className="font-jura font-semibold text-lg sm:text-2xl text-white uppercase tracking-wide">
      Back a team through a live market index.
    </p>

    <p className="font-golos text-[15px] sm:text-[18px] leading-[1.65] text-white/70 max-w-2xl">
      Choose an open team pool and enter during the live window. Your wallet
      receives an index token representing your share of that pool as it gains
      exposure to Polymarket markets linked to the team.
    </p>

    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 max-w-2xl">
      {proofPoints.map((point) => (
        <div
          key={point}
          className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2"
        >
          <ListChecks className="h-4 w-4 shrink-0 text-[#FEB413]" />
          <span className="font-golos text-xs sm:text-[13px] text-white/70">
            {point}
          </span>
        </div>
      ))}
    </div>

    <div className="flex flex-wrap gap-3 sm:gap-4 mt-2">
      <GoldButton className="text-sm sm:text-base" onClick={() => scrollToId("live-indexes")}>
        <Search className="w-4 h-4" />
        View Live Indexes
      </GoldButton>
      <button
        onClick={() => navigate("/dashboard")}
        className="px-5 sm:px-7 py-3 sm:py-3.5 rounded-full border border-[#FEB413]/40 bg-[#FEB413]/10 text-[#FEB413] font-jura font-bold text-sm sm:text-base uppercase tracking-wide hover:bg-[#FEB413]/20 transition-all flex items-center gap-2"
      >
        <BarChart2 className="w-4 h-4" />
        My Indexes
      </button>
      <button
        onClick={() => scrollToId("how-it-works")}
        className="px-5 sm:px-7 py-3 sm:py-3.5 rounded-full border border-white/20 bg-white/5 text-white font-jura font-bold text-sm sm:text-base uppercase tracking-wide hover:bg-white/10 transition-all"
      >
        How It Works
      </button>
    </div>

    <div className="flex flex-col gap-2 mt-2">
      <div className="flex items-center gap-2">
        <img
          src={import.meta.env.BASE_URL + "icons/polymart.svg"}
          alt="Polymarket"
          className="w-5 h-5"
        />
        <span className="font-golos text-sm text-white/50">
          Polymarket infrastructure for market exposure
        </span>
      </div>
      <div className="flex items-center gap-2">
        <BaseIcon />
        <span className="font-golos text-sm text-white/50">
          Supported by Base
        </span>
      </div>
    </div>
  </div>
  );
};
