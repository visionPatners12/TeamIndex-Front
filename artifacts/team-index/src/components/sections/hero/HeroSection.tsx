import React from "react";

export const HeroSection: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <section className="relative w-full min-h-[calc(100svh-28px)] md:min-h-screen flex items-center justify-center overflow-hidden bg-[#0D0A06]">
    {/* Background pattern */}
    <img
      src={import.meta.env.BASE_URL + "images/home-bg-pattern.svg"}
      alt="Background pattern"
      className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none select-none"
      aria-hidden="true"
    />
    <div className="relative z-10 w-full px-4 sm:px-6 lg:px-30 flex flex-col md:flex-row items-center justify-between gap-8 md:gap-8 xl:gap-16 pt-28 pb-10 sm:pt-32 sm:pb-14 xl:py-27">
      {children}
    </div>
  </section>
);
