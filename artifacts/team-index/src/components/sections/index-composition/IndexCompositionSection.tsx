import React, { useEffect, useState } from "react";
import { GradientHeading } from "@/components/ui/GradientHeading";
import { Sparkline } from "@/features/pools/Sparkline";

type MarketKind = "future" | "game";

interface MarketDef {
  kind: MarketKind;
  label: string;
  /** Short context line (competition, date, …) */
  meta: string;
  /** Share of the index, in percent. Market weights + cash add up to 100. */
  weight: number;
  /** Anchor probability (the index value is 1.00× when every market sits here). */
  baseProb: number;
}

/**
 * Illustrative markets that make up the Arsenal index. Each one is a live
 * prediction market with its own probability ("odds"). The index value is a
 * weighted blend of these markets, so when their odds move, the index moves.
 */
const MARKETS: MarketDef[] = [
  {
    kind: "future",
    label: "Will Arsenal win the Premier League?",
    meta: "Premier League · Season outright",
    weight: 28,
    baseProb: 0.42,
  },
  {
    kind: "future",
    label: "Will Arsenal win the Champions League?",
    meta: "Champions League · Outright (future)",
    weight: 16,
    baseProb: 0.18,
  },
  {
    kind: "game",
    label: "Arsenal vs Man City",
    meta: "Premier League · Sat 20:00",
    weight: 14,
    baseProb: 0.55,
  },
  {
    kind: "game",
    label: "Arsenal vs Liverpool",
    meta: "Premier League · Next week",
    weight: 12,
    baseProb: 0.6,
  },
  {
    kind: "game",
    label: "Arsenal vs Tottenham",
    meta: "Premier League · Derby",
    weight: 10,
    baseProb: 0.68,
  },
];

const CASH_WEIGHT = 100 - MARKETS.reduce((s, m) => s + m.weight, 0);
const BASE_VALUE = 1.24;

const KIND_META: Record<
  MarketKind,
  { tag: string; icon: string; barColor: string; tagClass: string }
> = {
  future: {
    tag: "Future",
    icon: "🏆",
    barColor: "#A855F7",
    tagClass: "bg-purple-500/15 text-purple-300 border-purple-500/30",
  },
  game: {
    tag: "Match",
    icon: "⚽",
    barColor: "#3FA9F5",
    tagClass: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  },
};

/** Index value = cash (held at par) + each market weighted by how its odds moved. */
function computeValue(probs: number[]): number {
  let v = (CASH_WEIGHT / 100) * BASE_VALUE;
  MARKETS.forEach((m, i) => {
    v += (m.weight / 100) * BASE_VALUE * (probs[i] / m.baseProb);
  });
  return v;
}

interface LiveMarket extends MarketDef {
  prob: number;
  dir: "up" | "down" | "flat";
}

interface LiveState {
  probs: number[];
  dirs: LiveMarket["dir"][];
  history: number[];
}

const INITIAL_PROBS = MARKETS.map((m) => m.baseProb);

/**
 * Drives every market's probability with a gentle random walk and derives the
 * index value from them, so the value visibly reacts to the markets moving.
 */
function useLiveIndex() {
  const [state, setState] = useState<LiveState>(() => ({
    probs: INITIAL_PROBS,
    dirs: MARKETS.map(() => "flat" as const),
    history: [computeValue(INITIAL_PROBS)],
  }));

  useEffect(() => {
    const id = setInterval(() => {
      setState((prev) => {
        const probs = prev.probs.map((p, i) => {
          const drift = (Math.random() - 0.5) * 0.05;
          // Pull gently back toward the anchor so it wanders without escaping.
          const pull = (MARKETS[i].baseProb - p) * 0.08;
          return Math.min(0.95, Math.max(0.05, p + drift + pull));
        });
        const dirs: LiveMarket["dir"][] = probs.map((p, i) =>
          p > prev.probs[i] + 0.0005
            ? "up"
            : p < prev.probs[i] - 0.0005
              ? "down"
              : "flat",
        );
        const history = [...prev.history.slice(-39), computeValue(probs)];
        return { probs, dirs, history };
      });
    }, 1400);
    return () => clearInterval(id);
  }, []);

  const value = state.history[state.history.length - 1];
  const changePct = ((value - BASE_VALUE) / BASE_VALUE) * 100;
  const markets: LiveMarket[] = MARKETS.map((m, i) => ({
    ...m,
    prob: state.probs[i],
    dir: state.dirs[i],
  }));
  return { value, changePct, history: state.history, markets };
}

const DirArrow: React.FC<{ dir: LiveMarket["dir"] }> = ({ dir }) => {
  if (dir === "flat")
    return <span className="text-white/40 text-xs font-bold">→</span>;
  const up = dir === "up";
  return (
    <span
      className={`text-xs font-bold ${up ? "text-[#3FC86A]" : "text-[#FF5A5A]"}`}
    >
      {up ? "▲" : "▼"}
    </span>
  );
};

const MarketRow: React.FC<{ m: LiveMarket }> = ({ m }) => {
  const meta = KIND_META[m.kind];
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-[#232323] bg-[#18140F] px-3.5 py-3 sm:px-4 sm:py-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <span className="text-base leading-none mt-0.5 shrink-0" aria-hidden>
            {meta.icon}
          </span>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border shrink-0 ${meta.tagClass}`}
              >
                {meta.tag}
              </span>
              <span className="font-golos text-sm font-semibold text-white truncate">
                {m.label}
              </span>
            </div>
            <span className="font-golos text-[11px] text-white/45 mt-0.5 truncate">
              {m.meta}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end shrink-0">
          {/* Live market odds — these move and drive the index value */}
          <span className="flex items-center gap-1 font-jura font-bold text-sm text-white tabular-nums">
            <DirArrow dir={m.dir} />
            {Math.round(m.prob * 100)}%
          </span>
          <span className="font-golos text-[10px] text-white/40">
            {m.weight}% of index
          </span>
        </div>
      </div>
      <div className="h-1.5 w-full rounded-full bg-[#232323] overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${m.weight}%`, backgroundColor: meta.barColor }}
        />
      </div>
    </div>
  );
};

export const IndexCompositionSection: React.FC = () => {
  const { value, changePct, history, markets } = useLiveIndex();
  const isPositive = changePct >= 0;

  return (
    <section
      id="inside-an-index"
      className="w-full flex flex-col items-center py-14 sm:py-20 px-4 sm:px-10 lg:px-30 gap-10 sm:gap-12"
      style={{
        background:
          "radial-gradient(141.42% 70.71% at 50% 0%, rgba(254, 180, 19, 0.07) 0%, rgba(254, 180, 19, 0.00) 60%)",
      }}
    >
      <div className="flex flex-col items-center gap-3 text-center">
        <GradientHeading
          as="h2"
          className="text-[34px] sm:text-[48px] xl:text-[58px] leading-[108%]"
          style={{ letterSpacing: "0.8px" }}
        >
          WHAT&apos;S INSIDE AN INDEX
        </GradientHeading>
        <p className="font-golos text-sm sm:text-base text-white/60 max-w-2xl leading-relaxed">
          A team index is a single token backed by a basket of prediction
          markets about that team. Its value is a weighted blend of those
          markets — when their odds move, the index moves. Here is the Arsenal
          index live.
        </p>
      </div>

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* ── Left: the live, varying index value ───────────────────────── */}
        <div className="flex flex-col gap-5 rounded-[16px] border border-white/[0.12] bg-[#0F0D09]/80 p-6 sm:p-7 shadow-[0_24px_70px_rgba(0,0,0,0.45)] ring-1 ring-[#FEB413]/10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-[#FEB413]/12 border border-[#FEB413]/20 flex items-center justify-center shrink-0 overflow-hidden p-2">
              <img
                src={import.meta.env.BASE_URL + "images/logo_img.svg"}
                alt="Arsenal index"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-jura font-bold text-base text-white uppercase tracking-wide">
                ARSENAL INDEX
              </span>
              <span className="font-golos text-xs text-white/50">
                pAFC · Arsenal F.C.
              </span>
            </div>
            <span className="ml-auto shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-green-500/15 border border-green-500/25 text-green-400">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Live
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-end gap-2">
              <span className="font-jura font-bold text-4xl sm:text-5xl text-white tabular-nums">
                ${value.toFixed(2)}
              </span>
              <span
                className={`font-golos text-base font-semibold mb-1 ${
                  isPositive ? "text-[#3FC86A]" : "text-[#FF5A5A]"
                }`}
              >
                {isPositive ? "+" : ""}
                {changePct.toFixed(2)}%
              </span>
            </div>
            <span className="font-golos text-xs text-white/40">
              Live index value — recomputed from its markets below
            </span>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <Sparkline
              data={history}
              color={isPositive ? "#3FC86A" : "#FF5A5A"}
              width={460}
              height={96}
              className="w-full h-24"
            />
          </div>

          <div className="rounded-xl border border-[#FEB413]/20 bg-[#FEB413]/10 px-4 py-3">
            <p className="font-jura text-[11px] font-bold uppercase tracking-wider text-[#FEB413]">
              How the value moves
            </p>
            <p className="mt-1 font-golos text-xs leading-relaxed text-white/55">
              Index value = weighted blend of every market&apos;s live odds,
              plus a {CASH_WEIGHT}% cash buffer held at par. As the odds on the
              right tick up or down, the value above moves with them.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-3 flex flex-col gap-0.5">
              <span className="font-golos text-[11px] text-white/40">
                Markets in this index
              </span>
              <span className="font-jura font-bold text-xl text-white">
                {MARKETS.length}
              </span>
            </div>
            <div className="rounded-xl border border-[#3FC86A]/25 bg-[#3FC86A]/10 px-3.5 py-3 flex flex-col gap-0.5">
              <span className="font-golos text-[11px] text-[#3FC86A]/90">
                Cash buffer
              </span>
              <span className="font-jura font-bold text-xl text-white">
                {CASH_WEIGHT}%
              </span>
            </div>
          </div>
        </div>

        {/* ── Right: the composition / live market odds ─────────────────── */}
        <div className="flex flex-col gap-4 rounded-[16px] border border-[#232323] bg-[#0F0D09]/60 p-6 sm:p-7">
          <div className="flex items-center justify-between">
            <span className="font-jura font-bold text-sm text-white uppercase tracking-wider">
              Markets driving the index
            </span>
            <span className="font-golos text-[11px] text-white/40">
              Live odds · weight
            </span>
          </div>

          {/* Stacked weight bar */}
          <div className="flex w-full h-3 rounded-full overflow-hidden border border-white/10">
            {markets.map((m, i) => (
              <div
                key={i}
                title={`${m.label} — ${m.weight}%`}
                style={{
                  width: `${m.weight}%`,
                  backgroundColor: KIND_META[m.kind].barColor,
                }}
              />
            ))}
            <div
              title={`Cash buffer — ${CASH_WEIGHT}%`}
              style={{ width: `${CASH_WEIGHT}%`, backgroundColor: "#3FC86A" }}
            />
          </div>

          <div className="flex flex-col gap-2.5">
            {markets.map((m, i) => (
              <MarketRow key={i} m={m} />
            ))}

            {/* Cash buffer — stable, does not move the index */}
            <div className="flex items-center justify-between gap-3 rounded-xl border border-[#3FC86A]/25 bg-[#3FC86A]/[0.07] px-3.5 py-3 sm:px-4">
              <div className="flex items-start gap-2.5 min-w-0">
                <span className="text-base leading-none mt-0.5 shrink-0" aria-hidden>
                  💵
                </span>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border shrink-0 bg-green-500/15 text-green-300 border-green-500/30">
                      Cash
                    </span>
                    <span className="font-golos text-sm font-semibold text-white truncate">
                      Cash buffer
                    </span>
                  </div>
                  <span className="font-golos text-[11px] text-white/45 mt-0.5 truncate">
                    Idle USDC · held at par, keeps the index stable
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end shrink-0">
                <span className="font-jura font-bold text-sm text-white tabular-nums">
                  {CASH_WEIGHT}%
                </span>
                <span className="font-golos text-[10px] text-white/40">
                  of index
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default IndexCompositionSection;
