import React from "react";

export const HeroSection: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <section className="relative w-full min-h-[calc(92svh-28px)] sm:min-h-[calc(96svh-28px)] md:min-h-screen flex items-center justify-center overflow-hidden bg-[#0D0A06]">
    {/* Premium sports-market background */}
    <img
      src={import.meta.env.BASE_URL + "images/hero-premium-market-v2.png"}
      alt=""
      className="absolute inset-0 w-full h-full object-cover object-[58%_center] sm:object-[60%_center] md:object-[62%_center] z-0 pointer-events-none select-none"
      aria-hidden="true"
    />
    <div
      className="absolute inset-0 z-[1] pointer-events-none"
      style={{
        background:
          "linear-gradient(90deg, rgba(13,10,6,0.97) 0%, rgba(13,10,6,0.9) 34%, rgba(13,10,6,0.5) 66%, rgba(13,10,6,0.78) 100%)",
      }}
    />
    <div
      className="absolute inset-0 z-[2] pointer-events-none"
      style={{
        background:
          "linear-gradient(180deg, rgba(13,10,6,0.52) 0%, rgba(13,10,6,0.16) 42%, rgba(13,10,6,0.95) 100%)",
      }}
    />
    <div
      className="absolute inset-0 z-[3] pointer-events-none opacity-55"
      style={{
        background:
          "radial-gradient(circle at 70% 44%, rgba(254,180,19,0.18) 0%, rgba(254,180,19,0.06) 25%, transparent 58%)",
      }}
    />
    <div className="relative z-10 w-full px-4 sm:px-6 lg:px-30 flex flex-col md:flex-row items-center justify-between gap-7 md:gap-8 xl:gap-16 pt-24 pb-8 sm:pt-30 sm:pb-12 xl:py-27">
      {children}
    </div>
  </section>
);
