import React from "react";
import { cn } from "@/lib/utils";

interface GoldButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  backgroundImage?: string;
}

export const GoldButton: React.FC<GoldButtonProps> = ({ children, className, backgroundImage = "images/btnBg.png", ...props }) => (
  <button
    type="button"
    className={cn(
      "group relative isolate bg-transparent cursor-pointer min-h-12 lg:min-h-14 inline-flex items-center justify-center text-sm lg:text-base leading-normal px-6 font-semibold text-black",
      className
    )}
    {...props}
  >
    <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
    <img
      src={import.meta.env.BASE_URL + backgroundImage}
      className="absolute top-0.5 left-0 w-full h-full group-hover:saturate-200 transition-all duration-500 select-none pointer-events-none"
      style={{ zIndex: -1 }}
      alt=""
    />
  </button>
);
