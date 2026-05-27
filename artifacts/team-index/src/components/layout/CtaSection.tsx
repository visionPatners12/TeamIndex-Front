import React from "react";

interface CtaSectionProps {
  onExplore?: () => void;
}

export const CtaSection: React.FC<CtaSectionProps> = ({ onExplore }) => (
  <section className="w-full px-4 sm:px-8 lg:px-16 py-16 bg-[#0D0A06]">
    <div
      className="w-full rounded-3xl px-8 sm:px-16 lg:px-24 py-20 sm:py-28 flex flex-col items-center gap-6 text-center"
      style={{ backgroundColor: "#FEB413" }}
    >
      {/* Heading */}
      <h2 className="font-jura font-bold text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-black uppercase tracking-wide leading-tight max-w-3xl">
        CHOOSE A TEAM POOL. RECEIVE YOUR INDEX TOKEN. TRACK YOUR SHARE.
      </h2>

      {/* Subtitle */}
      <p className="font-golos text-black/60 text-sm sm:text-base">
        One token, one clear share of a live team pool.
      </p>

      {/* Button */}
      <button
        onClick={onExplore}
        className="mt-2 px-8 py-3 rounded-full bg-white text-black font-golos font-semibold text-sm hover:bg-white/90 active:scale-95 transition-all shadow-md"
      >
        View Live Indexes
      </button>
    </div>
  </section>
);
