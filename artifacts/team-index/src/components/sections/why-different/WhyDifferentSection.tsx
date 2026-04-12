import React from "react";
import { GradientHeading } from "@/components/ui/GradientHeading";
import { WhyDifferentItem } from "./WhyDifferentItem";

const items = [
  {
    iconUrl: import.meta.env.BASE_URL + "icons/wif01.svg",
    title: "MORE THAN A ONE-MATCH BET",
    description: "Positions tied to upcoming games and direct team outcomes.",
  },
  {
    iconUrl: import.meta.env.BASE_URL + "icons/wif02.svg",
    title: "BACKED BY REAL MARKET EXPOSURE",
    description: "Capital is deployed on Polymarket, not held passively.",
  },
  {
    iconUrl: import.meta.env.BASE_URL + "icons/wif03.svg",
    title: "MATCH + FUTURES APPROACH",
    description:
      "The index can benefit from both short-term match opportunities and longer-term team conviction.",
  },
  {
    iconUrl: import.meta.env.BASE_URL + "icons/wif04.svg",
    title: "BUILT FOR FANS",
    description: "A simpler way to follow team momentum through a live product.",
  },
];

export const WhyDifferentSection: React.FC = () => (
  <section className="relative w-full py-20 px-4 sm:px-10 lg:px-[120px] bg-[#0D0A06]  overflow-hidden">
    {/* Background glow */}
    <img
      src={import.meta.env.BASE_URL + "icons/wif-bg.svg"}
      className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none opacity-60"
      alt=""
    />

    <div className="relative z-10 w-full grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-start">
      {/* Left: heading */}
      <div className="lg:sticky lg:top-32">
        <GradientHeading className="text-5xl md:text-6xl lg:text-7xl">
          WHY IT FEELS{" "}
          <br />
          DIFFERENT
        </GradientHeading>
      </div>

      {/* Right: stepper list */}
      <div className="flex flex-col">
        {items.map((item, i) => (
          <WhyDifferentItem
            key={item.title}
            iconUrl={item.iconUrl}
            title={item.title}
            description={item.description}
            isLast={i === items.length - 1}
          />
        ))}
      </div>
    </div>
  </section>
);
