import React from "react";

export type LiveIndexStatus = "open" | "closing soon" | "closed";

export type LiveIndexCardProps = {
  teamName: string;
  teamLogoUrl?: string;
  indexValue: number;
  change: number; // e.g. +2.5 or -1.3
  status: LiveIndexStatus;
  symbol?: string;
  holders?: number;
  poolFill?: string; // e.g. "71%"
  poolCap?: string; // e.g. "$200K"
  poolSize?: string; // e.g. "$142.5K"
  tags?: string[];
  buttonLabel?: string;
  disabled?: boolean;
  onEnter?: () => void;
};

const statusConfig: Record<LiveIndexStatus, { label: string; dotColor: string; textColor: string }> = {
  open: { label: "open", dotColor: "bg-green-500", textColor: "text-green-400" },
  "closing soon": { label: "closing soon", dotColor: "bg-yellow-400", textColor: "text-yellow-400" },
  closed: { label: "closed", dotColor: "bg-red-500", textColor: "text-red-400" },
};

export const LiveIndexCard: React.FC<LiveIndexCardProps> = ({
  teamName,
  teamLogoUrl,
  indexValue,
  change,
  status,
  symbol,
  holders,
  poolFill,
  poolCap,
  poolSize,
  tags = [],
  buttonLabel,
  disabled = false,
  onEnter,
}) => {
  const fillPercent = poolFill ? parseFloat(poolFill) : 0;
  const cfg = statusConfig[status];
  const isClosed = status === "closed";

  const resolvedButtonLabel =
    buttonLabel ?? (isClosed ? "Pool Closed" : status === "closing soon" ? "Enter Before Close" : "Enter Pool");

  return (
    <div
      className="flex flex-col rounded-[10px] border border-[#232323] bg-[#18140F] p-5 sm:p-[25px] w-full min-h-[340px] sm:min-h-[390px] gap-4 sm:gap-5"
      style={{ boxShadow: "0 2px 16px 0 rgba(0,0,0,0.25)" }}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        {teamLogoUrl ? (
          <img
            src={teamLogoUrl}
            alt={teamName + " logo"}
            className="w-10 h-10 rounded-full object-cover border border-[#232323] bg-[#23201A] shrink-0"
          />
        ) : (
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#23201A] border border-[#232323] text-lg font-bold text-[#ffffff] shrink-0">
            {teamName.charAt(0)}
          </div>
        )}
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-white font-bold text-base uppercase leading-tight tracking-wide truncate">
            {teamName}
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-[#B3B3B3] text-xs font-medium">{symbol}</span>
            <span className="text-[#B3B3B3] text-xs">•</span>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotColor} shrink-0`} />
            <span className={`text-xs font-medium ${cfg.textColor}`}>{cfg.label}</span>
          </div>
        </div>
      </div>

      {/* Token Value & Holders */}
      <div className="flex gap-2 sm:gap-3 w-full">
        <div className="flex-1 bg-[#23201A] min-h-[69px] rounded-lg px-2 sm:px-2.5 py-2 flex flex-col items-start min-w-0">
          <span className="text-[#B3B3B3] text-xs font-medium mb-1">TOKEN VALUE</span>
          <div className="flex flex-wrap gap-x-2 gap-y-0.5 items-center">
            <span className="text-white text-base font-bold">${indexValue.toFixed(2)}</span>
            <span className={`text-xs font-semibold ${change >= 0 ? "text-[#3FC86A]" : "text-[#FF5A5A]"}`}>
              {change >= 0 ? "+" : ""}
              {change.toFixed(1)}%
            </span>
          </div>
        </div>
        <div className="flex-1 bg-[#23201A] rounded-lg px-2 sm:px-2.5 py-2 flex flex-col items-start min-w-0">
          <span className="text-[#B3B3B3] text-xs font-medium mb-1">HOLDERS</span>
          <div className="flex items-center gap-2">
            <span className="text-white text-base font-bold">{holders ?? "--"}</span>
            <img src={import.meta.env.BASE_URL + "icons/signal.svg"} alt=""/>
          </div>
        </div>
      </div>

      {/* Pool Fill */}
      <div className="flex flex-col gap-1.5 w-full">
        <div className="flex items-center justify-between text-xs text-[#B3B3B3] font-medium">
          <span>POOL FILL</span>
          <span>
            <span className="text-white font-bold">{poolSize ?? "$142.5K"}</span>
            <span className="text-[#B3B3B3] font-normal"> / {poolCap ?? "$200K"}</span>
          </span>
        </div>
        <div className="w-full h-2 bg-[#232323] rounded-full overflow-hidden">
          <div
            className="h-2 bg-[#FEB413] rounded-full transition-all"
            style={{ width: `${fillPercent || 71}%` }}
          />
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 w-full">
        {tags.map((tag, i) => {
          const icon =
            tag === "USDC / CHZ"
              ? import.meta.env.BASE_URL + "icons/LTI_01.svg"
              : tag === "Gains Eligible"
              ? import.meta.env.BASE_URL + "icons/LTI_02.svg"
              : null;
          return (
            <span
              key={i}
              className="flex items-center gap-1 px-3 py-1 rounded-full bg-[#18140F] border border-[#232323] text-xs text-[#B3B3B3] font-medium"
            >
              {icon && <img src={icon} alt="" className="w-3 h-3 shrink-0" />}
              {tag}
            </span>
          );
        })}
      </div>

      {/* CTA Button */}
      <button
        className={`w-full h-10 mt-auto rounded-full text-base font-semibold transition-all ${
          disabled || isClosed
            ? "bg-[#23201A] text-[#555] border border-[#232323] cursor-not-allowed"
            : "bg-[#1e1b09] border border-white/10 text-white hover:bg-[#252010] active:scale-95"
        }`}
        disabled={disabled || isClosed}
        onClick={!disabled && !isClosed ? onEnter : undefined}
      >
        {resolvedButtonLabel}
      </button>
    </div>
  );
};

export default LiveIndexCard;
