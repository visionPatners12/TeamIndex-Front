import React from "react";
import { useTranslation } from "react-i18next";
import type { PoolData } from "@/types/pool";
import { fmtUsdShort } from "@/utils/pool";

interface IndexCardProps {
  pool?: PoolData | null;
}

export const IndexCard: React.FC<IndexCardProps> = ({ pool }) => {
  const { t } = useTranslation();
  const teamName = pool ? pool.team.toUpperCase() + " INDEX" : "ARSENAL INDEX";
  const symbol = pool ? `p${pool.symbol}` : "pAFC";
  const clubLabel = pool ? pool.team : "Arsenal F.C.";
  const initial = pool ? pool.symbol.charAt(0) : "A";
  const tokenValue = pool ? pool.tokenValue : 0;
  const holders = pool ? pool.holders : 0;
  const change = pool ? pool.change24h : 0;
  const isPositive = change >= 0;
  const isLive = pool ? pool.status !== "Closed" : true;
  const poolSize = pool ? pool.poolSize : 0;
  const poolCap = pool ? pool.poolCap : 0;
  const hasFiniteCap = pool ? !pool.capUnlimited && pool.poolCap > 0 : false;
  const fillPct = hasFiniteCap ? Math.min(100, Math.round((poolSize / poolCap) * 100)) : 0;

  return (
    <div className="w-105 xl:w-115 h-113.5 bg-[#504220] border border-white/10 rounded-[20px] p-8 flex flex-col gap-6 shadow-2xl">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-[#4c422a] flex items-center justify-center text-xl font-bold text-[#ffffff] shrink-0">
          {initial}
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-jura font-bold text-base text-white uppercase tracking-wide">
            {teamName}
          </span>
          <span className="font-golos text-xs text-white/50">{symbol} · {clubLabel}</span>
        </div>
        <span className={`ml-auto shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
          isLive
            ? "bg-green-500/15 border border-green-500/25 text-green-400"
            : "bg-red-500/15 border border-red-500/25 text-red-400"
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isLive ? "bg-green-400" : "bg-red-400"}`} />
          {isLive ? t('indexCard.live') : t('indexCard.closed')}
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="font-jura font-bold text-4xl text-white">
            {pool ? `$${tokenValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "--"}
          </span>
          {pool && (
            <span className={`font-golos text-base font-semibold ${isPositive ? "text-green-400" : "text-red-400"}`}>
              {isPositive ? "+" : ""}{change.toFixed(1)}%
            </span>
          )}
        </div>
        <span className="font-golos text-xs text-white/40">{t('indexCard.currentTokenValue')}</span>
      </div>

      <div className="flex gap-3">
        <div className="flex-1 bg-white/5 rounded-xl p-4 border border-white/8 flex flex-col items-start gap-1">
          <img
            src={import.meta.env.BASE_URL + "icons/users.svg"}
            alt="Holders"
            className="w-5 h-5 mb-0.5"
          />
          <span className="font-golos text-[11px] text-white/40">{t('indexCard.currentHolders')}</span>
          <span className="font-jura font-bold text-xl text-white">
            {pool ? holders.toLocaleString() : "--"}
          </span>
        </div>

        <div className="flex-1 bg-white/5 rounded-xl p-4 border border-white/8 flex flex-col items-start gap-1">
          <img
            src={import.meta.env.BASE_URL + "icons/upload.svg"}
            alt="Pool"
            className="w-5 h-5 mb-0.5"
          />
          <span className="font-golos text-[11px] text-white/40">{t('indexCard.poolFill')}</span>
          {pool && hasFiniteCap ? (
            <div className="w-full flex flex-col gap-1.5 mt-1">
              <span className="font-jura font-bold text-sm text-white">
                {fmtUsdShort(poolSize)} / {fmtUsdShort(poolCap)}
              </span>
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-[#FEB413] rounded-full" style={{ width: `${fillPct}%` }} />
              </div>
            </div>
          ) : (
            <span className="font-golos border p-2 border-[#7c7159] rounded-2xl text-sm font-semibold text-white/50">
              {pool ? fmtUsdShort(poolSize) : "--"}
            </span>
          )}
        </div>
      </div>

      <button className="w-full py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-jura font-bold text-base uppercase tracking-wide transition-all">
        {t('indexCard.enterPool')}
      </button>
    </div>
  );
};
