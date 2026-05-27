import React from "react";
import { HowItWorksStep } from "./HowItWorksStep";
import { GradientHeading } from "@/components/ui/GradientHeading";

const steps = [
  {
    number: "01",
    title: "CHOOSE A TEAM POOL",
    description:
      "Pick a live index linked to a team and review the pool value before entering.",
  },
  {
    number: "02",
    title: "RECEIVE YOUR INDEX TOKEN",
    description:
      "Your deposit mints an index token. That token is your on-chain share of the pool.",
  },
  {
    number: "03",
    title: "TRACK YOUR SHARE AS THE POOL MOVES",
    description:
      "When the pool value changes, your share value changes with it.",
  },
];

export const HowItWorksSection: React.FC = () => (
  <section
    className="w-full flex flex-col items-center py-16 sm:py-20 px-4 sm:px-10 lg:px-30 gap-10 sm:gap-14"
    style={{
      background:
        "radial-gradient(141.42% 70.71% at 50% 0%, rgba(254, 180, 19, 0.08) 0%, rgba(254, 180, 19, 0.00) 60%)",
    }}
  >
    <GradientHeading
      as="h2"
      className="text-[38px] sm:text-[52px] xl:text-[63px] leading-[108%] text-center"
      style={{ letterSpacing: "0.8px" }}
    >
      HOW IT WORKS
    </GradientHeading>
    <p className="font-golos text-sm sm:text-base text-white/60 max-w-2xl text-center leading-relaxed -mt-6">
      An index token is your on-chain share of a team pool. When the pool value
      changes, your share value changes with it.
    </p>
    <div className="relative grid grid-cols-1 sm:grid-cols-3 gap-10 xl:gap-15 w-full max-w-6xl">
      {/* Dashed connector line with gradient color */}
      <div
        className="hidden xl:block absolute left-0 right-0 top-6 h-px z-0"
        style={{
          background: "linear-gradient(90deg, rgba(255,255,255,0.01) 0%, rgba(255,255,255,0.10) 46.15%, rgba(255,255,255,0.01) 100%)",
          maskImage: "repeating-linear-gradient(90deg, black 0px, black 6px, transparent 6px, transparent 12px)",
          WebkitMaskImage: "repeating-linear-gradient(90deg, black 0px, black 6px, transparent 6px, transparent 12px)",
        }}
      />
      {steps.map((step) => (
        <div
          key={step.number}
          className="relative z-10 flex flex-col items-center"
        >
          <HowItWorksStep {...step} />
        </div>
      ))}
    </div>
  </section>
);
