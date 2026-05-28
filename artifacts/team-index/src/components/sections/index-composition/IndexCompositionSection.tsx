import React, { useEffect, useState } from "react";
import { GradientHeading } from "@/components/ui/GradientHeading";
import { Sparkline } from "@/features/pools/Sparkline";

type MarketKind = "future" | "game";
type Dir = "up" | "down" | "flat";

interface MarketDef {
  id: string;
  kind: MarketKind;
  label: string;
  /** Short context line (competition, date, …) */
  meta: string;
  /** Anchor probability (the index value is 1.00× when every market sits here). */
  baseProb: number;
}

interface Position extends MarketDef {
  /** Live share of the index, in percent. Positions + cash add up to 100. */
  weight: number;
  /** Live market probability ("odds"). */
  prob: number;
  dir: Dir;
}

/**
 * Illustrative starting markets that make up the Arsenal index. Each one is a
 * live prediction market with its own probability ("odds"). The index value is
 * a weighted blend of these markets, so when their odds move, the index moves.
 */
const INITIAL_MARKETS: (MarketDef & { weight: number })[] = [
  {
    id: "f-pl",
    kind: "future",
    label: "Will Arsenal win the Premier League?",
    meta: "Premier League · Season outright",
    weight: 28,
    baseProb: 0.42,
  },
  {
    id: "f-cl",
    kind: "future",
    label: "Will Arsenal win the Champions League?",
    meta: "Champions League · Outright (future)",
    weight: 16,
    baseProb: 0.18,
  },
  {
    id: "g-mci",
    kind: "game",
    label: "Arsenal vs Man City",
    meta: "Premier League · Sat 20:00",
    weight: 14,
    baseProb: 0.55,
  },
  {
    id: "g-liv",
    kind: "game",
    label: "Arsenal vs Liverpool",
    meta: "Premier League · Next week",
    weight: 12,
    baseProb: 0.6,
  },
  {
    id: "g-tot",
    kind: "game",
    label: "Arsenal vs Tottenham",
    meta: "Premier League · Derby",
    weight: 10,
    baseProb: 0.68,
  },
];

/** Pool of upcoming matches that get added when a live match settles. */
const UPCOMING_GAMES: Omit<MarketDef, "id">[] = [
  {
    kind: "game",
    label: "Arsenal vs Chelsea",
    meta: "Premier League · Upcoming",
    baseProb: 0.58,
  },
  {
    kind: "game",
    label: "Arsenal vs Newcastle",
    meta: "Premier League · Upcoming",
    baseProb: 0.62,
  },
  {
    kind: "game",
    label: "Arsenal vs Man United",
    meta: "Premier League · Upcoming",
    baseProb: 0.57,
  },
  {
    kind: "game",
    label: "Arsenal vs Brighton",
    meta: "Premier League · Upcoming",
    baseProb: 0.64,
  },
  {
    kind: "game",
    label: "Arsenal vs Aston Villa",
    meta: "Premier League · Upcoming",
    baseProb: 0.6,
  },
];

const BASE_VALUE = 1.24;
const INITIAL_CASH = 20;
const TICK_MS = 1400;
const EVENT_EVERY = 6; // ticks between market settlements (~8.4s)
const BANNER_TTL = 5; // ticks the settlement banner stays up
const NEW_TTL = 4; // ticks the "New" badge stays up

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));

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

/** Index value = cash (par × idle yield) + each market weighted by its odds. */
function computeValue(
  positions: Position[],
  cashWeight: number,
  cashFactor: number,
): number {
  let v = (cashWeight / 100) * BASE_VALUE * cashFactor;
  positions.forEach((p) => {
    v += (p.weight / 100) * BASE_VALUE * (p.prob / p.baseProb);
  });
  return v;
}

/** Scale position weights so that positions + cash always sum to 100%. */
function rebalance(positions: Position[], cashWeight: number): Position[] {
  const target = 100 - cashWeight;
  const sum = positions.reduce((s, p) => s + p.weight, 0) || 1;
  return positions.map((p) => ({ ...p, weight: (p.weight / sum) * target }));
}

interface LiveState {
  positions: Position[];
  cashWeight: number;
  cashFactor: number;
  cashDir: Dir;
  history: number[];
  event: { text: string; ttl: number } | null;
  newIds: Record<string, number>;
  tick: number;
  queueIdx: number;
}

function makeInitialState(): LiveState {
  const positions: Position[] = INITIAL_MARKETS.map((m) => ({
    ...m,
    prob: m.baseProb,
    dir: "flat",
  }));
  return {
    positions,
    cashWeight: INITIAL_CASH,
    cashFactor: 1,
    cashDir: "flat",
    history: [computeValue(positions, INITIAL_CASH, 1)],
    event: null,
    newIds: {},
    tick: 0,
    queueIdx: 0,
  };
}

/**
 * Drives the index over time: market odds random-walk, the cash buffer drifts
 * (idle yield + allocation), and every few seconds a match settles, is removed,
 * and a new upcoming match takes its place — with every weight readjusted so
 * the basket always sums to 100%. The index value is derived from all of it.
 */
function useLiveIndex() {
  const [state, setState] = useState<LiveState>(makeInitialState);

  useEffect(() => {
    const id = setInterval(() => {
      setState((prev) => {
        let positions = prev.positions.map((p) => ({ ...p }));
        let cashWeight = prev.cashWeight;
        let queueIdx = prev.queueIdx;
        const tick = prev.tick + 1;

        let event = prev.event ? { ...prev.event, ttl: prev.event.ttl - 1 } : null;
        if (event && event.ttl <= 0) event = null;
        const newIds: Record<string, number> = {};
        Object.entries(prev.newIds).forEach(([k, v]) => {
          if (v - 1 > 0) newIds[k] = v - 1;
        });

        // ── Lifecycle: settle the next match and open a new one ──
        if (tick % EVENT_EVERY === 0) {
          const closingIdx = positions.findIndex((p) => p.kind === "game");
          if (closingIdx !== -1) {
            const closed = positions[closingIdx];
            positions.splice(closingIdx, 1);
            // Proceeds from the settled match flow back into cash…
            cashWeight += closed.weight;
            // …then most of it is redeployed into a new upcoming match.
            const next = UPCOMING_GAMES[queueIdx % UPCOMING_GAMES.length];
            queueIdx += 1;
            const deploy = closed.weight * (0.8 + Math.random() * 0.3);
            cashWeight -= deploy;
            const newId = `g-${tick}`;
            positions.push({
              ...next,
              id: newId,
              weight: deploy,
              prob: next.baseProb,
              dir: "flat",
            });
            newIds[newId] = NEW_TTL;
            event = {
              text: `${closed.label} settled → cash · ${next.label} opened · weights rebalanced`,
              ttl: BANNER_TTL,
            };
          }
        }

        // ── Cash varies: small idle yield + allocation drift ──
        const cashFactor = clamp(
          prev.cashFactor + (Math.random() - 0.5) * 0.004 + (1 - prev.cashFactor) * 0.06,
          0.99,
          1.012,
        );
        const cashDir: Dir =
          cashFactor > prev.cashFactor + 0.0002
            ? "up"
            : cashFactor < prev.cashFactor - 0.0002
              ? "down"
              : "flat";
        cashWeight = clamp(cashWeight + (Math.random() - 0.5) * 0.9, 12, 28);

        // ── Market odds random-walk with mean reversion ──
        positions = positions.map((p) => {
          const drift = (Math.random() - 0.5) * 0.05;
          const pull = (p.baseProb - p.prob) * 0.08;
          const prob = clamp(p.prob + drift + pull, 0.05, 0.95);
          const dir: Dir =
            prob > p.prob + 0.0005
              ? "up"
              : prob < p.prob - 0.0005
                ? "down"
                : "flat";
          return { ...p, prob, dir };
        });

        // ── Readjust every weight so the basket sums to 100% ──
        positions = rebalance(positions, cashWeight);

        const value = computeValue(positions, cashWeight, cashFactor);
        const history = [...prev.history.slice(-39), value];

        return {
          positions,
          cashWeight,
          cashFactor,
          cashDir,
          history,
          event,
          newIds,
          tick,
          queueIdx,
        };
      });
    }, TICK_MS);
    return () => clearInterval(id);
  }, []);

  const value = state.history[state.history.length - 1];
  const changePct = ((value - BASE_VALUE) / BASE_VALUE) * 100;
  // The match that will settle next (first game position) is flagged "closing".
  const closingId = state.positions.find((p) => p.kind === "game")?.id ?? null;
  return {
    value,
    changePct,
    history: state.history,
    positions: state.positions,
    cashWeight: state.cashWeight,
    cashDir: state.cashDir,
    event: state.event,
    newIds: state.newIds,
    closingId,
  };
}

const DirArrow: React.FC<{ dir: Dir }> = ({ dir }) => {
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

const MarketRow: React.FC<{
  m: Position;
  isNew: boolean;
  isClosing: boolean;
}> = ({ m, isNew, isClosing }) => {
  const meta = KIND_META[m.kind];
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-[#232323] bg-[#18140F] px-3.5 py-3 sm:px-4 sm:py-3.5 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <span className="text-base leading-none mt-0.5 shrink-0" aria-hidden>
            {meta.icon}
          </span>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border shrink-0 ${meta.tagClass}`}
              >
                {meta.tag}
              </span>
              {isNew && (
                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border shrink-0 bg-[#FEB413]/20 text-[#FEB413] border-[#FEB413]/40">
                  New
                </span>
              )}
              {isClosing && !isNew && (
                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border shrink-0 bg-orange-500/15 text-orange-300 border-orange-500/30">
                  Closing soon
                </span>
              )}
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
          <span className="font-golos text-[10px] text-white/40 tabular-nums">
            {Math.round(m.weight)}% of index
          </span>
        </div>
      </div>
      <div className="h-1.5 w-full rounded-full bg-[#232323] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${m.weight}%`, backgroundColor: meta.barColor }}
        />
      </div>
    </div>
  );
};

export const IndexCompositionSection: React.FC = () => {
  const {
    value,
    changePct,
    history,
    positions,
    cashWeight,
    cashDir,
    event,
    newIds,
    closingId,
  } = useLiveIndex();
  const isPositive = changePct >= 0;
  const cashPct = Math.round(cashWeight);

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
          markets — when their odds move, the index moves. Matches settle and
          new ones open over time, and the cash buffer flexes to keep the basket
          balanced. Here is the Arsenal index live.
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
              plus a cash buffer ({cashPct}% right now). As odds tick up or down
              the value moves; when a match settles its weight returns to cash
              and a new match takes its place, so every percentage readjusts.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-3 flex flex-col gap-0.5">
              <span className="font-golos text-[11px] text-white/40">
                Markets in this index
              </span>
              <span className="font-jura font-bold text-xl text-white tabular-nums">
                {positions.length}
              </span>
            </div>
            <div className="rounded-xl border border-[#3FC86A]/25 bg-[#3FC86A]/10 px-3.5 py-3 flex flex-col gap-0.5">
              <span className="font-golos text-[11px] text-[#3FC86A]/90">
                Cash buffer
              </span>
              <span className="flex items-center gap-1.5 font-jura font-bold text-xl text-white tabular-nums">
                <DirArrow dir={cashDir} />
                {cashPct}%
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
            {positions.map((m) => (
              <div
                key={m.id}
                title={`${m.label} — ${Math.round(m.weight)}%`}
                className="transition-all duration-700"
                style={{
                  width: `${m.weight}%`,
                  backgroundColor: KIND_META[m.kind].barColor,
                }}
              />
            ))}
            <div
              title={`Cash buffer — ${cashPct}%`}
              className="transition-all duration-700"
              style={{ width: `${cashWeight}%`, backgroundColor: "#3FC86A" }}
            />
          </div>

          {/* Settlement / rebalance banner */}
          {event && (
            <div className="flex items-start gap-2 rounded-xl border border-[#FEB413]/30 bg-[#FEB413]/10 px-3.5 py-2.5">
              <span className="text-sm leading-none mt-0.5" aria-hidden>
                🔁
              </span>
              <span className="font-golos text-[11px] leading-snug text-[#FEB413]">
                {event.text}
              </span>
            </div>
          )}

          <div className="flex flex-col gap-2.5">
            {positions.map((m) => (
              <MarketRow
                key={m.id}
                m={m}
                isNew={Boolean(newIds[m.id])}
                isClosing={m.id === closingId}
              />
            ))}

            {/* Cash buffer — flexes as matches settle and reopen */}
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
                    Idle USDC · flexes as matches settle & reopen
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end shrink-0">
                <span className="flex items-center gap-1 font-jura font-bold text-sm text-white tabular-nums">
                  <DirArrow dir={cashDir} />
                  {cashPct}%
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
