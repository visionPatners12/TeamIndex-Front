import React, { useEffect, useMemo, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { motion } from "framer-motion";
import { Radio } from "lucide-react";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { GradientHeading } from "@/components/ui/GradientHeading";
import { cn } from "@/lib/utils";
import { usePools } from "@/hooks/use-pools";

import {
  buildMarkets,
  buildOrderBook,
  buildTape,
  buildOpenOrders,
  type ExchangeMarket,
  type OpenOrder,
  type OrderSide,
  type OrderType,
} from "@/features/exchange/data";
import { MarketList } from "@/features/exchange/MarketList";
import { MarketHeader } from "@/features/exchange/MarketHeader";
import { PriceChart } from "@/features/exchange/PriceChart";
import { OrderBook } from "@/features/exchange/OrderBook";
import { TradePanel } from "@/features/exchange/TradePanel";
import { RecentTrades } from "@/features/exchange/RecentTrades";
import { OrdersPanel } from "@/features/exchange/OrdersPanel";

type MobileTab = "chart" | "book" | "trade";

let orderSeq = 0;

export default function Exchange() {
  const { ready, authenticated, login } = usePrivy();
  const { data: backendPools } = usePools();

  const markets = useMemo(() => buildMarkets(backendPools), [backendPools]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Keep a valid selection as markets load in.
  useEffect(() => {
    if (markets.length && (!selectedId || !markets.some((m) => m.id === selectedId))) {
      setSelectedId(markets[0].id);
    }
  }, [markets, selectedId]);

  const market: ExchangeMarket | undefined =
    markets.find((m) => m.id === selectedId) ?? markets[0];

  // Liveness: nudge the book / tape on an interval so the screen breathes.
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 2500);
    return () => clearInterval(id);
  }, []);

  const book = useMemo(() => (market ? buildOrderBook(market, tick) : null), [market, tick]);
  const tape = useMemo(() => (market ? buildTape(market, tick) : []), [market, tick]);

  // Order book click → prefill the trade panel's limit price.
  const [prefillPrice, setPrefillPrice] = useState<number | null>(null);
  const pickPrice = (p: number) => setPrefillPrice(p + Math.random() * 1e-9); // force effect re-run

  // Demo balances + open orders (no matching-engine backend yet).
  const usdcBalance = authenticated ? 12_500 : 0;
  const tokenBalance = authenticated ? 3_200 : 0;

  const [userOrders, setUserOrders] = useState<OpenOrder[]>([]);
  const [cancelledIds, setCancelledIds] = useState<Set<string>>(new Set());
  const seededOrders = useMemo(() => (authenticated ? buildOpenOrders(markets) : []), [authenticated, markets]);
  const openOrders = useMemo(
    () => [
      ...userOrders,
      ...seededOrders.filter(
        (s) => !cancelledIds.has(s.id) && !userOrders.some((u) => u.id === s.id),
      ),
    ],
    [userOrders, seededOrders, cancelledIds],
  );
  const [history, setHistory] = useState<OpenOrder[]>([]);

  const placeOrder = (o: { side: OrderSide; type: OrderType; price: number; size: number }) => {
    if (!market) return;
    const order: OpenOrder = {
      id: `user-${++orderSeq}-${Date.now()}`,
      pair: market.pair,
      side: o.side,
      type: o.type,
      price: o.price,
      size: o.size,
      filled: o.type === "market" ? o.size : 0,
      status: o.type === "market" ? "filled" : "open",
      time: new Date().toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
    };
    if (o.type === "market") setHistory((h) => [order, ...h]);
    else setUserOrders((u) => [order, ...u]);
  };

  const cancelOrder = (id: string) => {
    const found = openOrders.find((o) => o.id === id);
    if (found) setHistory((h) => [{ ...found, status: "cancelled" }, ...h]);
    setCancelledIds((s) => new Set(s).add(id));
    setUserOrders((u) => u.filter((o) => o.id !== id));
  };

  const [mobileTab, setMobileTab] = useState<MobileTab>("chart");

  if (!market || !book) {
    return (
      <div className="min-h-screen bg-[#0D0A06] flex items-center justify-center text-white/40 font-golos">
        Loading exchange…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0A06] selection:bg-[#FEB413]/30 selection:text-white flex flex-col">
      <div className="fixed top-0 inset-x-0 z-[60] bg-[#FEB413] text-[#0D0A06] text-center py-1 font-jura font-bold text-[10px] sm:text-xs uppercase tracking-widest">
        ⚠️ Mainnet Test — This is a live test environment
      </div>
      <Navbar topOffset />

      <main className="flex-1 pt-28 sm:pt-32 pb-16 px-3 sm:px-6 lg:px-10 xl:px-16 flex flex-col gap-5">
        {/* Title */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div className="flex flex-col gap-1.5">
            <GradientHeading as="h1" className="text-[32px] sm:text-[42px] leading-tight">
              EXCHANGE
            </GradientHeading>
            <p className="font-golos text-white/55 text-sm max-w-2xl">
              Trade Team Index tokens with live order matching. Buy, sell and swap
              your positions against USDC.
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#3FC86A]/10 border border-[#3FC86A]/25 w-fit">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-[#3FC86A] opacity-60 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#3FC86A]" />
            </span>
            <span className="font-jura text-[11px] font-bold uppercase tracking-wider text-[#3FC86A]">
              Live · Beta
            </span>
          </div>
        </div>

        {/* Mobile tab switcher */}
        <div className="grid grid-cols-3 gap-1.5 lg:hidden rounded-xl bg-[#12100B] border border-[#2a2720] p-1.5">
          {(["chart", "book", "trade"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setMobileTab(t)}
              className={cn(
                "h-9 rounded-lg font-jura text-xs font-bold uppercase tracking-wider transition-colors capitalize",
                mobileTab === t ? "bg-[#FEB413]/12 text-[#FEB413]" : "text-white/40",
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Trading grid */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="grid grid-cols-1 lg:grid-cols-[260px_1fr_300px] xl:grid-cols-[280px_1fr_320px] gap-3 lg:gap-4 items-start"
        >
          {/* Left — market list (desktop only) */}
          <MarketList
            markets={markets}
            selectedId={market.id}
            onSelect={(m) => setSelectedId(m.id)}
            className="hidden lg:flex h-[640px]"
          />

          {/* Center column */}
          <div className="flex flex-col gap-3 lg:gap-4 min-w-0">
            <MarketHeader market={market} />

            <div className={cn(mobileTab !== "chart" && "hidden lg:block")}>
              <PriceChart market={market} />
            </div>

            {/* Book + recent trades — visible on mobile under "book" */}
            <div className={cn("lg:hidden", mobileTab !== "book" && "hidden")}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <OrderBook book={book} market={market} onPickPrice={pickPrice} className="h-[520px]" />
                <RecentTrades trades={tape} className="h-[520px]" />
              </div>
            </div>

            {/* Trade panel — visible on mobile under "trade" */}
            <div className={cn("lg:hidden", mobileTab !== "trade" && "hidden")}>
              <TradePanel
                market={market}
                prefillPrice={prefillPrice}
                usdcBalance={usdcBalance}
                tokenBalance={tokenBalance}
                authenticated={ready && authenticated}
                onLogin={login}
                onPlaceOrder={placeOrder}
              />
            </div>

            <OrdersPanel
              openOrders={openOrders}
              history={history}
              trades={tape}
              authenticated={ready && authenticated}
              onCancel={cancelOrder}
              onLogin={login}
            />
          </div>

          {/* Right column — book + trade panel (desktop) */}
          <div className="hidden lg:flex flex-col gap-4">
            <OrderBook book={book} market={market} onPickPrice={pickPrice} />
            <TradePanel
              market={market}
              prefillPrice={prefillPrice}
              usdcBalance={usdcBalance}
              tokenBalance={tokenBalance}
              authenticated={ready && authenticated}
              onLogin={login}
              onPlaceOrder={placeOrder}
            />
            <RecentTrades trades={tape} className="h-[320px]" />
          </div>
        </motion.div>

        {/* Mobile market list at the bottom */}
        <MarketList
          markets={markets}
          selectedId={market.id}
          onSelect={(m) => setSelectedId(m.id)}
          className="lg:hidden h-[420px]"
        />

        <p className="flex items-center justify-center gap-2 text-center font-golos text-[11px] text-white/30 pt-2">
          <Radio className="w-3 h-3" />
          Demo market data shown while the matching engine is in beta. Balances and
          fills are simulated.
        </p>
      </main>

      <Footer />
    </div>
  );
}
