import React from "react";
import { useLocation } from "wouter";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BarChart2,
  TrendingUp,
  Wallet,
  AlertTriangle,
  Loader2,
  Copy as CopyIcon,
  Check as CheckIcon,
} from "lucide-react";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { GoldButton } from "@/components/ui/GoldButton";
import { GradientHeading } from "@/components/ui/GradientHeading";
import { VaultPositionsModal } from "@/features/pools/VaultPositionsModal";
import { useUserHoldings, type UserHolding } from "@/hooks/use-user-holdings";
import { truncateAddr } from "@/utils/address";
import { cn } from "@/lib/utils";
import { formatPoolName } from "@/utils/pool";
import { getPrimaryEvmAddress } from "@/utils/wallet";

function fmtUsd(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "$0.00";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(2)}k`;
  return `$${n.toFixed(2)}`;
}

function fmtShares(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "0";
  if (n >= 1_000) return n.toFixed(0);
  if (n >= 1) return n.toFixed(2);
  return n.toFixed(4);
}

// ─── Holding row ─────────────────────────────────────────────────────────────

function HoldingRow({
  holding,
  index,
  onViewPositions,
}: {
  holding: UserHolding;
  index: number;
  onViewPositions: (h: UserHolding) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="rounded-[10px] border border-[#232323] bg-[#18140F] p-5 flex flex-col gap-4"
      style={{ boxShadow: "0 2px 16px 0 rgba(0,0,0,0.25)" }}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#23201A] border border-[#232323] shrink-0 overflow-hidden p-1.5">
          <img
            src={import.meta.env.BASE_URL + "images/logo_img.svg"}
            alt="Pryzen"
            className="w-full h-full object-contain"
          />
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-white font-bold text-base uppercase leading-tight tracking-wide truncate">
            {formatPoolName(holding.clubName)}
          </span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[#B3B3B3] text-xs font-medium">${holding.symbol}</span>
            <span className="text-[#B3B3B3] text-xs">•</span>
            <span
              className={cn(
                "text-xs font-medium",
                holding.status === "PAUSED" ? "text-[#FF5A5A]" : "text-[#3FC86A]"
              )}
            >
              {holding.status === "PAUSED" ? "paused" : "open"}
            </span>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full">
        <div className="flex-1 bg-[#23201A] rounded-lg px-2.5 py-2 flex flex-col items-start min-w-0">
          <span className="text-[#B3B3B3] text-[10px] font-medium uppercase tracking-wider mb-1">
            Your Shares
          </span>
          <span className="text-white text-sm font-bold font-mono truncate">
            {fmtShares(holding.shares)}
          </span>
        </div>
        <div className="flex-1 bg-[#23201A] rounded-lg px-2.5 py-2 flex flex-col items-start min-w-0">
          <span className="text-[#B3B3B3] text-[10px] font-medium uppercase tracking-wider mb-1">
            Token Price
          </span>
          <span className="text-white text-sm font-bold font-mono truncate">
            ${holding.tokenPriceUsd.toFixed(2)}
          </span>
        </div>
        <div className="flex-1 bg-[#23201A] rounded-lg px-2.5 py-2 flex flex-col items-start min-w-0">
          <span className="text-[#B3B3B3] text-[10px] font-medium uppercase tracking-wider mb-1">
            Value
          </span>
          <span className="text-[#FEB413] text-sm font-bold font-mono truncate">
            {fmtUsd(holding.valueUsd)}
          </span>
        </div>
      </div>

      {/* Actions */}
      <button
        onClick={() => onViewPositions(holding)}
        className="w-full h-10 rounded-full text-sm font-semibold transition-all bg-[#1e1b09] border border-white/10 text-white hover:bg-[#252010] active:scale-95 flex items-center justify-center gap-2"
      >
        <BarChart2 className="w-4 h-4" />
        View Vault Positions
      </button>
    </motion.div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [, navigate] = useLocation();
  const { ready, authenticated, user, login } = usePrivy();
  const { wallets } = useWallets();
  const [copied, setCopied] = React.useState(false);
  const [selected, setSelected] = React.useState<UserHolding | null>(null);

  const walletAddress = getPrimaryEvmAddress(user, wallets);
  const { data, isLoading, isError, refetch } = useUserHoldings(
    authenticated ? walletAddress : null
  );

  const holdings = data?.holdings ?? [];
  const totalValue = data?.totalValueUsd ?? 0;

  const copyAddress = () => {
    if (!walletAddress) return;
    navigator.clipboard.writeText(walletAddress).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="min-h-screen bg-[#0D0A06] selection:bg-[#FEB413]/30 selection:text-white flex flex-col">
      <div className="fixed top-0 inset-x-0 z-[60] bg-[#FEB413] text-[#0D0A06] text-center py-1 font-jura font-bold text-[10px] sm:text-xs uppercase tracking-widest">
        ⚠️ Mainnet Test — This is a live test environment
      </div>
      <Navbar topOffset />

      <main className="flex-1 pt-32 pb-20 px-4 sm:px-8 md:px-12 xl:px-30 flex flex-col gap-10">
        {/* Back link */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-[#B3B3B3] hover:text-white transition-colors w-fit text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="flex flex-col gap-3">
            <GradientHeading
              as="h1"
              className="text-[36px] sm:text-[48px] lg:text-[60px] leading-[108%]"
              style={{ letterSpacing: "0.8px" }}
            >
              MY INDEXES
            </GradientHeading>
            <p className="font-golos text-white/70 text-base max-w-2xl">
              Every Team Index pool you hold shares in, with live USD values and
              open Polymarket positions per vault.
            </p>
          </div>

          {ready && authenticated && walletAddress && (
            <div className="flex flex-col gap-2 items-start md:items-end shrink-0">
              <span className="text-[#B3B3B3] text-xs font-medium uppercase tracking-wider">
                Connected Wallet
              </span>
              <button
                onClick={copyAddress}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#18140F] border border-[#232323] hover:border-white/20 transition-all font-mono text-sm text-white"
              >
                {truncateAddr(walletAddress)}
                {copied ? (
                  <CheckIcon className="w-3.5 h-3.5 text-[#3FC86A]" />
                ) : (
                  <CopyIcon className="w-3.5 h-3.5 text-[#B3B3B3]" />
                )}
              </button>
            </div>
          )}
        </div>

        {/* Not authenticated state */}
        {ready && !authenticated && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[10px] border border-[#232323] bg-[#18140F] p-10 flex flex-col items-center gap-5 text-center"
          >
            <div className="w-14 h-14 rounded-full bg-[#FEB413]/10 border border-[#FEB413]/30 flex items-center justify-center">
              <Wallet className="w-6 h-6 text-[#FEB413]" />
            </div>
            <div className="flex flex-col gap-2 max-w-md">
              <h2 className="text-white text-xl font-bold">
                Log in to see your indexes
              </h2>
              <p className="text-white/60 text-sm">
                Connect your wallet to view every Team Index pool you hold
                shares in, plus live USD values and open vault positions.
              </p>
            </div>
            <GoldButton onClick={login} className="min-h-12 px-8">
              Login
            </GoldButton>
          </motion.div>
        )}

        {/* Loading */}
        {ready && authenticated && isLoading && (
          <div className="flex items-center justify-center gap-3 py-16 text-white/60">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Loading your indexes…</span>
          </div>
        )}

        {/* Error */}
        {ready && authenticated && isError && (
          <div className="flex items-center gap-3 p-4 rounded-[10px] border border-red-500/30 bg-red-500/5 text-red-300 text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <div className="flex-1">
              Couldn&apos;t load your holdings. The backend may be unreachable.
            </div>
            <button
              onClick={() => refetch()}
              className="px-3 py-1.5 rounded border border-red-500/30 text-red-200 hover:bg-red-500/10 transition-all text-xs font-semibold"
            >
              Retry
            </button>
          </div>
        )}

        {/* Portfolio summary */}
        {ready && authenticated && !isLoading && !isError && holdings.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4"
          >
            <div className="rounded-[10px] border border-[#FEB413]/20 bg-[#18140F] p-5 flex flex-col gap-1">
              <span className="text-[#B3B3B3] text-xs font-medium uppercase tracking-wider">
                Total Portfolio Value
              </span>
              <span className="text-[#FEB413] text-3xl font-bold font-mono">
                {fmtUsd(totalValue)}
              </span>
            </div>
            <div className="rounded-[10px] border border-[#232323] bg-[#18140F] p-5 flex flex-col gap-1">
              <span className="text-[#B3B3B3] text-xs font-medium uppercase tracking-wider">
                Indexes Held
              </span>
              <span className="text-white text-3xl font-bold font-mono">
                {holdings.length}
              </span>
            </div>
            <div className="rounded-[10px] border border-[#232323] bg-[#18140F] p-5 flex flex-col gap-1">
              <span className="text-[#B3B3B3] text-xs font-medium uppercase tracking-wider">
                Total Shares
              </span>
              <span className="text-white text-3xl font-bold font-mono">
                {fmtShares(holdings.reduce((s, h) => s + h.shares, 0))}
              </span>
            </div>
          </motion.div>
        )}

        {/* Empty state */}
        {ready &&
          authenticated &&
          !isLoading &&
          !isError &&
          holdings.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-[10px] border border-[#232323] bg-[#18140F] p-10 flex flex-col items-center gap-5 text-center"
            >
              <div className="w-14 h-14 rounded-full bg-[#23201A] border border-[#232323] flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-[#B3B3B3]" />
              </div>
              <div className="flex flex-col gap-2 max-w-md">
                <h2 className="text-white text-xl font-bold">
                  No indexes yet
                </h2>
                <p className="text-white/60 text-sm">
                  You haven&apos;t deposited into any Team Index pool yet.
                  Browse the live pools and deposit to start building your
                  portfolio.
                </p>
              </div>
              <button
                onClick={() => navigate("/#live-indexes")}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1e1b09] border border-white/10 text-white text-sm font-semibold hover:bg-[#252010] active:scale-95 transition-all"
              >
                Explore Live Pools
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}

        {/* Holdings list */}
        {ready && authenticated && !isLoading && !isError && holdings.length > 0 && (
          <div className="flex flex-col gap-4">
            <h2 className="text-white text-lg font-bold uppercase tracking-wider">
              Your Holdings
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {holdings.map((h, i) => (
                <HoldingRow
                  key={h.poolId}
                  holding={h}
                  index={i}
                  onViewPositions={setSelected}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />

      {selected && (
        <VaultPositionsModal
          poolId={selected.poolId}
          poolName={formatPoolName(selected.clubName)}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
