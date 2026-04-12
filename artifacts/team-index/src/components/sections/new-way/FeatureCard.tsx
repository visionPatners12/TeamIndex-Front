import React from "react";

interface FeatureCardProps {
  icon: string; // path to icon in public/icons
  title: string;
  description: string;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => (
  <div className="flex flex-col items-start bg-[#1e1b09] rounded-2xl p-8 gap-4 w-full max-w-[500px] min-h-[200px] border border-[#2e2a0f]">
    <div className="w-12 h-12 rounded-xl bg-[#FEB413]/10 flex items-center justify-center mb-2">
      <img src={icon} alt="" className="w-7 h-7" />
    </div>
    <div className="font-jura font-bold text-2xl text-white tracking-widest uppercase mb-1">{title}</div>
    <div className="font-golos text-base text-white/80 leading-relaxed">{description}</div>
  </div>
);
