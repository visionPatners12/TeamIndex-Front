import React from "react";
import { FeatureCard } from "./FeatureCard";
import { GradientHeading } from "@/components/ui/GradientHeading";

export const NewWaySection: React.FC = () => (
  <section className="relative w-full bg-[#0D0A06] py-16 sm:py-24 px-4 sm:px-10 lg:px-30 flex flex-col items-center gap-10 sm:gap-14 overflow-hidden">
    {/* Golden radial glow — top center */}

    <GradientHeading className="relative text-5xl md:text-6xl text-center">
      A NEW WAY TO BACK YOUR TEAM
    </GradientHeading>

    <div className="relative flex flex-col items-center gap-4 -mt-4">
      <p className="font-golos text-base text-white/70 text-center max-w-xl leading-relaxed">
        Team Index turns fan conviction into a live position. You choose a team, enter its index, and gain exposure to a pool that is actively placed on Polymarket sports markets.
      </p>
      <p className="font-golos text-sm text-white/50 text-center">That exposure can include:</p>
    </div>

    <div className="relative flex flex-col md:flex-row gap-6 w-full max-w-4xl justify-center items-stretch">
      <FeatureCard
        icon={import.meta.env.BASE_URL + "icons/anw01.svg"}
        title="MATCH MARKETS"
        description="Positions tied to upcoming games and direct team outcomes."
      />
      <FeatureCard
        icon={import.meta.env.BASE_URL + "icons/anw02.svg"}
        title="MATCH MARKETS"
        description="Longer-term positions tied to the team's broader season path, momentum, or performance outlook."
      />
    </div>

    <p className="relative font-golos text-white/40 text-sm text-center max-w-lg">
      This makes Team Index more dynamic than a single bet and more engaging over time.
    </p>
  </section>
);
