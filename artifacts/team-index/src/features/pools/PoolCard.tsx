import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkline } from './Sparkline';
import { Shield, TrendingUp, Users, ArrowRight, BarChart2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PoolData } from '@/types/pool';
import { fmtUsdShort, formatPoolName } from '@/utils/pool';
import { VaultPositionsModal } from './VaultPositionsModal';

export function PoolCard({ pool, index, onEnter }: { pool: PoolData; index: number; onEnter?: (pool: PoolData) => void }) {
  const [showPositions, setShowPositions] = useState(false);
  const isClosed = pool.status === 'Closed';
  const isClosingSoon = pool.status === 'Closing Soon';
  const hasFiniteCap = Number.isFinite(pool.poolCap) && pool.poolCap > 0;
  const capUnlimited = pool.capUnlimited === true || !hasFiniteCap;

  const progressPercentage = !hasFiniteCap
    ? 0
    : Math.min(100, (pool.poolSize / pool.poolCap) * 100);
  const isPositive = pool.change24h >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group relative"
    >
      <div className={cn(
        "absolute -inset-0.5 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500",
        isClosed ? "bg-white/10" : "bg-gradient-to-br from-primary/50 to-transparent"
      )} />

      <div className="relative h-full bg-glass-card rounded-2xl p-6 flex flex-col premium-shadow transition-transform duration-300 group-hover:-translate-y-1">

        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center shadow-lg border overflow-hidden p-2",
              isClosed ? "bg-muted border-white/5" : "bg-secondary border-primary/20"
            )}>
              <img
                src={import.meta.env.BASE_URL + "images/logo_img.svg"}
                alt="Pryzen"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground font-display">{formatPoolName(pool.team)}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-medium text-muted-foreground bg-white/5 px-2 py-0.5 rounded-md border border-white/10">
                  ${pool.symbol}
                </span>
                <span className={cn(
                  "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full",
                  pool.status === 'Open' ? "bg-primary/20 text-primary border border-primary/30" :
                  pool.status === 'Closing Soon' ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" :
                  "bg-white/5 text-muted-foreground border border-white/10"
                )}>
                  {pool.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-black/20 rounded-xl p-3 border border-white/5">
            <p className="text-xs text-muted-foreground mb-1">Token Value</p>
            <div className="flex items-end justify-between">
              <span className="text-lg font-bold font-mono">${pool.tokenValue.toFixed(2)}</span>
              <span className={cn(
                "text-xs font-medium flex items-center mb-0.5",
                isPositive ? "text-success" : "text-destructive"
              )}>
                {isPositive ? '+' : ''}{pool.change24h}%
              </span>
            </div>
          </div>
          <div className="bg-black/20 rounded-xl p-3 border border-white/5 relative overflow-hidden">
            <p className="text-xs text-muted-foreground mb-1">Holders</p>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-lg font-bold">{pool.holders.toLocaleString()}</span>
            </div>
            <div className="absolute bottom-0 right-0 opacity-50">
              <Sparkline
                data={pool.sparklineData}
                width={60}
                height={24}
                color={isPositive ? "hsl(var(--success))" : "hsl(var(--destructive))"}
              />
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-xs mb-2">
            <span className="text-muted-foreground">Pool Fill</span>
            <span className="font-medium text-foreground">
              {fmtUsdShort(pool.poolSize)} / {capUnlimited ? '∞' : fmtUsdShort(pool.poolCap)}
            </span>
          </div>
          <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
            <motion.div
              className={cn(
                "h-full rounded-full relative",
                isClosed ? "bg-muted-foreground" : "bg-primary"
              )}
              initial={{ width: 0 }}
              whileInView={{ width: `${progressPercentage}%` }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.2 + index * 0.1, ease: "easeOut" }}
            >
              {!isClosed && (
                <div className="absolute top-0 right-0 bottom-0 left-0 bg-gradient-to-r from-transparent to-white/30 animate-[shimmer_2s_infinite]" />
              )}
            </motion.div>
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2 mb-8 mt-auto">
          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-white/5 px-2 py-1 rounded border border-white/5">
            <Shield className="w-3 h-3" /> USDC
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] text-primary bg-primary/10 px-2 py-1 rounded border border-primary/20">
            <TrendingUp className="w-3 h-3" /> Gains Eligible
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] text-accent bg-accent/10 px-2 py-1 rounded border border-accent/20">
            Listing Soon
          </span>
        </div>

        {/* CTA */}
        <button
          disabled={isClosed}
          onClick={() => !isClosed && onEnter?.(pool)}
          className={cn(
            "w-full py-3 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2",
            isClosed
              ? "bg-white/5 text-muted-foreground cursor-not-allowed border border-white/5"
              : "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-[0_0_20px_-5px_hsl(var(--primary))] border border-primary/50"
          )}
        >
          {isClosed ? "Pool Closed" : isClosingSoon ? "Enter Before Close" : "Enter Pool"}
          {!isClosed && <ArrowRight className="w-4 h-4" />}
        </button>

        {/* View Positions button */}
        <button
          onClick={() => setShowPositions(true)}
          className="w-full py-2.5 rounded-xl font-semibold text-xs transition-all duration-200 flex items-center justify-center gap-2 bg-white/5 border border-white/8 text-muted-foreground hover:text-white hover:bg-white/10 hover:border-white/20"
        >
          <BarChart2 className="w-3.5 h-3.5" />
          View Vault Positions
        </button>
      </div>

      {/* Positions modal */}
      {showPositions && (
        <VaultPositionsModal
          poolId={pool.id}
          poolName={formatPoolName(pool.team)}
          onClose={() => setShowPositions(false)}
        />
      )}
    </motion.div>
  );
}
