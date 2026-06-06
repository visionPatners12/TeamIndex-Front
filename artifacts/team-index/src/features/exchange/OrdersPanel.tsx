import React, { useState } from "react";
import { X, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtPrice, fmtSize, type OpenOrder, type TapeTrade } from "./data";

type Tab = "open" | "history" | "trades";

export function OrdersPanel({
  openOrders,
  history,
  trades,
  authenticated,
  onCancel,
  onLogin,
}: {
  openOrders: OpenOrder[];
  history: OpenOrder[];
  trades: TapeTrade[];
  authenticated: boolean;
  onCancel: (id: string) => void;
  onLogin: () => void;
}) {
  const [tab, setTab] = useState<Tab>("open");

  const tabs: Array<{ id: Tab; label: string; count?: number }> = [
    { id: "open", label: "Open Orders", count: openOrders.length },
    { id: "history", label: "Order History" },
    { id: "trades", label: "Trade History" },
  ];

  return (
    <div className="flex flex-col rounded-2xl border border-[#2a2720] bg-[#12100B] overflow-hidden">
      <div className="flex items-center gap-1 px-2 border-b border-[#221f18]">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "relative h-10 px-3 font-jura text-[12px] font-bold uppercase tracking-wider transition-colors",
              tab === t.id ? "text-white" : "text-white/35 hover:text-white/60",
            )}
          >
            {t.label}
            {typeof t.count === "number" && t.count > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-[#FEB413]/15 text-[#FEB413] text-[10px]">
                {t.count}
              </span>
            )}
            {tab === t.id && <span className="absolute bottom-0 inset-x-2 h-0.5 bg-[#FEB413] rounded-full" />}
          </button>
        ))}
      </div>

      <div className="min-h-[160px] max-h-[260px] overflow-auto">
        {!authenticated ? (
          <Empty
            label="Connect your wallet to see your orders"
            cta="Connect Wallet"
            onCta={onLogin}
          />
        ) : tab === "trades" ? (
          <TradeTable trades={trades} />
        ) : tab === "history" ? (
          <OrderTable orders={history} />
        ) : openOrders.length === 0 ? (
          <Empty label="No open orders" />
        ) : (
          <OrderTable orders={openOrders} onCancel={onCancel} />
        )}
      </div>
    </div>
  );
}

function Empty({ label, cta, onCta }: { label: string; cta?: string; onCta?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <Inbox className="w-7 h-7 text-white/20" />
      <p className="font-golos text-sm text-white/40">{label}</p>
      {cta && (
        <button
          onClick={onCta}
          className="px-4 py-2 rounded-lg bg-[#FEB413]/12 border border-[#FEB413]/25 text-[#FEB413] font-jura text-xs font-bold uppercase tracking-wider hover:bg-[#FEB413]/20 transition-colors"
        >
          {cta}
        </button>
      )}
    </div>
  );
}

const COLS = "grid grid-cols-[1.2fr_0.7fr_0.7fr_1fr_1fr_1.2fr_0.6fr] gap-2 px-4";

function OrderTable({ orders, onCancel }: { orders: OpenOrder[]; onCancel?: (id: string) => void }) {
  return (
    <table className="w-full">
      <thead>
        <tr className={cn(COLS, "py-2 text-[10px] font-jura font-bold uppercase tracking-wider text-white/30")}>
          <th className="text-left font-bold">Pair</th>
          <th className="text-left font-bold">Side</th>
          <th className="text-left font-bold">Type</th>
          <th className="text-right font-bold">Price</th>
          <th className="text-right font-bold">Amount</th>
          <th className="text-right font-bold">Filled</th>
          <th className="text-right font-bold">{onCancel ? "Action" : "Status"}</th>
        </tr>
      </thead>
      <tbody>
        {orders.map((o) => {
          const filledPct = o.size ? Math.round((o.filled / o.size) * 100) : 0;
          return (
            <tr key={o.id} className={cn(COLS, "h-9 items-center hover:bg-white/[0.03] font-mono text-[11px]")}>
              <td className="text-left text-white font-jura font-bold">{o.pair}</td>
              <td className={cn("text-left font-bold uppercase", o.side === "buy" ? "text-[#3FC86A]" : "text-[#FF5A5A]")}>
                {o.side}
              </td>
              <td className="text-left text-white/50 capitalize">{o.type}</td>
              <td className="text-right text-white/80">{fmtPrice(o.price)}</td>
              <td className="text-right text-white/80">{fmtSize(o.size)}</td>
              <td className="text-right text-white/50">{filledPct}%</td>
              <td className="text-right">
                {onCancel ? (
                  <button
                    onClick={() => onCancel(o.id)}
                    className="inline-flex items-center gap-1 text-white/40 hover:text-[#FF5A5A] transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <span
                    className={cn(
                      "capitalize",
                      o.status === "filled"
                        ? "text-[#3FC86A]"
                        : o.status === "cancelled"
                          ? "text-white/30"
                          : "text-[#FEB413]",
                    )}
                  >
                    {o.status}
                  </span>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function TradeTable({ trades }: { trades: TapeTrade[] }) {
  return (
    <table className="w-full">
      <thead>
        <tr className="grid grid-cols-4 gap-2 px-4 py-2 text-[10px] font-jura font-bold uppercase tracking-wider text-white/30">
          <th className="text-left font-bold">Side</th>
          <th className="text-right font-bold">Price</th>
          <th className="text-right font-bold">Size</th>
          <th className="text-right font-bold">Time</th>
        </tr>
      </thead>
      <tbody>
        {trades.map((t) => (
          <tr key={t.id} className="grid grid-cols-4 gap-2 px-4 h-9 items-center hover:bg-white/[0.03] font-mono text-[11px]">
            <td className={cn("text-left font-bold uppercase", t.side === "buy" ? "text-[#3FC86A]" : "text-[#FF5A5A]")}>
              {t.side}
            </td>
            <td className="text-right text-white/80">{fmtPrice(t.price)}</td>
            <td className="text-right text-white/60">{fmtSize(t.size)}</td>
            <td className="text-right text-white/35">{t.time}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
