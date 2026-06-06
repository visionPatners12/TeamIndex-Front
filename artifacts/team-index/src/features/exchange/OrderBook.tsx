import React from "react";
import { ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtPrice, fmtSize, type ExchangeMarket, type OrderBook as Book, type OrderRow } from "./data";

function Row({
  row,
  side,
  onClick,
}: {
  row: OrderRow;
  side: "bid" | "ask";
  onClick: (price: number) => void;
}) {
  const color = side === "bid" ? "text-[#3FC86A]" : "text-[#FF5A5A]";
  const bar = side === "bid" ? "bg-[#3FC86A]/8" : "bg-[#FF5A5A]/8";
  return (
    <button
      onClick={() => onClick(row.price)}
      className="relative grid grid-cols-3 items-center px-3 h-[22px] w-full text-left hover:bg-white/[0.04] transition-colors"
    >
      <div className={cn("absolute inset-y-0 right-0 rounded-sm", bar)} style={{ width: `${row.depth}%` }} />
      <span className={cn("relative font-mono text-[11px]", color)}>{fmtPrice(row.price)}</span>
      <span className="relative font-mono text-[11px] text-white/60 text-right">{fmtSize(row.size)}</span>
      <span className="relative font-mono text-[11px] text-white/35 text-right">{fmtSize(row.total)}</span>
    </button>
  );
}

export function OrderBook({
  book,
  market,
  onPickPrice,
  className,
}: {
  book: Book;
  market: ExchangeMarket;
  onPickPrice: (price: number) => void;
  className?: string;
}) {
  const up = market.change24h >= 0;
  return (
    <div className={cn("flex flex-col rounded-2xl border border-[#2a2720] bg-[#12100B] overflow-hidden", className)}>
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#221f18]">
        <span className="font-jura text-xs font-bold uppercase tracking-wider text-white">Order Book</span>
        <span className="font-mono text-[10px] text-white/35">USDC</span>
      </div>

      <div className="grid grid-cols-3 px-3 py-1.5 text-[10px] font-jura font-bold uppercase tracking-wider text-white/30">
        <span>Price</span>
        <span className="text-right">Size</span>
        <span className="text-right">Total</span>
      </div>

      {/* Asks (reversed so best ask sits next to the spread) */}
      <div className="flex flex-col-reverse">
        {book.asks.map((r, i) => (
          <Row key={`a${i}`} row={r} side="ask" onClick={onPickPrice} />
        ))}
      </div>

      {/* Spread / last */}
      <div className="flex items-center justify-between px-3 py-2 my-0.5 bg-[#0D0A06] border-y border-[#221f18]">
        <span className={cn("flex items-center gap-1 font-mono text-base font-bold", up ? "text-[#3FC86A]" : "text-[#FF5A5A]")}>
          {up ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />}
          {fmtPrice(book.mid)}
        </span>
        <span className="font-mono text-[10px] text-white/40">
          Spread {fmtPrice(book.spread)} ({book.spreadPct}%)
        </span>
      </div>

      {/* Bids */}
      <div className="flex flex-col">
        {book.bids.map((r, i) => (
          <Row key={`b${i}`} row={r} side="bid" onClick={onPickPrice} />
        ))}
      </div>
    </div>
  );
}
