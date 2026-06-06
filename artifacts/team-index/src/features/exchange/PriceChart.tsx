import React, { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { buildCandles, fmtPrice, type ExchangeMarket, type Timeframe } from "./data";

const TIMEFRAMES: Timeframe[] = ["1H", "4H", "1D", "1W"];
const GREEN = "#3FC86A";
const RED = "#FF5A5A";

export function PriceChart({ market }: { market: ExchangeMarket }) {
  const [tf, setTf] = useState<Timeframe>("1D");
  const candles = useMemo(() => buildCandles(market, tf), [market, tf]);

  const W = 1000;
  const H = 360;
  const padR = 56; // room for price axis on the right
  const volH = 64; // volume area at the bottom
  const padT = 12;
  const chartH = H - volH - padT;
  const plotW = W - padR;

  const { hi, lo, maxVol } = useMemo(() => {
    let hi = -Infinity;
    let lo = Infinity;
    let maxVol = 0;
    for (const c of candles) {
      hi = Math.max(hi, c.h);
      lo = Math.min(lo, c.l);
      maxVol = Math.max(maxVol, c.v);
    }
    const pad = (hi - lo) * 0.08 || hi * 0.05;
    return { hi: hi + pad, lo: lo - pad, maxVol };
  }, [candles]);

  const range = hi - lo || 1;
  const yOf = (price: number) => padT + ((hi - price) / range) * chartH;
  const n = candles.length;
  const slot = plotW / n;
  const bw = Math.max(2, slot * 0.6);

  const up = market.change24h >= 0;
  const lastY = yOf(market.price);

  // gridlines (price)
  const gridSteps = 5;
  const gridLines = Array.from({ length: gridSteps + 1 }, (_, i) => {
    const price = lo + (range * i) / gridSteps;
    return { price, y: yOf(price) };
  });

  return (
    <div className="rounded-2xl border border-[#2a2720] bg-[#12100B] flex flex-col">
      {/* Timeframe tabs */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#221f18]">
        <div className="flex items-center gap-1">
          {TIMEFRAMES.map((t) => (
            <button
              key={t}
              onClick={() => setTf(t)}
              className={cn(
                "h-7 px-3 rounded-md font-jura text-[11px] font-bold tracking-wider transition-colors",
                tf === t ? "bg-[#FEB413]/12 text-[#FEB413]" : "text-white/40 hover:text-white/70",
              )}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4 font-mono text-[11px] text-white/40">
          <span>O <span className="text-white/70">{fmtPrice(candles[0]?.o ?? 0)}</span></span>
          <span>H <span className="text-[#3FC86A]">{fmtPrice(Math.max(...candles.map((c) => c.h)))}</span></span>
          <span>L <span className="text-[#FF5A5A]">{fmtPrice(Math.min(...candles.map((c) => c.l)))}</span></span>
          <span>C <span className="text-white/70">{fmtPrice(market.price)}</span></span>
        </div>
      </div>

      {/* Chart */}
      <div className="p-2">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[300px] sm:h-[360px]" preserveAspectRatio="none">
          {/* horizontal gridlines + price labels */}
          {gridLines.map((g, i) => (
            <g key={i}>
              <line x1={0} y1={g.y} x2={plotW} y2={g.y} stroke="#ffffff" strokeOpacity={0.04} strokeWidth={1} />
              <text
                x={W - padR + 6}
                y={g.y + 3}
                fill="#ffffff"
                fillOpacity={0.35}
                fontSize={10}
                fontFamily="monospace"
              >
                {fmtPrice(g.price)}
              </text>
            </g>
          ))}

          {/* volume bars */}
          {candles.map((c, i) => {
            const x = i * slot + (slot - bw) / 2;
            const h = maxVol ? (c.v / maxVol) * (volH - 8) : 0;
            const cu = c.c >= c.o;
            return (
              <rect
                key={`v${i}`}
                x={x}
                y={H - h}
                width={bw}
                height={h}
                fill={cu ? GREEN : RED}
                fillOpacity={0.18}
              />
            );
          })}

          {/* candles */}
          {candles.map((c, i) => {
            const cx = i * slot + slot / 2;
            const x = i * slot + (slot - bw) / 2;
            const cu = c.c >= c.o;
            const color = cu ? GREEN : RED;
            const yO = yOf(c.o);
            const yC = yOf(c.c);
            const bodyTop = Math.min(yO, yC);
            const bodyH = Math.max(1, Math.abs(yC - yO));
            return (
              <g key={`c${i}`}>
                <line x1={cx} y1={yOf(c.h)} x2={cx} y2={yOf(c.l)} stroke={color} strokeWidth={1} />
                <rect x={x} y={bodyTop} width={bw} height={bodyH} fill={color} />
              </g>
            );
          })}

          {/* last price line */}
          <line
            x1={0}
            y1={lastY}
            x2={plotW}
            y2={lastY}
            stroke={up ? GREEN : RED}
            strokeWidth={1}
            strokeDasharray="4 4"
            strokeOpacity={0.6}
          />
          <rect x={W - padR} y={lastY - 8} width={padR} height={16} fill={up ? GREEN : RED} />
          <text
            x={W - padR + 4}
            y={lastY + 3}
            fill="#0D0A06"
            fontSize={10}
            fontWeight={700}
            fontFamily="monospace"
          >
            {fmtPrice(market.price)}
          </text>
        </svg>
      </div>
    </div>
  );
}
