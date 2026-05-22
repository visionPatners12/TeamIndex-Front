import React from "react";
import { GradientHeading } from "@/components/ui/GradientHeading";
const steps = [
  { number: "01", label: "Pick a team." },
  { number: "02", label: "Enter the index." },
  { number: "03", label: "Track performance." },
  { number: "04", label: "Exit when you want." },
];

export const SimpleSmartSection: React.FC = () => (
  <section
    className="w-full py-24 px-4 sm:px-10 lg:px-30"
    style={{
      background:
        "radial-gradient(ellipse at 50% 50%, rgba(254, 180, 19, 0.10) 0%, rgba(254, 180, 19, 0.00) 70%), #0D0A06",
    }}
  >
    <div className="w-full flex flex-col items-center gap-10 text-center">

      {/* Heading — two-tone: white + gold */}
      <GradientHeading
        as="h2"
        className="text-[32px] sm:text-5xl lg:text-7xl leading-tight"
        style={{ letterSpacing: "0.8px" }}
      >
        <span>SIMPLE ON THE SURFACE. SMART </span>
        <span>UNDERNEATH.</span>
      </GradientHeading>

      {/* Subtitle */}
      <p className="font-golos text-sm text-white/50 -mt-4">
        For the user, Team Index is simple.
      </p>

      {/* Steps — individual pill cards */}
      <div className="w-full flex flex-col sm:flex-row gap-4">
        {steps.map((step) => (
          <div
            key={step.number}
            className="flex-1 flex items-center gap-3 px-5 py-4 rounded-full border border-[#3f392b] bg-[#292313]"
          >
            <span className="shrink-0 inline-flex items-center justify-center p-3 rounded-2xl border border-white/10 bg-white/5 font-jura font-bold text-md text-[#FEB413]">
              {step.number}
            </span>
            <span className="font-golos text-sm text-white/70 leading-snug text-left">
              {step.label}
            </span>
          </div>
        ))}
      </div>

      {/* Body */}
      <p className="font-golos text-sm text-white/30 max-w-xl leading-relaxed">
        Underneath, the pool is deployed on Polymarket match and futures markets to create a more
        dynamic fan product.
      </p>

    </div>
  </section>
);
