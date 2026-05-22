import React from "react";
import { cn } from "@/lib/utils";

interface GradientHeadingProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  as?: "h1" | "h2" | "h3" | "h4";
}

export const GradientHeading: React.FC<GradientHeadingProps> = ({
  children,
  className,
  style,
  as: Tag = "h2",
}) => (
  <Tag
    className={cn("font-jura font-bold uppercase tracking-wide leading-tight", className)}
    style={{
      background: "linear-gradient(180deg, #FFF 18.48%, #FEB413 100%)",
      backgroundClip: "text",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      ...style,
    }}
  >
    {children}
  </Tag>
);
