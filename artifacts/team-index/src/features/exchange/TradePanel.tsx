import React, { useEffect, useMemo, useState } from "react";
import { Info, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { fmtPrice, type ExchangeMarket, type OrderSide, type OrderType } from "./data";

const PERCENTS = [25, 50, 75, 100];

export function TradePanel({
  market,
  prefillPrice,
  usdcBalance,
  tokenBalance,
  authenticated,
  onLogin,
  onPlaceOrder,
}: {
  market: ExchangeMarket;
  prefillPrice: number | null;
  usdcBalance: number;
  tokenBalance: number;
  authenticated: boolean;
  onLogin: () => void;
  onPlaceOrder: (o: { side: OrderSide; type: OrderType; price: number; size: number }) => void;
}) {
  const { toast } = useToast();
  const [side, setSide] = useState<OrderSide>("buy");
  const [type, setType] = useState<OrderType>("limit");
  const [price, setPrice] = useState<string>(market.price.toFixed(4));
  const [amount, setAmount] = useState<string>("");

  // Re-sync the limit price when switching market (unless the user is mid-edit).
  useEffect(() => {
    setPrice(market.price.toFixed(4));
  }, [market.id]);

  // Clicking the order book fills the limit price.
  useEffect(() => {
    if (prefillPrice != null) {
      setType("limit");
      setPrice(prefillPrice.toFixed(4));
    }
  }, [prefillPrice]);

  const effectivePrice = type === "market" ? market.price : parseFloat(price) || 0;
  const amt = parseFloat(amount) || 0;
  const total = effectivePrice * amt;

  const available = side === "buy" ? usdcBalance : tokenBalance;
  const fee = total * 0.001; // 0.10% taker

  const setPercent = (pct: number) => {
    if (side === "buy") {
      const budget = (usdcBalance * pct) / 100;
      const size = effectivePrice > 0 ? budget / effectivePrice : 0;
      setAmount(size ? size.toFixed(2) : "");
    } else {
      const size = (tokenBalance * pct) / 100;
      setAmount(size ? size.toFixed(2) : "");
    }
  };

  const insufficient =
    side === "buy" ? total + fee > usdcBalance : amt > tokenBalance;

  const canSubmit = authenticated && amt > 0 && effectivePrice > 0 && !insufficient;

  const submit = () => {
    if (!authenticated) {
      onLogin();
      return;
    }
    if (!canSubmit) return;
    onPlaceOrder({ side, type, price: effectivePrice, size: amt });
    toast({
      title: `${side === "buy" ? "Buy" : "Sell"} order placed`,
      description: `${type === "market" ? "Market" : "Limit"} ${amt.toLocaleString()} ${market.symbol} @ ${fmtPrice(
        effectivePrice,
      )} USDC`,
    });
    setAmount("");
  };

  const accent = side === "buy" ? "#3FC86A" : "#FF5A5A";

  return (
    <div className="flex flex-col rounded-2xl border border-[#2a2720] bg-[#12100B] overflow-hidden">
      {/* Buy / Sell */}
      <div className="grid grid-cols-2 p-1.5 gap-1.5 border-b border-[#221f18]">
        {(["buy", "sell"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSide(s)}
            className={cn(
              "h-9 rounded-lg font-jura text-sm font-bold uppercase tracking-wider transition-all",
              side === s
                ? s === "buy"
                  ? "bg-[#3FC86A]/15 text-[#3FC86A] border border-[#3FC86A]/30"
                  : "bg-[#FF5A5A]/15 text-[#FF5A5A] border border-[#FF5A5A]/30"
                : "text-white/40 hover:text-white/70 border border-transparent",
            )}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="p-4 flex flex-col gap-3.5">
        {/* Order type */}
        <div className="flex gap-1">
          {(["limit", "market"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={cn(
                "font-jura text-[11px] font-bold uppercase tracking-wider pb-1 transition-colors border-b-2",
                type === t ? "text-white border-[#FEB413]" : "text-white/35 border-transparent hover:text-white/60",
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Available */}
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-golos text-white/40 flex items-center gap-1">
            <Wallet className="w-3 h-3" /> Available
          </span>
          <span className="font-mono text-white/70">
            {available.toLocaleString(undefined, { maximumFractionDigits: 2 })}{" "}
            {side === "buy" ? "USDC" : market.symbol}
          </span>
        </div>

        {/* Price */}
        <Field
          label="Price"
          suffix="USDC"
          disabled={type === "market"}
          value={type === "market" ? "Market" : price}
          onChange={setPrice}
        />

        {/* Amount */}
        <Field label="Amount" suffix={market.symbol} value={amount} onChange={setAmount} placeholder="0.00" />

        {/* Percent buttons */}
        <div className="grid grid-cols-4 gap-1.5">
          {PERCENTS.map((p) => (
            <button
              key={p}
              onClick={() => setPercent(p)}
              className="h-7 rounded-md bg-[#0D0A06] border border-[#221f18] font-mono text-[11px] text-white/50 hover:text-white hover:border-[#FEB413]/30 transition-colors"
            >
              {p}%
            </button>
          ))}
        </div>

        {/* Total */}
        <Field
          label="Total"
          suffix="USDC"
          value={total ? total.toFixed(2) : ""}
          onChange={(v) => {
            const t = parseFloat(v) || 0;
            setAmount(effectivePrice > 0 && t ? (t / effectivePrice).toFixed(2) : "");
          }}
          placeholder="0.00"
        />

        {/* Summary */}
        <div className="flex flex-col gap-1.5 pt-1 text-[11px] font-mono">
          <Line label="Est. Fee (0.10%)" value={`${fee.toFixed(2)} USDC`} />
          <Line
            label={side === "buy" ? "Total Cost" : "Total Receive"}
            value={`${(side === "buy" ? total + fee : total - fee).toFixed(2)} USDC`}
            strong
          />
        </div>

        {insufficient && authenticated && (
          <p className="flex items-center gap-1.5 text-[11px] text-[#FF5A5A] font-golos">
            <Info className="w-3 h-3" /> Insufficient {side === "buy" ? "USDC" : market.symbol} balance
          </p>
        )}

        {/* Submit */}
        <button
          onClick={submit}
          disabled={authenticated && !canSubmit}
          className={cn(
            "h-11 rounded-xl font-jura text-sm font-bold uppercase tracking-wider transition-all active:scale-[0.98]",
            !authenticated
              ? "bg-[#FEB413] text-[#0D0A06] hover:brightness-110"
              : !canSubmit
                ? "bg-white/5 text-white/30 cursor-not-allowed border border-white/5"
                : "text-[#0D0A06] hover:brightness-110",
          )}
          style={
            authenticated && canSubmit
              ? { backgroundColor: accent }
              : undefined
          }
        >
          {!authenticated
            ? "Connect Wallet"
            : `${side === "buy" ? "Buy" : "Sell"} ${market.symbol}`}
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  suffix,
  value,
  onChange,
  disabled,
  placeholder,
}: {
  label: string;
  suffix: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-jura text-[10px] font-bold uppercase tracking-wider text-white/30">{label}</span>
      <div
        className={cn(
          "flex items-center gap-2 px-3 h-10 rounded-lg bg-[#0D0A06] border border-[#221f18] transition-colors",
          !disabled && "focus-within:border-[#FEB413]/40",
          disabled && "opacity-60",
        )}
      >
        <input
          value={value}
          disabled={disabled}
          inputMode="decimal"
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value.replace(/[^0-9.]/g, ""))}
          className="bg-transparent w-full font-mono text-sm text-white placeholder:text-white/25 outline-none disabled:cursor-not-allowed"
        />
        <span className="font-jura text-[11px] font-bold text-white/35 shrink-0">{suffix}</span>
      </div>
    </label>
  );
}

function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-white/40">{label}</span>
      <span className={strong ? "text-white font-bold" : "text-white/70"}>{value}</span>
    </div>
  );
}
