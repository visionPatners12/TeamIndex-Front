import React from "react";

export const Footer: React.FC = () => (
  <footer className="w-full px-4 sm:px-10 lg:px-16 py-6 bg-[#0D0A06] border-t border-white/5">
    <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">

      {/* Logo */}
      <div className="flex items-center gap-2">
        <img
          src={import.meta.env.BASE_URL + "images/logo_img.svg"}
          alt="Pryzen logo"
          className="h-7 w-auto"
          style={{ clipPath: 'inset(0 83% 0 0)' }}
        />
        <div className="flex flex-col items-start leading-none">
          <span className="font-jura font-bold text-white text-sm tracking-wide">Pryzen</span>
          <div className="flex items-center gap-1">
            <span className="font-jura text-[10px] text-white/40 tracking-wide">Team Index</span>
            <span className="px-1 py-[1px] rounded text-[7px] font-jura font-bold uppercase tracking-wider bg-[#FEB413]/20 text-[#FEB413] border border-[#FEB413]/30 leading-none">Beta</span>
          </div>
        </div>
      </div>

      <p className="font-golos text-xs text-white/30 text-center sm:text-right">
        © {new Date().getFullYear()} Pryzen. All rights reserved.{" "}
        <span className="text-[#FEB413]">Powered by Polymarket. Built for fans.</span>
      </p>

    </div>
  </footer>
);
