import React from "react";

interface HowItWorksStepProps {
  number: string;
  title: string;
  description: string;
}

export const HowItWorksStep: React.FC<HowItWorksStepProps> = ({ number, title, description }) => (
  <div className="flex flex-col items-center min-w-0 w-full">
    <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-[#23201a] text-[#FEB413] text-xl font-bold mb-6">
      {number}
    </div>
    <div className="uppercase tracking-widest text-base xl:text-lg font-jura font-bold text-white mb-2 text-center">{title}</div>
    <div className="text-sm xl:text-base text-white/70 text-center">{description}</div>
  </div>
);
