import React from "react";

export const Footer: React.FC = () => (
  <footer className="w-full px-4 sm:px-10 lg:px-16 py-6 bg-[#0D0A06] border-t border-white/5">
    <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">

      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <img
          src={import.meta.env.BASE_URL + "images/logo_img.svg"}
          alt="Team Index logo"
          className="h-8 w-auto"
        />
      </div>

      {/* Copyright */}
      <p className="font-golos text-xs text-white/30 text-center sm:text-right">
        © {new Date().getFullYear()} Team Index. All rights reserved.{" "}
        <span className="text-[#FEB413]">Powered by Polymarket. Built for fans.</span>
      </p>

    </div>
  </footer>
);
