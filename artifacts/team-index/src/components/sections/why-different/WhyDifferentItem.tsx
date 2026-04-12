import React from "react";

interface WhyDifferentItemProps {
  iconUrl: string;
  title: string;
  description: string;
  isLast?: boolean;
}

export const WhyDifferentItem: React.FC<WhyDifferentItemProps> = ({
  iconUrl,
  title,
  description,
  isLast = false,
}) => (
  <div className="flex gap-5">
    {/* Left: stepper column */}
    <div className="flex flex-col items-center w-5 shrink-0">
      {/* Top connector line — spans icon-box height so the dot lands at title level */}
      <div className="w-px h-[44px] shrink-0 bg-[#FEB413]/20" />

      {/* Circle ring with inner filled dot */}
      <div className="w-5 h-5 rounded-full border border-[#FEB413]/50 flex items-center justify-center shrink-0">
        <div className="w-2 h-2 rounded-full bg-[#FEB413] shadow-[0_0_6px_2px_rgba(254,180,19,0.5)]" />
      </div>

      {/* Bottom connector line — always shown, fades out on last item */}
      <div className={`w-px flex-1 bg-[#FEB413]/20 mt-1 ${isLast ? "opacity-40" : ""}`} />
    </div>

    {/* Right: icon box + title + description */}
    <div className={`flex flex-col gap-2 ${isLast ? "pb-0" : "pb-10"}`}>
      <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-1">
        <img src={iconUrl} alt="" className="w-6 h-6" />
      </div>
      <h3 className="font-jura font-bold text-sm tracking-widest uppercase text-white">
        {title}
      </h3>
      <p className="font-golos text-sm text-white/50 leading-relaxed">
        {description}
      </p>
    </div>
  </div>
);
