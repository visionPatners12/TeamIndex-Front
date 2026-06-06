import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowDown, CheckCircle, Info, Lock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { GoldButton } from "@/components/ui/GoldButton";
import type { ExchangeMarket } from "./data";
import { fmtPrice } from "./data";

const FEE_PCT = 0.3; // Pryzen exchange fee (matches ShareExchange feeBps target)

type Side = "buy" | "sell";
type Step = "form" | "processing" | "success";

interface TradeModalProps {
  market: ExchangeMarket | null;
  initialSide?: Side;
  onClose: () => void;
  isAuthenticated?: boolean;
  onLogin?: () => void;
}

const BUY_PRESETS = [25, 50, 100, 250];
const SELL_PRESETS = [10, 25, 50, 100];

function fmtUsd(n: number): string {
  if (!Number.isFinite(n)) return "$0.00";
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function TradeModal({ market, initialSide = "buy", onClose, isAuthenticated, onLogin }: TradeModalProps) {
  const [side, setSide] = useState<Side>(initialSide);
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<Step>("form");

  // Reset side when a new market opens
  React.useEffect(() => {
    setSide(initialSide);
    setAmount("");
    setStep("form");
  }, [market?.id, initialSide]);

  const num = parseFloat(amount) || 0;
  const price = market?.marketPrice ?? 0;

  const calc = useMemo(() => {
    if (!market || num <= 0) return { receive: 0, fee: 0, label: "" };
    if (side === "buy") {
      // pay `num` USDC → receive shares (net of fee)
      const fee = num * (FEE_PCT / 100);
      const shares = price > 0 ? (num - fee) / price : 0;
      return { receive: shares, fee, label: `${market.symbol} shares` };
    }
    // sell `num` shares → receive USDC (net of fee)
    const gross = num * price;
    const fee = gross * (FEE_PCT / 100);
    return { receive: gross - fee, fee, label: "USDC" };
  }, [market, num, side, price]);

  if (!market) return null;

  const presets = side === "buy" ? BUY_PRESETS : SELL_PRESETS;
  const isBuy = side === "buy";
  const accent = isBuy ? "#3FC86A" : "#FF5A5A";

  const handleConfirm = () => {
    if (!isAuthenticated) {
      onLogin?.();
      return;
    }
    if (num <= 0) return;
    setStep("processing");
    // No exchange contract is deployed yet — simulate the settlement UX.
    setTimeout(() => setStep("success"), 1400);
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

        {/* Sheet / dialog */}
        <motion.div
          initial={{ y: 40, opacity: 0, scale: 0.98 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 40, opacity: 0, scale: 0.98 }}
          transition={{ type: "spring", damping: 30, stiffness: 320 }}
          className="relative w-full sm:max-w-[440px] bg-[#12100B] border border-[#2a2720] rounded-t-3xl sm:rounded-3xl overflow-hidden"
          style={{ boxShadow: "0 -8px 40px rgba(0,0,0,0.5)" }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-5 sm:px-6 pt-5 pb-4 border-b border-white/5">
            <div className="w-10 h-10 rounded-full bg-[#23201A] border border-[#232323] flex items-center justify-center overflow-hidden p-1.5 shrink-0">
              <img src={import.meta.env.BASE_URL + "images/logo_img.svg"} alt="" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-white font-bold text-base leading-tight truncate">{market.name}</span>
              <span className="text-[#B3B3B3] text-xs font-mono">{market.pair}</span>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center border border-white/10 transition-all shrink-0"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-white/70" />
            </button>
          </div>

          {step === "success" ? (
            <div className="px-6 py-10 flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: `${accent}1a`, border: `1px solid ${accent}55` }}>
                <CheckCircle className="w-8 h-8" style={{ color: accent }} />
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-white text-xl font-bold">
                  {isBuy ? "Buy order placed" : "Sell order placed"}
                </h3>
                <p className="text-white/55 text-sm max-w-xs">
                  {isBuy
                    ? `You're buying ~${calc.receive.toFixed(2)} ${market.symbol} shares.`
                    : `You're selling ${num.toFixed(2)} ${market.symbol} shares for ~${fmtUsd(calc.receive)}.`}
                </p>
              </div>
              <div className="w-full rounded-xl bg-[#23201A] border border-[#232323] p-3 flex items-start gap-2 text-left">
                <Info className="w-4 h-4 text-[#FEB413] mt-0.5 shrink-0" />
                <p className="text-white/55 text-xs leading-relaxed">
                  This order settles on-chain once the Pryzen Exchange contract is live on Base. You'll keep custody of your funds until it fills.
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-full h-12 rounded-full bg-white/5 border border-white/10 text-white font-semibold text-sm hover:bg-white/10 transition-all"
              >
                Done
              </button>
            </div>
          ) : (
            <div className="px-5 sm:px-6 py-5 flex flex-col gap-4">
              {/* Buy / Sell toggle */}
              <div className="grid grid-cols-2 gap-2 p-1 rounded-full bg-[#0D0A06] border border-[#232323]">
                {(["buy", "sell"] as Side[]).map((s) => {
                  const active = side === s;
                  const col = s === "buy" ? "#3FC86A" : "#FF5A5A";
                  return (
                    <button
                      key={s}
                      onClick={() => setSide(s)}
                      className="h-10 rounded-full font-jura font-bold text-sm uppercase tracking-wide transition-all"
                      style={
                        active
                          ? { background: `${col}1f`, color: col, border: `1px solid ${col}55` }
                          : { color: "#9a948a", border: "1px solid transparent" }
                      }
                    >
                      {s}
                    </button>
                  );
                })}
              </div>

              {/* Price block: Market vs NAV */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-[#18140F] border border-[#FEB413]/20 p-3 flex flex-col gap-0.5">
                  <span className="text-[#B3B3B3] text-[10px] font-medium uppercase tracking-wider">Exchange price</span>
                  <span className="text-[#FEB413] text-lg font-bold font-mono">${fmtPrice(market.marketPrice)}</span>
                  <span className={cn("text-[11px] font-mono", market.change24h >= 0 ? "text-[#3FC86A]" : "text-[#FF5A5A]")}>
                    {market.change24h >= 0 ? "+" : ""}{market.change24h}% 24h
                  </span>
                </div>
                <div className="rounded-xl bg-[#18140F] border border-[#232323] p-3 flex flex-col gap-0.5">
                  <span className="text-[#B3B3B3] text-[10px] font-medium uppercase tracking-wider">Real value (NAV)</span>
                  <span className="text-white text-lg font-bold font-mono">${fmtPrice(market.nav)}</span>
                  <span className={cn("text-[11px] font-mono", market.premiumPct >= 0 ? "text-[#3FC86A]" : "text-[#FF5A5A]")}>
                    {market.premiumPct >= 0 ? "+" : ""}{market.premiumPct}% vs NAV
                  </span>
                </div>
              </div>

              {/* Amount input */}
              <div className="flex flex-col gap-2">
                <label className="text-[#B3B3B3] text-xs font-medium">
                  {isBuy ? "You pay (USDC)" : `You sell (${market.symbol} shares)`}
                </label>
                <div className="flex items-center gap-2 rounded-xl bg-[#0D0A06] border border-[#232323] px-4 h-14 focus-within:border-[#FEB413]/40 transition-colors">
                  <input
                    type="number"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    className="flex-1 bg-transparent outline-none text-white text-xl font-mono font-bold placeholder:text-white/25"
                  />
                  <span className="text-white/50 font-jura font-bold text-sm">{isBuy ? "USDC" : market.symbol}</span>
                </div>
                <div className="flex gap-2">
                  {presets.map((p) => (
                    <button
                      key={p}
                      onClick={() => setAmount(String(p))}
                      className="flex-1 h-8 rounded-lg bg-white/5 border border-white/8 text-white/70 text-xs font-semibold hover:bg-white/10 hover:text-white transition-all"
                    >
                      {isBuy ? `$${p}` : p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Receive summary */}
              <div className="flex items-center justify-center -my-1">
                <div className="w-8 h-8 rounded-full bg-[#23201A] border border-[#232323] flex items-center justify-center">
                  <ArrowDown className="w-4 h-4 text-white/50" />
                </div>
              </div>
              <div className="rounded-xl bg-[#18140F] border border-[#232323] p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[#B3B3B3] text-xs">You receive (est.)</span>
                  <span className="text-white text-lg font-bold font-mono">
                    {isBuy ? `${calc.receive.toFixed(2)} ${market.symbol}` : fmtUsd(calc.receive)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/40 text-[11px]">Fee ({FEE_PCT}%)</span>
                  <span className="text-white/55 text-[11px] font-mono">
                    {isBuy ? fmtUsd(calc.fee) : `${(calc.fee / (price || 1)).toFixed(3)} ${market.symbol}`}
                  </span>
                </div>
              </div>

              {/* Redeem-locked hint (sell side) */}
              {market.redeemLocked && (
                <div className="rounded-xl bg-[#FEB413]/8 border border-[#FEB413]/20 p-3 flex items-start gap-2">
                  <Lock className="w-4 h-4 text-[#FEB413] mt-0.5 shrink-0" />
                  <p className="text-white/60 text-[11px] leading-relaxed">
                    Direct redeem is paused for this index (capital is in play). The exchange is the way to {isBuy ? "get in" : "cash out"} right now — price is set by the market, not NAV.
                  </p>
                </div>
              )}

              {/* CTA */}
              {isBuy ? (
                <GoldButton
                  onClick={handleConfirm}
                  disabled={step === "processing"}
                  className="w-full min-h-[52px] text-sm font-bold disabled:opacity-60"
                >
                  {step === "processing" ? (
                    <span className="inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Placing…</span>
                  ) : !isAuthenticated ? "Log in to buy" : `Buy ${market.symbol}`}
                </GoldButton>
              ) : (
                <button
                  onClick={handleConfirm}
                  disabled={step === "processing"}
                  className="w-full min-h-[52px] rounded-full font-jura font-bold text-sm uppercase tracking-wide bg-[#FF5A5A] text-[#0D0A06] hover:bg-[#ff7070] active:scale-[0.99] transition-all disabled:opacity-60"
                >
                  {step === "processing" ? (
                    <span className="inline-flex items-center gap-2 justify-center"><Loader2 className="w-4 h-4 animate-spin" /> Placing…</span>
                  ) : !isAuthenticated ? "Log in to sell" : `Sell ${market.symbol}`}
                </button>
              )}

              <p className="text-white/35 text-[10px] text-center leading-relaxed">
                Peer-to-peer on Base, settled in USDC. You stay in control of your shares until the order fills.
              </p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
