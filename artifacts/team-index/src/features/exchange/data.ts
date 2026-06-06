/**
 * Exchange data layer.
 *
 * The Team Index Marketplace teased on the landing page is a dedicated order-book
 * exchange for index tokens (deposit USDC → mint index shares → trade them).
 * There is no live matching-engine backend yet, so this module turns the real
 * pool list (or a branded fallback) into a believable, *deterministic* market:
 * seeded OHLC candles, a two-sided order book, a recent-trades tape and a set of
 * the user's open orders. Deterministic seeding means re-renders are stable while
 * each market still looks distinct; a `tick` argument lets callers nudge the book
 * so prices feel alive without the numbers jumping around randomly.
 */

import type { PoolData } from "@/types/pool";
import { formatPoolName } from "@/utils/pool";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ExchangeMarket {
  id: string;
  /** Bare ticker, e.g. "AFC" */
  symbol: string;
  /** Trading pair label, e.g. "pAFC/USDC" */
  pair: string;
  /** Branded index name, e.g. "Pryzen Arsenal FC Index" */
  name: string;
  /** Live secondary-market price (what people pay right now). Order book + chart track this. */
  price: number;
  /** Alias of `price` for readability at call sites. */
  marketPrice: number;
  /** Intrinsic redeemable value per share (vault NAV). The market can trade above/below this. */
  nav: number;
  /** Signed % the market price sits above (+) or below (−) NAV. */
  premiumPct: number;
  /** True when redeem-at-NAV is paused (capital deployed / pool paused) → exchange is the only exit. */
  redeemLocked: boolean;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  holders: number;
  sparkline: number[];
}

export interface OrderRow {
  price: number;
  size: number;
  total: number;
  /** 0–100, depth bar fill relative to the deepest level on this side */
  depth: number;
}

export interface OrderBook {
  bids: OrderRow[];
  asks: OrderRow[];
  spread: number;
  spreadPct: number;
  mid: number;
}

export interface Candle {
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

export interface TapeTrade {
  id: string;
  price: number;
  size: number;
  side: "buy" | "sell";
  time: string;
}

export type OrderSide = "buy" | "sell";
export type OrderType = "market" | "limit";
export type OrderStatus = "open" | "partial" | "filled" | "cancelled";

export interface OpenOrder {
  id: string;
  pair: string;
  side: OrderSide;
  type: OrderType;
  price: number;
  size: number;
  filled: number;
  status: OrderStatus;
  time: string;
}

// ─── Seeded PRNG (mulberry32) ───────────────────────────────────────────────────

function hashSeed(str: string): number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Markets ────────────────────────────────────────────────────────────────────

/** Branded fallback markets so the exchange never looks empty pre-backend. */
const FALLBACK_MARKETS: Array<{ team: string; symbol: string; price: number; holders: number }> = [
  { team: "Arsenal FC", symbol: "AFC", price: 1.0842, holders: 1284 },
  { team: "Real Madrid", symbol: "RMA", price: 1.2615, holders: 2071 },
  { team: "Manchester City", symbol: "MCI", price: 0.9873, holders: 1542 },
  { team: "Liverpool FC", symbol: "LFC", price: 1.1408, holders: 1733 },
  { team: "FC Barcelona", symbol: "BAR", price: 1.0521, holders: 1896 },
  { team: "Bayern Munich", symbol: "BAY", price: 1.1937, holders: 1187 },
  { team: "Paris Saint-Germain", symbol: "PSG", price: 0.9412, holders: 1448 },
  { team: "Inter Milan", symbol: "INT", price: 1.0233, holders: 824 },
];

function deriveSymbol(p: PoolData): string {
  const raw = (p.symbol || p.team || "IDX").replace(/[^a-zA-Z0-9]/g, "");
  return raw.slice(0, 4).toUpperCase() || "IDX";
}

function buildMarket(opts: {
  id: string;
  team: string;
  symbol: string;
  /** Intrinsic NAV per share (from the vault / pool token value). */
  nav: number;
  holders: number;
  redeemLocked?: boolean;
}): ExchangeMarket {
  const rng = mulberry32(hashSeed(opts.id + opts.symbol));
  const nav = opts.nav > 0 ? opts.nav : 1;

  // Market trades at a premium/discount to NAV (fan demand skews slightly positive,
  // wider discount possible when redeem is locked and the exchange is the only exit).
  const redeemLocked = opts.redeemLocked ?? rng() < 0.4;
  const premiumPct = +(((rng() - (redeemLocked ? 0.62 : 0.42)) * (redeemLocked ? 18 : 11))).toFixed(2);
  const marketPrice = +(nav * (1 + premiumPct / 100)).toFixed(4);

  const change24h = +((rng() - 0.45) * 9).toFixed(2);
  const spread = marketPrice * (0.004 + rng() * 0.01);
  const high24h = +(marketPrice * (1 + 0.01 + rng() * 0.04)).toFixed(4);
  const low24h = +(marketPrice * (1 - 0.01 - rng() * 0.04)).toFixed(4);
  const volume24h = Math.round((50_000 + rng() * 1_900_000) * (1 + opts.holders / 2000));

  // sparkline that lands on the current market price
  const spark: number[] = [];
  let v = marketPrice * (1 - change24h / 100);
  for (let i = 0; i < 24; i++) {
    v += (marketPrice - v) * 0.12 + (rng() - 0.5) * spread * 1.5;
    spark.push(+v.toFixed(4));
  }
  spark.push(marketPrice);

  return {
    id: opts.id,
    symbol: opts.symbol,
    pair: `p${opts.symbol}/USDC`,
    name: formatPoolName(opts.team),
    price: marketPrice,
    marketPrice,
    nav: +nav.toFixed(4),
    premiumPct,
    redeemLocked,
    change24h,
    high24h,
    low24h,
    volume24h,
    holders: opts.holders,
    sparkline: spark,
  };
}

/** Map real pools → markets, padding with branded fallbacks so the book feels full. */
export function buildMarkets(pools: PoolData[] | undefined): ExchangeMarket[] {
  const fromPools = (pools ?? [])
    .filter((p) => p.status !== "Closed")
    .map((p) =>
      buildMarket({
        id: p.id,
        team: p.team,
        symbol: deriveSymbol(p),
        nav: p.tokenValue > 0 ? p.tokenValue : 1,
        holders: p.holders || 0,
        // "Closing Soon" pools have most capital deployed → redeem effectively locked.
        redeemLocked: p.status === "Closing Soon" ? true : undefined,
      }),
    );

  const usedSymbols = new Set(fromPools.map((m) => m.symbol));
  const padding = FALLBACK_MARKETS.filter((f) => !usedSymbols.has(f.symbol)).map((f) =>
    buildMarket({ id: `fallback-${f.symbol}`, team: f.team, symbol: f.symbol, nav: f.price, holders: f.holders }),
  );

  const all = [...fromPools, ...padding];
  return all.length ? all : padding;
}

// ─── Order book ─────────────────────────────────────────────────────────────────

export function buildOrderBook(market: ExchangeMarket, tick = 0, levels = 11): OrderBook {
  const rng = mulberry32(hashSeed(market.id) + tick * 2654435761);
  const drift = (rng() - 0.5) * market.price * 0.0006 * (tick % 7);
  const mid = market.price + drift;
  const step = Math.max(0.0001, mid * 0.0006);

  const make = (dir: -1 | 1): OrderRow[] => {
    const rows: OrderRow[] = [];
    let runningTotal = 0;
    for (let i = 1; i <= levels; i++) {
      const price = +(mid + dir * step * i).toFixed(4);
      const size = Math.round((400 + rng() * 14_000) / (1 + i * 0.12));
      runningTotal += size;
      rows.push({ price, size, total: runningTotal, depth: 0 });
    }
    const maxTotal = rows[rows.length - 1].total || 1;
    rows.forEach((r) => (r.depth = Math.round((r.total / maxTotal) * 100)));
    return rows;
  };

  const asks = make(1);
  const bids = make(-1);
  const bestBid = bids[0].price;
  const bestAsk = asks[0].price;
  const spread = +(bestAsk - bestBid).toFixed(4);
  const spreadPct = +((spread / mid) * 100).toFixed(3);

  return { bids, asks, spread, spreadPct, mid: +mid.toFixed(4) };
}

// ─── Candles ────────────────────────────────────────────────────────────────────

export type Timeframe = "1H" | "4H" | "1D" | "1W";

const TF_COUNT: Record<Timeframe, number> = { "1H": 60, "4H": 56, "1D": 60, "1W": 52 };

export function buildCandles(market: ExchangeMarket, tf: Timeframe): Candle[] {
  const rng = mulberry32(hashSeed(market.id + tf));
  const count = TF_COUNT[tf];
  const vol = market.price * (tf === "1H" ? 0.006 : tf === "4H" ? 0.012 : tf === "1D" ? 0.02 : 0.035);

  const candles: Candle[] = [];
  // walk backward from current price so the last close == market.price
  let close = market.price;
  const closes: number[] = [close];
  for (let i = 0; i < count - 1; i++) {
    close = close / (1 + (rng() - 0.5) * vol * 2);
    closes.push(close);
  }
  closes.reverse();

  for (let i = 0; i < count; i++) {
    const o = i === 0 ? closes[0] * (1 - (rng() - 0.5) * vol) : candles[i - 1].c;
    const c = closes[i];
    const wick = vol * market.price * (0.4 + rng());
    const h = Math.max(o, c) + rng() * wick;
    const l = Math.min(o, c) - rng() * wick;
    const v = Math.round(20_000 + rng() * 180_000);
    candles.push({
      o: +o.toFixed(4),
      h: +h.toFixed(4),
      l: +Math.max(0.0001, l).toFixed(4),
      c: +c.toFixed(4),
      v,
    });
  }
  return candles;
}

// ─── Trade tape ─────────────────────────────────────────────────────────────────

export function buildTape(market: ExchangeMarket, tick = 0, count = 24): TapeTrade[] {
  const rng = mulberry32(hashSeed(market.id) + tick * 40503);
  const now = Date.now();
  const trades: TapeTrade[] = [];
  for (let i = 0; i < count; i++) {
    const side: OrderSide = rng() > 0.5 ? "buy" : "sell";
    const jitter = (rng() - 0.5) * market.price * 0.0016;
    const price = +(market.price + jitter).toFixed(4);
    const size = Math.round(50 + rng() * 6_000);
    const t = new Date(now - i * (4000 + rng() * 9000));
    trades.push({
      id: `${tick}-${i}`,
      price,
      size,
      side,
      time: t.toLocaleTimeString([], { hour12: false }),
    });
  }
  return trades;
}

// ─── User open orders (demo) ────────────────────────────────────────────────────

export function buildOpenOrders(markets: ExchangeMarket[]): OpenOrder[] {
  if (!markets.length) return [];
  const rng = mulberry32(hashSeed("open-orders"));
  const pick = (n: number) => markets[Math.floor(rng() * markets.length) % markets.length] ?? markets[0];

  const orders: OpenOrder[] = [];
  const n = Math.min(4, markets.length + 1);
  for (let i = 0; i < n; i++) {
    const m = pick(i);
    const side: OrderSide = rng() > 0.5 ? "buy" : "sell";
    const price = +(m.price * (side === "buy" ? 0.97 - rng() * 0.03 : 1.03 + rng() * 0.03)).toFixed(4);
    const size = Math.round(200 + rng() * 4000);
    const filled = Math.round(size * rng() * 0.6);
    orders.push({
      id: `ord-${i}-${m.symbol}`,
      pair: m.pair,
      side,
      type: "limit",
      price,
      size,
      filled,
      status: filled > 0 ? "partial" : "open",
      time: new Date(Date.now() - i * 3_600_000).toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    });
  }
  return orders;
}

// ─── Formatters ─────────────────────────────────────────────────────────────────

export function fmtPrice(n: number): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 });
}

export function fmtSize(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export function fmtUsd(n: number): string {
  if (!Number.isFinite(n)) return "$0";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}
