import React from "react";

export const HeroSection: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <section className="relative w-full min-h-[calc(100svh-28px)] md:min-h-screen flex items-center justify-center overflow-hidden bg-[#0D0A06]">
    {/* Premium sports-market background */}
    <img
      src={import.meta.env.BASE_URL + "images/hero-premium-market.png"}
      alt=""
      className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none select-none"
      style={{ objectPosition: "62% center" }}
      aria-hidden="true"
    />
    <div
      className="absolute inset-0 z-[1] pointer-events-none"
      style={{
        background:
          "linear-gradient(90deg, rgba(13,10,6,0.96) 0%, rgba(13,10,6,0.82) 38%, rgba(13,10,6,0.46) 72%, rgba(13,10,6,0.74) 100%)",
      }}
    />
    <div
      className="absolute inset-0 z-[2] pointer-events-none"
      style={{
        background:
          "linear-gradient(180deg, rgba(13,10,6,0.46) 0%, rgba(13,10,6,0.12) 42%, rgba(13,10,6,0.92) 100%)",
      }}
    />
    <div
      className="absolute inset-0 z-[3] pointer-events-none opacity-55"
      style={{
        background:
          "radial-gradient(circle at 72% 42%, rgba(254,180,19,0.16) 0%, rgba(254,180,19,0.05) 24%, transparent 58%)",
      }}
    />
    <div className="relative z-10 w-full px-4 sm:px-6 lg:px-30 flex flex-col md:flex-row items-center justify-between gap-8 md:gap-8 xl:gap-16 pt-28 pb-10 sm:pt-32 sm:pb-14 xl:py-27">
      {children}
    </div>
  </section>
);
