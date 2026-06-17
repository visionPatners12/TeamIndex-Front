import React from "react";

interface HowItWorksStepProps {
  number: string;
  title: string;
  description: string;
}

export const HowItWorksStep: React.FC<HowItWorksStepProps> = ({ number, title, description }) => (
  <div className="group relative flex flex-col min-w-0 w-full h-full rounded-2xl border border-white/10 bg-white/[0.02] p-7 sm:p-8 transition-all duration-300 hover:border-[#FEB413]/40 hover:bg-[#FEB413]/[0.04]">
    <div className="flex items-center gap-4 mb-6">
      <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-[#23201a] text-[#FEB413] text-xl font-bold font-jura ring-1 ring-[#FEB413]/20 transition-colors duration-300 group-hover:bg-[#FEB413] group-hover:text-[#0D0A06]">
        {number}
      </div>
      <span className="h-px flex-1 bg-gradient-to-r from-[#FEB413]/30 to-transparent" />
    </div>
    <div className="uppercase tracking-widest text-base xl:text-lg font-jura font-bold text-white mb-3">{title}</div>
    <div className="text-sm xl:text-base text-white/70 leading-relaxed">{description}</div>
  </div>
);
