import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, TrendingUp, TrendingDown, Loader2, BarChart2, AlertTriangle,
  Wallet, Landmark, Activity, Hash, Clock3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { VaultPosition, MarketType, MarketSide } from '@/types/polymarket';
import { api, type PoolBalances, type PoolPositionsSummary } from '@/lib/api';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function asNumber(value: unknown, fallback = 0): number {
  const n = Number(value ?? fallback);
  return Number.isFinite(n) ? n : fallback;
}

function fmtNumber4(value: unknown): string {
  return asNumber(value).toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 });
}

function fmtUsd(n: number): string {
  if (!Number.isFinite(n)) return '—';
  const sign = n < 0 ? '-' : '';
  return `${sign}$${fmtNumber4(Math.abs(n))}`;
}

function fmtUsdDetailed(value: unknown, formatted?: string): string {
  if (formatted) return `$${formatted}`;
  return fmtUsd(asNumber(value));
}

function fmtPlainDetailed(value: unknown, formatted?: string): string {
  return formatted ?? fmtNumber4(value);
}

function fmtPriceDetailed(value: unknown, formatted?: string): string {
  const n = asNumber(value);
  const price = formatted ?? n.toFixed(4);
  return `${price} / ${(n * 100).toFixed(4)}¢`;
}

function fmtPct(n: number): string {
  return `${n >= 0 ? '+' : ''}${(n * 100).toFixed(4)}%`;
}

function shortId(value?: string | null): string {
  if (!value) return 'pending';
  return value.length > 18 ? `${value.slice(0, 10)}…${value.slice(-6)}` : value;
}

function pctColor(n: number): string {
  return n >= 0 ? 'text-green-400' : 'text-red-400';
}

function MarketTypeBadge({ type }: { type: MarketType }) {
  return (
    <span className={cn(
      'text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border',
      type === 'game'
        ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
        : 'bg-purple-500/15 text-purple-400 border-purple-500/30'
    )}>
      {type === 'game' ? 'Game' : 'Future'}
    </span>
  );
}

function SideBadge({ side }: { side: MarketSide }) {
  return (
    <span className={cn(
      'text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border',
      side === 'YES'
        ? 'bg-green-500/15 text-green-400 border-green-500/30'
        : 'bg-red-500/15 text-red-400 border-red-500/30'
    )}>
      {side}
    </span>
  );
}

function StatusBadge({ status }: { status: VaultPosition['status'] }) {
  return (
    <span className={cn(
      'text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border',
      status === 'open'
        ? 'bg-primary/15 text-primary border-primary/30'
        : status === 'settled'
        ? 'bg-green-500/15 text-green-400 border-green-500/30'
        : 'bg-white/5 text-muted-foreground border-white/10'
    )}>
      {status}
    </span>
  );
}

function DetailCell({
  label,
  value,
  mono = true,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="min-w-0 rounded-md border border-white/8 bg-black/20 px-2.5 py-2">
      <p className="text-[9px] uppercase tracking-wider text-white/35 truncate">{label}</p>
      <p className={cn('text-[11px] text-white/90 truncate', mono && 'font-mono')}>{value}</p>
    </div>
  );
}

// ─── Mock fallback for pools without live position data ──────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <BarChart2 className="w-10 h-10 text-white/15" />
      <p className="text-sm text-muted-foreground">No open positions at the moment.</p>
      <p className="text-xs text-white/30">The vault may be in cash or awaiting market opportunities.</p>
    </div>
  );
}

// ─── Position Row ─────────────────────────────────────────────────────────────

function PositionRow({ pos }: { pos: VaultPosition }) {
  const f = pos.formatted ?? {};
  const pnl = pos.valuation?.unrealizedPnl ?? pos.unrealizedPnl;
  const pnlPct = pos.valuation?.unrealizedPnlPct ?? pos.unrealizedPnlPct;
  const pnlPositive = pnl >= 0;
  const orderId = pos.order?.id ?? pos.clobOrderId ?? null;
  const orderStatus = pos.order?.status ?? pos.status;
  const filledQty = pos.filled?.quantity ?? 0;
  const plannedQty = pos.planned?.quantity ?? 0;
  const fillPct = pos.filled?.fillPct ?? (plannedQty > 0 ? filledQty / plannedQty : 0);

  return (
    <div className="px-4 py-4 border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-start">
        <div className="min-w-0">
          <p className="text-sm text-white leading-snug line-clamp-2">{pos.question}</p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <MarketTypeBadge type={pos.marketType} />
            <SideBadge side={pos.selectedSide} />
            <StatusBadge status={pos.status} />
            {pos.endsAt && (
              <span className="text-[9px] text-white/30">
                Ends {new Date(pos.endsAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        <div className="text-left sm:text-right shrink-0 space-y-1">
          <p className="text-sm font-bold font-mono text-white">
            {fmtUsdDetailed(pos.valuation?.investedAmount ?? pos.sizeUsdc, f.investedAmount ?? f.sizeUsdc)}
          </p>
          <div className="flex items-center gap-1 sm:justify-end">
            {pnlPositive
              ? <TrendingUp className="w-3 h-3 text-green-400" />
              : <TrendingDown className="w-3 h-3 text-red-400" />
            }
            <span className={cn('text-xs font-mono font-semibold', pctColor(pnl))}>
              {fmtUsdDetailed(pnl, f.unrealizedPnl)}
            </span>
          </div>
          <p className={cn('text-[10px] font-mono', pctColor(pnlPct))}>
            {f.unrealizedPnlPct ?? fmtPct(pnlPct)}
          </p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 lg:grid-cols-4 gap-2">
        <DetailCell
          label="Order ID"
          value={
            <span title={orderId ?? undefined} className="inline-flex items-center gap-1 min-w-0">
              <Hash className="w-3 h-3 text-white/35 shrink-0" />
              <span className="truncate">{shortId(orderId)}</span>
            </span>
          }
        />
        <DetailCell label="Order status" value={orderStatus} />
        <DetailCell label="Entry price" value={fmtPriceDetailed(pos.entryPrice, f.entryPrice)} />
        <DetailCell label="Current price" value={fmtPriceDetailed(pos.currentPrice, f.currentPrice)} />
        <DetailCell label="Planned stake" value={fmtUsdDetailed(pos.planned?.stake ?? pos.sizeUsdc, f.plannedStake)} />
        <DetailCell label="Filled stake" value={fmtUsdDetailed(pos.filled?.stake ?? 0, f.filledStake)} />
        <DetailCell label="Planned qty" value={fmtPlainDetailed(pos.planned?.quantity ?? pos.sizeUsdc / Math.max(pos.entryPrice, 0.0001), f.plannedQuantity)} />
        <DetailCell label="Filled qty" value={fmtPlainDetailed(filledQty, f.filledQuantity)} />
        <DetailCell label="Fill" value={f.fillPct ?? fmtPct(fillPct)} />
        <DetailCell label="Current value" value={fmtUsdDetailed(pos.valuation?.currentValue ?? pos.sizeUsdc + pos.unrealizedPnl, f.currentValue)} />
        <DetailCell label="Realized P&L" value={fmtUsdDetailed(pos.valuation?.realizedPnl ?? pos.realizedPnl ?? 0, f.realizedPnl)} />
        <DetailCell
          label="Updated"
          value={
            pos.updatedAt ? (
              <span className="inline-flex items-center gap-1">
                <Clock3 className="w-3 h-3 text-white/35" />
                {new Date(pos.updatedAt).toLocaleString()}
              </span>
            ) : '—'
          }
          mono={false}
        />
      </div>
    </div>
  );
}

// ─── Summary Bar ─────────────────────────────────────────────────────────────

function CashBreakdown({
  balances,
  summary,
}: {
  balances: PoolBalances;
  summary: PoolPositionsSummary | null;
}) {
  const sourceLabel =
    balances.vaultCashSource === 'onchain'
      ? 'on-chain'
      : balances.vaultCashSource === 'db-derived'
      ? 'db split'
      : 'db fallback';

  const stats = [
    {
      label: 'Vault USDC',
      value: fmtUsd(balances.vaultCash),
      meta: sourceLabel,
      icon: Landmark,
    },
    {
      label: 'Server Wallet USDC',
      value: fmtUsd(balances.serverWalletCash),
      meta: balances.readServerWalletCash ? 'on-chain' : 'unread',
      icon: Wallet,
    },
    {
      label: 'Positions Value',
      value: fmtUsd(summary?.openPositionsValue ?? 0),
      meta: `${summary?.openPositionCount ?? 0} open`,
      icon: Activity,
    },
    {
      label: 'Total NAV',
      value: fmtUsd(summary?.totalPoolValue ?? balances.totalCash),
      meta: 'cash + positions',
      icon: BarChart2,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 px-4 py-3 border-b border-white/8 bg-white/2">
      {stats.map(({ label, value, meta, icon: Icon }) => (
        <div key={label} className="rounded-lg border border-white/8 bg-black/20 p-3 min-w-0">
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
            <Icon className="w-3 h-3 shrink-0" />
            <span className="truncate">{label}</span>
          </div>
          <p className="text-sm font-bold font-mono text-white truncate">{value}</p>
          <p className="text-[10px] text-white/35 truncate">{meta}</p>
        </div>
      ))}
    </div>
  );
}

function SummaryBar({ positions }: { positions: VaultPosition[] }) {
  const totalSize = positions.reduce((s: number, p: VaultPosition) => s + p.sizeUsdc, 0);
  const totalPnl  = positions.reduce((s: number, p: VaultPosition) => s + p.unrealizedPnl, 0);
  const gameCount   = positions.filter(p => p.marketType === 'game').length;
  const futureCount = positions.filter(p => p.marketType === 'future').length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-4 py-3 border-b border-white/8 bg-white/2">
      {[
        { label: 'Open Positions', value: positions.length.toString() },
        { label: 'Total Exposure', value: fmtUsd(totalSize) },
        { label: 'Unrealized P&L', value: fmtUsd(totalPnl), colored: true, pos: totalPnl >= 0 },
        { label: 'Game / Future', value: `${gameCount} / ${futureCount}` },
      ].map(stat => (
        <div key={stat.label} className="text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">{stat.label}</p>
          <p className={cn(
            'text-sm font-bold font-mono',
            stat.colored ? pctColor(stat.pos ? 1 : -1) : 'text-white'
          )}>
            {stat.value}
          </p>
        </div>
      ))}
    </div>
  );
}

// ─── Main Modal ──────────────────────────────────────────────────────────────

interface VaultPositionsModalProps {
  poolId: string;
  poolName: string;
  onClose: () => void;
}

export function VaultPositionsModal({ poolId, poolName, onClose }: VaultPositionsModalProps) {
  const [positions, setPositions] = useState<VaultPosition[]>([]);
  const [balances, setBalances] = useState<PoolBalances | null>(null);
  const [summary, setSummary] = useState<PoolPositionsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    api.getPoolPositions(poolId)
      .then(data => {
        if (!cancelled) {
          setPositions(data.positions ?? []);
          setBalances(data.balances ?? null);
          setSummary(data.summary ?? null);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) setError((err as Error).message || 'Failed to load positions');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [poolId]);

  const openPositions   = positions.filter(p => p.status === 'open');
  const closedPositions = positions.filter(p => p.status !== 'open');

  return (
    <AnimatePresence>
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          key="modal"
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          transition={{ duration: 0.2 }}
          onClick={e => e.stopPropagation()}
          className="w-full max-w-4xl bg-[#0d0f18] border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
                <BarChart2 className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h2 className="font-bold text-white text-sm">{poolName} — Vault Positions</h2>
                <p className="text-xs text-muted-foreground">Vault cash, server wallet cash, and Limitless positions</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-16 gap-3 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Loading positions…</span>
              </div>
            ) : error ? (
              <div className="flex items-center gap-3 p-6 text-red-400 text-sm">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            ) : positions.length === 0 ? (
              <>
                {balances && <CashBreakdown balances={balances} summary={summary} />}
                <EmptyState />
              </>
            ) : (
              <>
                {balances && <CashBreakdown balances={balances} summary={summary} />}
                <SummaryBar positions={positions} />

                {openPositions.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-4 pt-4 pb-2">
                      Open ({openPositions.length})
                    </p>
                    {openPositions.map((p: VaultPosition) => (
                      <PositionRow key={p.id ?? p.clobOrderId ?? `${p.conditionId}-${p.selectedSide}-${p.status}`} pos={p} />
                    ))}
                  </div>
                )}

                {closedPositions.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-4 pt-4 pb-2">
                      Settled / Closed ({closedPositions.length})
                    </p>
                    {closedPositions.map((p: VaultPosition) => (
                      <PositionRow key={p.id ?? p.clobOrderId ?? `${p.conditionId}-${p.selectedSide}-${p.status}`} pos={p} />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-white/8 flex items-center justify-between">
            <p className="text-xs text-white/30">Data refreshed on open</p>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-muted-foreground hover:text-white hover:bg-white/10 transition-all"
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
