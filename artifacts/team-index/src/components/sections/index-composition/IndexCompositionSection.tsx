import React, { useEffect, useMemo, useRef, useState } from "react";
import { GradientHeading } from "@/components/ui/GradientHeading";
import { Sparkline } from "@/features/pools/Sparkline";

type ConstituentKind = "future" | "game" | "cash";

interface Constituent {
  kind: ConstituentKind;
  label: string;
  /** Short context line (competition, date, …) */
  meta: string;
  /** Share of the index, in percent. All weights add up to 100. */
  weight: number;
}

/**
 * Illustrative breakdown of a single team index (Arsenal) so a new user can
 * see, at a glance, what an index actually holds: a basket of prediction
 * markets — long-term "futures" and individual games — plus a cash buffer.
 * Each line shows its weight (percentage) inside the index.
 */
const ARSENAL_CONSTITUENTS: Constituent[] = [
  {
    kind: "future",
    label: "Will Arsenal win the Premier League?",
    meta: "Premier League · Season outright",
    weight: 28,
  },
  {
    kind: "future",
    label: "Will Arsenal win the Champions League?",
    meta: "Champions League · Outright (future)",
    weight: 16,
  },
  {
    kind: "game",
    label: "Arsenal vs Man City",
    meta: "Premier League · Sat 20:00",
    weight: 14,
  },
  {
    kind: "game",
    label: "Arsenal vs Liverpool",
    meta: "Premier League · Next week",
    weight: 12,
  },
  {
    kind: "game",
    label: "Arsenal vs Tottenham",
    meta: "Premier League · Derby",
    weight: 10,
  },
  {
    kind: "cash",
    label: "Cash buffer",
    meta: "Idle USDC — kept liquid for rebalancing",
    weight: 20,
  },
];

const KIND_META: Record<
  ConstituentKind,
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
  cash: {
    tag: "Cash",
    icon: "💵",
    barColor: "#3FC86A",
    tagClass: "bg-green-500/15 text-green-300 border-green-500/30",
  },
};

const BASE_VALUE = 1.24;

/** Builds a gently drifting series so the index looks alive on the page. */
function useLiveIndexValue() {
  const [history, setHistory] = useState<number[]>(() => {
    const seed: number[] = [];
    let v = BASE_VALUE * 0.94;
    for (let i = 0; i < 28; i++) {
      v += (Math.random() - 0.45) * 0.012;
      seed.push(v);
    }
    return seed;
  });
  const startRef = useRef(history[0]);

  useEffect(() => {
    const id = setInterval(() => {
      setHistory((prev) => {
        const last = prev[prev.length - 1];
        const next = Math.max(
          BASE_VALUE * 0.85,
          last + (Math.random() - 0.46) * 0.018,
        );
        return [...prev.slice(1), next];
      });
    }, 1400);
    return () => clearInterval(id);
  }, []);

  const value = history[history.length - 1];
  const changePct = ((value - startRef.current) / startRef.current) * 100;
  return { value, changePct, history };
}

const ConstituentRow: React.FC<{ c: Constituent }> = ({ c }) => {
  const meta = KIND_META[c.kind];
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
                {c.label}
              </span>
            </div>
            <span className="font-golos text-[11px] text-white/45 mt-0.5 truncate">
              {c.meta}
            </span>
          </div>
        </div>
        <span className="font-jura font-bold text-base text-white shrink-0">
          {c.weight}%
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-[#232323] overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${c.weight}%`, backgroundColor: meta.barColor }}
        />
      </div>
    </div>
  );
};

export const IndexCompositionSection: React.FC = () => {
  const { value, changePct, history } = useLiveIndexValue();
  const isPositive = changePct >= 0;

  const cashWeight = useMemo(
    () => ARSENAL_CONSTITUENTS.find((c) => c.kind === "cash")?.weight ?? 0,
    [],
  );
  const marketCount = ARSENAL_CONSTITUENTS.filter((c) => c.kind !== "cash").length;

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
          markets about that team. Its value moves as those markets move. Here
          is the Arsenal index — every line shows its weight inside the index.
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
              Live index value — updates as its markets move
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

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-3 flex flex-col gap-0.5">
              <span className="font-golos text-[11px] text-white/40">
                Markets in this index
              </span>
              <span className="font-jura font-bold text-xl text-white">
                {marketCount}
              </span>
            </div>
            <div className="rounded-xl border border-[#3FC86A]/25 bg-[#3FC86A]/10 px-3.5 py-3 flex flex-col gap-0.5">
              <span className="font-golos text-[11px] text-[#3FC86A]/90">
                Cash buffer
              </span>
              <span className="font-jura font-bold text-xl text-white">
                {cashWeight}%
              </span>
            </div>
          </div>
        </div>

        {/* ── Right: the composition / weights ──────────────────────────── */}
        <div className="flex flex-col gap-4 rounded-[16px] border border-[#232323] bg-[#0F0D09]/60 p-6 sm:p-7">
          <div className="flex items-center justify-between">
            <span className="font-jura font-bold text-sm text-white uppercase tracking-wider">
              What this index holds
            </span>
            <span className="font-golos text-[11px] text-white/40">
              Weights add up to 100%
            </span>
          </div>

          {/* Stacked weight bar */}
          <div className="flex w-full h-3 rounded-full overflow-hidden border border-white/10">
            {ARSENAL_CONSTITUENTS.map((c, i) => (
              <div
                key={i}
                title={`${c.label} — ${c.weight}%`}
                style={{
                  width: `${c.weight}%`,
                  backgroundColor: KIND_META[c.kind].barColor,
                }}
              />
            ))}
          </div>

          <div className="flex flex-col gap-2.5">
            {ARSENAL_CONSTITUENTS.map((c, i) => (
              <ConstituentRow key={i} c={c} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default IndexCompositionSection;
