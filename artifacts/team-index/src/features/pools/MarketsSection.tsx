/**
 * Admin Markets Section — inside a PoolRow.
 *
 * Tab 1: Market Selector
 *   - Load Limitless markets by sports_data team UUID
 *   - Admin toggles markets on/off, sets manualClusterId, picks YES/NO side
 *
 * Tab 2: Allocation Engine
 *   - Admin inputs NAV
 *   - Fetches live Limitless data for selected markets
 *   - Runs the allocation algorithm
 *   - Displays full proposal table
 *   - "Accept" saves the proposal to backend
 */

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Loader2, CheckCircle, XCircle, AlertTriangle, TrendingUp,
  BarChart2, Play, RefreshCw, ExternalLink, ChevronDown, ChevronUp, ChevronRight,
  Info, Check, X as XIcon, Zap, Coins,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { API_BASE_URL } from '@/lib/config';
import {
  api,
  type LimitlessTeamMarket,
  type LimitlessMarketGroup,
  type LimitlessMarketGroupOutcome,
  type LimitlessBetResult,
} from '@/lib/api';
import type {
  SelectedMarket,
  AllocationProposal,
  ScoredAllocation,
  RejectedMarket,
  MarketType,
  MarketSide,
} from '@/types/polymarket';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtUsd(n: number) {
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function fmtPct(n: number) {
  return `${(n * 100).toFixed(1)}%`;
}

function qualityColor(score: number) {
  if (score >= 0.70) return 'text-green-400';
  if (score >= 0.45) return 'text-amber-400';
  return 'text-red-400';
}

function MarketTypeBadge({ type }: { type: MarketType }) {
  return (
    <span className={cn(
      'text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border shrink-0',
      type === 'game'
        ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
        : 'bg-purple-500/15 text-purple-400 border-purple-500/30'
    )}>
      {type === 'game' ? '⚽ Game' : '🏆 Future'}
    </span>
  );
}

function RiskBadge({ level }: { level: 'Low' | 'Medium' | 'High' }) {
  return (
    <span className={cn(
      'text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full border',
      level === 'Low'    ? 'bg-green-500/10 text-green-400 border-green-500/30' :
      level === 'Medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                           'bg-red-500/10 text-red-400 border-red-500/30'
    )}>
      {level}
    </span>
  );
}

function asNumber(value: number | string | null | undefined, fallback = 0) {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function marketQuestion(market: LimitlessTeamMarket) {
  return market.question || market.title || market.id;
}

function marketConditionId(market: LimitlessTeamMarket) {
  return market.conditionId || market.id;
}

function effectiveType(m: LimitlessTeamMarket): 'game' | 'future' {
  return m.marketType ?? (m.gameId ? 'game' : 'future');
}

// ─── Match → Market group → Outcome grouping ──────────────────────────────────

interface MarketGroupNode {
  groupId: string;
  title: string;
  kind: string | null;
  outcomes: LimitlessTeamMarket[];
}

interface MatchNode {
  key: string;
  label: string;
  startsAt: string | null;
  state: string | null;
  league: string | null;
  count: number;
  groups: MarketGroupNode[];
}

function prettyKind(kind?: string | null) {
  if (!kind) return null;
  return kind.replace(/[_-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function groupMarkets(markets: LimitlessTeamMarket[]): MatchNode[] {
  const matchMap = new Map<string, MatchNode>();

  for (const m of markets) {
    // A match is a sports_data game. Player-prop groups without a game fall
    // back to a per-group bucket so they still render under their own header.
    const matchKey = m.gameId ? `game:${m.gameId}` : `solo:${m.marketGroupId || m.id}`;
    let match = matchMap.get(matchKey);
    if (!match) {
      match = {
        key: matchKey,
        label: m.gameLabel || m.marketGroupTitle || m.eventTitle || 'Other markets',
        startsAt: m.gameStartsAt || m.gameStartTime || m.endDateIso || null,
        state: m.gameState ?? null,
        league: m.leagueName ?? null,
        count: 0,
        groups: [],
      };
      matchMap.set(matchKey, match);
    }
    // A better label may arrive on a later row (fixture group carries team names).
    if ((match.label === 'Other markets' || !match.label) && m.gameLabel) match.label = m.gameLabel;
    if (!match.startsAt && (m.gameStartsAt || m.gameStartTime)) {
      match.startsAt = m.gameStartsAt || m.gameStartTime || null;
    }
    if (!match.league && m.leagueName) match.league = m.leagueName;

    const groupKey = m.marketGroupId || m.id;
    let group = match.groups.find(g => g.groupId === groupKey);
    if (!group) {
      group = {
        groupId: groupKey,
        title: m.marketGroupTitle || marketQuestion(m),
        kind: m.marketKind ?? null,
        outcomes: [],
      };
      match.groups.push(group);
    }
    group.outcomes.push(m);
    match.count += 1;
  }

  const matches = [...matchMap.values()];
  matches.sort((a, b) => {
    const at = a.startsAt ? new Date(a.startsAt).getTime() : Number.POSITIVE_INFINITY;
    const bt = b.startsAt ? new Date(b.startsAt).getTime() : Number.POSITIVE_INFINITY;
    return at - bt;
  });
  for (const match of matches) {
    match.groups.sort((a, b) => a.title.localeCompare(b.title));
    for (const g of match.groups) {
      g.outcomes.sort((x, y) => (x.outcomeIndex ?? 99) - (y.outcomeIndex ?? 99));
    }
  }
  return matches;
}

function MatchStateBadge({ state }: { state?: string | null }) {
  if (!state) return null;
  const s = state.toLowerCase();
  const live = s === 'in_play' || s === 'live';
  const finished = s === 'finished' || s === 'ft';
  return (
    <span className={cn(
      'text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border shrink-0',
      live     ? 'bg-red-500/15 text-red-400 border-red-500/30 animate-pulse' :
      finished ? 'bg-white/5 text-white/40 border-white/10' :
                 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
    )}>
      {live ? '● Live' : finished ? 'Finished' : 'Upcoming'}
    </span>
  );
}

// ─── Tab Toggle ───────────────────────────────────────────────────────────────

type ActiveTab = 'selector' | 'engine' | 'manual';

// ─── Market Selector Tab ──────────────────────────────────────────────────────

interface MarketSelectorProps {
  poolId: string;
  sportsDataTeamId?: string | null;
  selectedMarkets: SelectedMarket[];
  onSelectionChange: (markets: SelectedMarket[]) => void;
}

function MarketSelectorTab({ sportsDataTeamId, selectedMarkets, onSelectionChange }: MarketSelectorProps) {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<LimitlessTeamMarket[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<'all' | 'game' | 'future'>('all');
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggleMatch = (key: string) =>
    setCollapsed(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const loadMarkets = useCallback(async () => {
    if (!sportsDataTeamId) {
      setResults([]);
      setSearchError('Pool is missing sportsDataTeamId.');
      return;
    }
    setSearching(true);
    setSearchError(null);
    try {
      const res = await api.getTeamLimitlessMarkets(sportsDataTeamId);
      setResults(res.markets);
    } catch (e: any) {
      setSearchError(e.message || 'Could not load Limitless markets');
    } finally {
      setSearching(false);
    }
  }, [sportsDataTeamId]);

  useEffect(() => {
    void loadMarkets();
  }, [loadMarkets]);

  const filteredResults = results.filter(m => {
    const matchesType = typeFilter === 'all' || effectiveType(m) === typeFilter;
    const q = query.trim().toLowerCase();
    if (!q) return matchesType;
    const haystack = `${marketQuestion(m)} ${m.marketGroupTitle ?? ''} ${m.gameLabel ?? ''}`.toLowerCase();
    return matchesType && haystack.includes(q);
  });

  const matches = groupMarkets(filteredResults);

  const isSelected = (conditionId: string) =>
    selectedMarkets.some(s => s.conditionId === conditionId);

  const toggleMarket = (market: LimitlessTeamMarket) => {
    const conditionId = marketConditionId(market);
    const alreadySelected = isSelected(conditionId);
    if (alreadySelected) {
      onSelectionChange(selectedMarkets.filter(s => s.conditionId !== conditionId));
      return;
    }

    const newEntry: SelectedMarket = {
      marketId:        market.id,
      conditionId,
      tokenId:         `${market.id}:${market.sideHint === 'HOME' ? '0' : '1'}`,
      eventId:         market.eventId ?? '',
      question:        marketQuestion(market),
      marketType:      market.marketType ?? 'future',
      selectedSide:    'YES',
      manualClusterId: '',
    };
    onSelectionChange([...selectedMarkets, newEntry]);
  };

  const updateSelected = (conditionId: string, patch: Partial<SelectedMarket>) => {
    onSelectionChange(
      selectedMarkets.map(s => s.conditionId === conditionId ? { ...s, ...patch } : s)
    );
  };

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Filter loaded markets…"
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-primary/50 transition-all"
          />
        </div>
        <button
          onClick={loadMarkets}
          disabled={!sportsDataTeamId || searching}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all',
            !sportsDataTeamId || searching
              ? 'bg-white/5 text-muted-foreground cursor-not-allowed'
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
          )}
        >
          {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {searching ? 'Loading…' : 'Reload'}
        </button>
      </div>

      {searchError && (
        <div className="flex items-center gap-2 p-2.5 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-300">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {searchError}
        </div>
      )}

      {/* Type filter */}
      {results.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Filter:</span>
          {(['all', 'game', 'future'] as const).map(f => (
            <button
              key={f}
              onClick={() => setTypeFilter(f)}
              className={cn(
                'text-xs px-2.5 py-1 rounded-full border transition-all font-semibold',
                typeFilter === f
                  ? 'bg-primary/20 text-primary border-primary/40'
                  : 'bg-white/5 text-muted-foreground border-white/10 hover:border-white/20'
              )}
            >
              {f === 'all' ? 'All' : f === 'game' ? '⚽ Game' : '🏆 Future'}
            </button>
          ))}
          <span className="text-xs text-muted-foreground ml-auto">{filteredResults.length} result(s)</span>
        </div>
      )}

      {/* Empty state */}
      {!searching && !searchError && results.length === 0 && (
        <div className="flex items-start gap-3 p-3 bg-white/3 border border-white/8 rounded-xl text-xs text-muted-foreground">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
          <div>
            No Limitless markets found for this sports_data team.
          </div>
        </div>
      )}

      {/* Results — grouped by match → market → outcome */}
      {matches.length > 0 && (
        <div className="space-y-3 max-h-[30rem] overflow-y-auto pr-1">
          {matches.map(match => {
            const isCollapsed = collapsed.has(match.key);
            const selectedInMatch = match.groups.reduce(
              (n, g) => n + g.outcomes.filter(o => isSelected(marketConditionId(o))).length, 0
            );
            return (
              <div key={match.key} className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
                {/* Match header */}
                <button
                  type="button"
                  onClick={() => toggleMatch(match.key)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-white/[0.03] transition-colors"
                >
                  {isCollapsed
                    ? <ChevronRight className="w-4 h-4 text-white/40 shrink-0" />
                    : <ChevronDown className="w-4 h-4 text-white/40 shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{match.label}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {match.league && (
                        <span className="text-[10px] text-white/40 truncate max-w-[160px]">{match.league}</span>
                      )}
                      {match.startsAt && (
                        <span className="text-[10px] text-blue-400/70">
                          {new Date(match.startsAt).toLocaleString(undefined, {
                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                  <MatchStateBadge state={match.state} />
                  {selectedInMatch > 0 && (
                    <span className="text-[10px] font-bold text-primary bg-primary/15 border border-primary/30 rounded-full px-2 py-0.5 shrink-0">
                      {selectedInMatch} ✓
                    </span>
                  )}
                  <span className="text-[10px] text-muted-foreground shrink-0">{match.count} mkt</span>
                </button>

                {/* Market groups */}
                {!isCollapsed && (
                  <div className="px-2.5 pb-2.5 space-y-2">
                    {match.groups.map(group => {
                      const multi = group.outcomes.length > 1;
                      const kindLabel = prettyKind(group.kind);
                      return (
                        <div key={group.groupId} className="rounded-lg border border-white/5 bg-white/[0.02] p-2">
                          {/* Group (= market) header — only for multi-outcome markets */}
                          {multi && (
                            <div className="flex items-center gap-2 mb-1.5 px-0.5">
                              <span className="text-[11px] font-semibold text-white/80 leading-snug flex-1 min-w-0">
                                {group.title}
                              </span>
                              {kindLabel && (
                                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border bg-purple-500/10 text-purple-300 border-purple-500/25 shrink-0">
                                  {kindLabel}
                                </span>
                              )}
                            </div>
                          )}
                          <div className={cn('grid gap-1.5', multi ? 'sm:grid-cols-2' : 'grid-cols-1')}>
                            {group.outcomes.map(o => {
                              const conditionId = marketConditionId(o);
                              const selected = isSelected(conditionId);
                              const label = multi ? (o.title || marketQuestion(o)) : group.title;
                              return (
                                <button
                                  type="button"
                                  key={conditionId}
                                  onClick={() => toggleMarket(o)}
                                  className={cn(
                                    'flex items-center gap-2.5 rounded-lg border p-2 text-left transition-all',
                                    selected
                                      ? 'bg-primary/10 border-primary/30'
                                      : 'bg-white/[0.02] border-white/8 hover:border-white/20'
                                  )}
                                >
                                  <div className={cn(
                                    'w-4 h-4 rounded shrink-0 flex items-center justify-center border transition-all',
                                    selected ? 'bg-primary border-primary' : 'bg-white/5 border-white/20'
                                  )}>
                                    {selected && <Check className="w-2.5 h-2.5 text-white" />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[12px] text-white leading-snug line-clamp-2">{label}</p>
                                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                      {o.yesPrice !== undefined && o.yesPrice !== null && (
                                        <span className="text-[10px] font-mono text-muted-foreground">
                                          YES {(asNumber(o.yesPrice) * 100).toFixed(0)}¢
                                        </span>
                                      )}
                                      <span className="text-[10px] text-primary/60">{o.sideHint}</span>
                                      {!multi && kindLabel && (
                                        <span className="text-[9px] font-semibold uppercase tracking-wider text-purple-300/80">
                                          {kindLabel}
                                        </span>
                                      )}
                                      {o.closed && (
                                        <span className="text-[9px] font-bold text-red-400 uppercase">Closed</span>
                                      )}
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Selected markets — configure side + cluster */}
      {selectedMarkets.length > 0 && (
        <div className="border-t border-white/8 pt-4 space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
            Selected Markets ({selectedMarkets.length}) — configure below
          </p>
          {selectedMarkets.map(sm => (
            <div key={sm.conditionId} className="bg-white/3 border border-white/8 rounded-xl p-3 space-y-2">
              <p className="text-xs text-white leading-snug">{sm.question}</p>
              <div className="flex flex-wrap gap-2 items-center">
                {/* Side selector */}
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-muted-foreground">Side:</span>
                  {(['YES', 'NO'] as MarketSide[]).map(side => (
                    <button
                      key={side}
                      onClick={() => updateSelected(sm.conditionId, { selectedSide: side })}
                      className={cn(
                        'text-[10px] font-bold px-2 py-0.5 rounded border transition-all',
                        sm.selectedSide === side
                          ? side === 'YES'
                            ? 'bg-green-500/20 text-green-400 border-green-500/40'
                            : 'bg-red-500/20 text-red-400 border-red-500/40'
                          : 'bg-white/5 text-white/40 border-white/10 hover:border-white/20'
                      )}
                    >
                      {side}
                    </button>
                  ))}
                </div>

                {/* Market type toggle */}
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-muted-foreground">Type:</span>
                  {(['game', 'future'] as MarketType[]).map(t => (
                    <button
                      key={t}
                      onClick={() => updateSelected(sm.conditionId, { marketType: t })}
                      className={cn(
                        'text-[10px] font-bold px-2 py-0.5 rounded border transition-all',
                        sm.marketType === t
                          ? t === 'game'
                            ? 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                            : 'bg-purple-500/20 text-purple-400 border-purple-500/40'
                          : 'bg-white/5 text-white/40 border-white/10 hover:border-white/20'
                      )}
                    >
                      {t === 'game' ? '⚽ Game' : '🏆 Future'}
                    </button>
                  ))}
                </div>

                {/* Remove */}
                <button
                  onClick={() => onSelectionChange(selectedMarkets.filter(s => s.conditionId !== sm.conditionId))}
                  className="ml-auto text-white/30 hover:text-red-400 transition-colors"
                >
                  <XIcon className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Cluster ID */}
              <input
                value={sm.manualClusterId ?? ''}
                onChange={e => updateSelected(sm.conditionId, { manualClusterId: e.target.value })}
                placeholder="Cluster ID (optional, e.g. psg-positive-performance)"
                className="w-full bg-white/5 border border-white/8 rounded px-2.5 py-1.5 text-[11px] text-white/70 placeholder:text-white/20 outline-none focus:border-primary/40 transition-all font-mono"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Allocation Engine Tab ─────────────────────────────────────────────────────

interface EngineTabProps {
  adminKey: string;
  poolId: string;
  poolNav: number;
  selectedMarkets: SelectedMarket[];
  proposal: AllocationProposal | null;
  onProposalReady: (p: AllocationProposal) => void;
}

function AllocationEngineTab({
  adminKey, poolId, poolNav, selectedMarkets, proposal, onProposalReady,
}: EngineTabProps) {
  const [nav, setNav] = useState(poolNav > 0 ? poolNav.toFixed(0) : '100000');
  const [running, setRunning] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [acceptMsg, setAcceptMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [showRejected, setShowRejected] = useState(false);

  const runEngine = async () => {
    if (selectedMarkets.length === 0) {
      setRunError('No markets selected. Go to Market Selector tab first.');
      return;
    }
    setRunning(true);
    setRunError(null);
    try {
      const navNum = parseFloat(nav);
      if (!Number.isFinite(navNum) || navNum <= 0) throw new Error('Invalid NAV value');

      // Run the quant engine server-side: the backend fetches a fresh Limitless
      // snapshot for each market, runs the v2 pipeline, and persists the result.
      const res = await fetch(`${API_BASE_URL}/admin/pools/${poolId}/allocation/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify({ nav: navNum, selectedMarkets }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
      onProposalReady(data.proposal as AllocationProposal);
    } catch (e: any) {
      setRunError(e.message || 'Engine failed');
    } finally {
      setRunning(false);
    }
  };

  const acceptProposal = async () => {
    if (!proposal) return;
    setAccepting(true);
    setAcceptMsg(null);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/pools/${poolId}/allocation-proposal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify({ proposal, selectedMarkets }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
      setAcceptMsg({ type: 'ok', text: 'Proposal accepted and saved.' });
    } catch (e: any) {
      setAcceptMsg({ type: 'err', text: e.message || 'Save failed' });
    } finally {
      setAccepting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1.5 block">
            Vault NAV (USDC)
          </label>
          <input
            type="number"
            value={nav}
            onChange={e => setNav(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm font-mono text-white outline-none focus:border-primary/50 transition-all w-40"
          />
        </div>
        <div className="text-xs text-muted-foreground pb-2">
          {selectedMarkets.length} market(s) selected
        </div>
        <button
          onClick={runEngine}
          disabled={running || selectedMarkets.length === 0}
          className={cn(
            'flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all',
            running || selectedMarkets.length === 0
              ? 'bg-white/5 text-muted-foreground cursor-not-allowed'
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
          )}
        >
          {running
            ? <><Loader2 className="w-4 h-4 animate-spin" />Running…</>
            : <><Play className="w-4 h-4" />Run Engine</>
          }
        </button>
      </div>

      {runError && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {runError}
        </div>
      )}

      {/* Proposal output */}
      {proposal && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'NAV', value: fmtUsd(proposal.nav) },
              { label: 'Target Exposure', value: fmtPct(proposal.targetExposure) },
              { label: 'Cash', value: `${fmtPct(proposal.cashWeight)} (${fmtUsd(proposal.cashAmount)})` },
              { label: 'Portfolio Quality', value: (proposal.portfolioQuality * 100).toFixed(0) + '%' },
            ].map(s => (
              <div key={s.label} className="bg-white/3 border border-white/8 rounded-xl p-3 text-center">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{s.label}</p>
                <p className="text-sm font-bold font-mono text-white">{s.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Selected Markets', value: proposal.allocations.length + proposal.rejectedMarkets.length },
              { label: 'Allocated Markets', value: proposal.allocations.length },
              { label: 'Rejected Markets',  value: proposal.rejectedMarkets.length },
            ].map(s => (
              <div key={s.label} className="bg-white/3 border border-white/8 rounded-xl p-3 text-center">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{s.label}</p>
                <p className="text-lg font-bold font-mono text-white">{s.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Good Markets (score ≥ 0.70)', value: proposal.goodMarketsCount },
              { label: 'Independent Good Markets',    value: proposal.independentGoodMarketsCount },
            ].map(s => (
              <div key={s.label} className="bg-white/3 border border-white/8 rounded-xl p-3 text-center">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{s.label}</p>
                <p className="text-lg font-bold font-mono text-white">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Allocation table */}
          {proposal.allocations.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                Allocation Proposal
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/8 text-muted-foreground">
                      {['Market', 'Side', 'Price', 'Score', 'Hist. Risk', 'Corr. Risk', 'Allocation', ''].map(h => (
                        <th key={h} className="text-left py-2 px-2 font-semibold uppercase tracking-wider text-[10px] first:pl-0 last:pr-0">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {proposal.allocations.map((a: ScoredAllocation) => (
                      <tr key={a.conditionId} className="border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
                        <td className="py-3 px-2 first:pl-0 max-w-[220px]">
                          <p className="text-white leading-snug line-clamp-2">{a.question}</p>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {a.reasons.slice(0, 2).map(r => (
                              <span key={r} className="text-[9px] text-white/40 bg-white/5 px-1.5 py-0.5 rounded">{r}</span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <span className={cn(
                            'text-[10px] font-bold px-1.5 py-0.5 rounded border',
                            a.selectedSide === 'YES'
                              ? 'bg-green-500/15 text-green-400 border-green-500/30'
                              : 'bg-red-500/15 text-red-400 border-red-500/30'
                          )}>
                            {a.selectedSide}
                          </span>
                        </td>
                        <td className="py-3 px-2 font-mono text-white">{(a.price * 100).toFixed(0)}¢</td>
                        <td className={cn('py-3 px-2 font-mono font-bold', qualityColor(a.qualityScore))}>
                          {(a.qualityScore * 100).toFixed(0)}
                        </td>
                        <td className="py-3 px-2"><RiskBadge level={a.historicalRisk} /></td>
                        <td className="py-3 px-2"><RiskBadge level={a.correlationRisk} /></td>
                        <td className="py-3 px-2 last:pr-0">
                          <p className="font-mono font-bold text-white">{fmtUsd(a.allocationAmount)}</p>
                          <p className="text-[10px] text-muted-foreground">{fmtPct(a.allocationWeight)}</p>
                        </td>
                        <td className="py-3 px-2 last:pr-0 text-right">
                          <span className="text-muted-foreground">
                            <ExternalLink className="w-3 h-3" />
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Cluster exposure */}
          {Object.keys(proposal.clusterExposure).length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                Cluster Exposure
              </p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(proposal.clusterExposure).map(([cluster, weight]) => (
                  <div key={cluster} className="flex items-center gap-2 bg-white/3 border border-white/8 rounded-lg px-3 py-2">
                    <span className="text-xs text-white/70 font-mono">{cluster}</span>
                    <span className="text-xs font-bold font-mono text-primary">{fmtPct(weight)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rejected markets */}
          {proposal.rejectedMarkets.length > 0 && (
            <div>
              <button
                onClick={() => setShowRejected(!showRejected)}
                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-white transition-colors"
              >
                {showRejected ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                {proposal.rejectedMarkets.length} Rejected Market(s)
              </button>
              <AnimatePresence>
                {showRejected && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mt-2 space-y-1"
                  >
                    {proposal.rejectedMarkets.map((r: RejectedMarket) => (
                      <div key={r.conditionId} className="flex items-center gap-3 p-2.5 bg-red-500/5 border border-red-500/15 rounded-lg text-xs">
                        <XIcon className="w-3.5 h-3.5 text-red-400 shrink-0" />
                        <span className="text-white/70 flex-1 min-w-0 truncate">{r.question}</span>
                        <span className="text-red-400 font-semibold shrink-0">{r.reason}</span>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Accept button */}
          <div className="flex items-center gap-3 pt-2 border-t border-white/8">
            <button
              onClick={acceptProposal}
              disabled={accepting}
              className={cn(
                'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all',
                accepting
                  ? 'bg-white/5 text-muted-foreground cursor-not-allowed'
                  : 'bg-green-500/20 text-green-300 border border-green-500/30 hover:bg-green-500/30'
              )}
            >
              {accepting
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <CheckCircle className="w-4 h-4" />
              }
              {accepting ? 'Saving…' : 'Accept Proposal'}
            </button>
            <button
              onClick={runEngine}
              disabled={running}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-white/5 border border-white/10 text-muted-foreground hover:text-white hover:bg-white/10 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Re-run
            </button>
            {acceptMsg && (
              <div className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-xs border',
                acceptMsg.type === 'ok'
                  ? 'bg-green-500/10 border-green-500/30 text-green-300'
                  : 'bg-red-500/10 border-red-500/30 text-red-300'
              )}>
                {acceptMsg.type === 'ok'
                  ? <CheckCircle className="w-3.5 h-3.5" />
                  : <XCircle className="w-3.5 h-3.5" />
                }
                {acceptMsg.text}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {!proposal && !running && !runError && (
        <div className="flex flex-col items-center gap-3 py-10 text-center border border-dashed border-white/10 rounded-xl">
          <Zap className="w-8 h-8 text-white/20" />
          <p className="text-sm text-muted-foreground">Select markets, set NAV, then run the engine.</p>
        </div>
      )}
    </div>
  );
}

// ─── Manual Bet Tab ────────────────────────────────────────────────────────────

interface ManualBetTabProps {
  poolId: string;
  adminKey: string;
  sportsDataTeamId?: string | null;
}

function ManualBetTab({ poolId, adminKey, sportsDataTeamId }: ManualBetTabProps) {
  const [groups, setGroups] = useState<LimitlessMarketGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sport, setSport] = useState('');
  const [league, setLeague] = useState('');
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  // Bet form state — keyed on the selected outcome's marketSlug
  const [selected, setSelected] = useState<LimitlessMarketGroupOutcome | null>(null);
  const [outcome, setOutcome] = useState<'yes' | 'no'>('yes');
  const [amountUsd, setAmountUsd] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [betError, setBetError] = useState<string | null>(null);
  const [betResult, setBetResult] = useState<LimitlessBetResult | null>(null);

  const toggleGroup = (groupId: string) =>
    setCollapsed(prev => {
      const next = new Set(prev);
      next.has(groupId) ? next.delete(groupId) : next.add(groupId);
      return next;
    });

  const loadGroups = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await api.getLimitlessMarketGroups(adminKey, {
        teamId: sportsDataTeamId ?? undefined,
        sport: sport.trim() || undefined,
        league: league.trim() || undefined,
      });
      setGroups(res.groups);
    } catch (e: any) {
      setLoadError(e.message || 'Could not load Limitless market groups');
    } finally {
      setLoading(false);
    }
  }, [adminKey, sportsDataTeamId, sport, league]);

  useEffect(() => {
    void loadGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminKey, sportsDataTeamId]);

  const selectOutcome = (o: LimitlessMarketGroupOutcome) => {
    setSelected(o);
    setOutcome('yes');
    setBetError(null);
    setBetResult(null);
  };

  const placeBet = async () => {
    if (!selected) return;
    setBetError(null);
    setBetResult(null);

    const amt = parseFloat(amountUsd);
    if (!Number.isFinite(amt) || amt < 0.01) {
      setBetError('Le montant doit être au minimum de 0.01 USDC.');
      return;
    }
    let maxPriceNum: number | undefined;
    if (maxPrice.trim() !== '') {
      maxPriceNum = parseFloat(maxPrice);
      if (!Number.isFinite(maxPriceNum) || maxPriceNum < 0 || maxPriceNum > 1) {
        setBetError('maxPrice doit être compris entre 0 et 1.');
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await api.placeLimitlessBet(adminKey, {
        poolId,
        marketSlug: selected.marketSlug,
        outcome,
        amountUsd: amt,
        ...(maxPriceNum !== undefined ? { maxPrice: maxPriceNum } : {}),
      });
      setBetResult(res);
    } catch (e: any) {
      setBetError(e.message || 'La mise a échoué.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap gap-2">
        <input
          value={sport}
          onChange={e => setSport(e.target.value)}
          placeholder="Sport (optionnel)"
          className="flex-1 min-w-[140px] bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-primary/50 transition-all"
        />
        <input
          value={league}
          onChange={e => setLeague(e.target.value)}
          placeholder="League (optionnel)"
          className="flex-1 min-w-[140px] bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-primary/50 transition-all"
        />
        <button
          onClick={loadGroups}
          disabled={loading}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all',
            loading
              ? 'bg-white/5 text-muted-foreground cursor-not-allowed'
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
          )}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {loading ? 'Chargement…' : 'Recharger'}
        </button>
      </div>

      {sportsDataTeamId && (
        <p className="text-[10px] text-muted-foreground">
          Filtré sur l'équipe du pool (teamId <code className="text-primary/80">{sportsDataTeamId}</code>).
        </p>
      )}

      {loadError && (
        <div className="flex items-center gap-2 p-2.5 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-300">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {loadError}
        </div>
      )}

      {/* Empty state */}
      {!loading && !loadError && groups.length === 0 && (
        <div className="flex items-start gap-3 p-3 bg-white/3 border border-white/8 rounded-xl text-xs text-muted-foreground">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
          <div>Aucun market group Limitless actif trouvé.</div>
        </div>
      )}

      {/* Market groups */}
      {groups.length > 0 && (
        <div className="space-y-3 max-h-[30rem] overflow-y-auto pr-1">
          {groups.map(group => {
            const isCollapsed = collapsed.has(group.groupId);
            const teams = group.homeTeamName && group.awayTeamName
              ? `${group.homeTeamName} vs ${group.awayTeamName}`
              : null;
            return (
              <div key={group.groupId} className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
                {/* Group header */}
                <button
                  type="button"
                  onClick={() => toggleGroup(group.groupId)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-white/[0.03] transition-colors"
                >
                  {isCollapsed
                    ? <ChevronRight className="w-4 h-4 text-white/40 shrink-0" />
                    : <ChevronDown className="w-4 h-4 text-white/40 shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{group.groupTitle}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {teams && (
                        <span className="text-[10px] text-white/60 truncate max-w-[200px]">{teams}</span>
                      )}
                      {group.league && (
                        <span className="text-[10px] text-white/40 truncate max-w-[160px]">{group.league}</span>
                      )}
                      {group.sport && (
                        <span className="text-[10px] text-white/40">{group.sport}</span>
                      )}
                      {group.startsAt && (
                        <span className="text-[10px] text-blue-400/70">
                          {new Date(group.startsAt).toLocaleString(undefined, {
                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                  <MatchStateBadge state={group.gameState} />
                  <span className="text-[10px] text-muted-foreground shrink-0">{group.outcomes.length} outcome(s)</span>
                </button>

                {/* Outcomes */}
                {!isCollapsed && (
                  <div className="px-2.5 pb-2.5 grid gap-1.5 sm:grid-cols-2">
                    {group.outcomes.map(o => {
                      const isSel = selected?.marketSlug === o.marketSlug;
                      return (
                        <button
                          type="button"
                          key={o.marketSlug}
                          onClick={() => selectOutcome(o)}
                          className={cn(
                            'flex flex-col gap-1 rounded-lg border p-2.5 text-left transition-all',
                            isSel
                              ? 'bg-primary/10 border-primary/40'
                              : 'bg-white/[0.02] border-white/8 hover:border-white/20'
                          )}
                        >
                          <p className="text-[12px] text-white leading-snug line-clamp-2">{o.title}</p>
                          <div className="flex items-center gap-2 flex-wrap">
                            {o.yesPrice !== null && (
                              <span className="text-[10px] font-mono text-green-400">
                                YES {(asNumber(o.yesPrice) * 100).toFixed(0)}¢
                              </span>
                            )}
                            {o.noPrice !== null && (
                              <span className="text-[10px] font-mono text-red-400">
                                NO {(asNumber(o.noPrice) * 100).toFixed(0)}¢
                              </span>
                            )}
                            {o.volume !== null && (
                              <span className="text-[10px] text-muted-foreground">
                                Vol {fmtUsd(asNumber(o.volume))}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Bet form */}
      {selected && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-t border-white/8 pt-4 space-y-3"
        >
          <div className="flex items-start gap-2">
            <Coins className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Mise immédiate</p>
              <p className="text-sm text-white leading-snug mt-0.5">{selected.title}</p>
              <code className="text-[10px] text-white/40 font-mono break-all">{selected.marketSlug}</code>
            </div>
            <button
              onClick={() => { setSelected(null); setBetResult(null); setBetError(null); }}
              className="text-white/30 hover:text-red-400 transition-colors"
            >
              <XIcon className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-wrap items-end gap-4">
            {/* Outcome side */}
            <div>
              <label className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1.5 block">
                Outcome
              </label>
              <div className="flex items-center gap-1">
                {(['yes', 'no'] as const).map(side => (
                  <button
                    key={side}
                    onClick={() => setOutcome(side)}
                    className={cn(
                      'text-[11px] font-bold px-3 py-1.5 rounded border uppercase transition-all',
                      outcome === side
                        ? side === 'yes'
                          ? 'bg-green-500/20 text-green-400 border-green-500/40'
                          : 'bg-red-500/20 text-red-400 border-red-500/40'
                        : 'bg-white/5 text-white/40 border-white/10 hover:border-white/20'
                    )}
                  >
                    {side}
                  </button>
                ))}
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1.5 block">
                Montant USDC
              </label>
              <input
                type="number"
                min={0.01}
                step={0.01}
                value={amountUsd}
                onChange={e => setAmountUsd(e.target.value)}
                placeholder="0.01"
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm font-mono text-white outline-none focus:border-primary/50 transition-all w-32"
              />
            </div>

            {/* Max price */}
            <div>
              <label className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1.5 block">
                maxPrice (optionnel)
              </label>
              <input
                type="number"
                min={0}
                max={1}
                step={0.01}
                value={maxPrice}
                onChange={e => setMaxPrice(e.target.value)}
                placeholder="0–1"
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm font-mono text-white outline-none focus:border-primary/50 transition-all w-32"
              />
            </div>

            <button
              onClick={placeBet}
              disabled={submitting}
              className={cn(
                'flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all',
                submitting
                  ? 'bg-white/5 text-muted-foreground cursor-not-allowed'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
              )}
            >
              {submitting
                ? <><Loader2 className="w-4 h-4 animate-spin" />Mise en cours…</>
                : <><Coins className="w-4 h-4" />Miser</>
              }
            </button>
          </div>

          {betError && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300">
              <XCircle className="w-3.5 h-3.5 shrink-0" /> {betError}
            </div>
          )}

          {betResult && (
            <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-xl text-xs text-green-300 space-y-1.5">
              <div className="flex items-center gap-2 font-semibold">
                <CheckCircle className="w-3.5 h-3.5 shrink-0" /> Mise placée avec succès.
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-green-400/60">Position ID</p>
                  <p className="font-mono text-white/90 break-all">{betResult.positionId}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-green-400/60">Outcome</p>
                  <p className="font-mono text-white/90 uppercase">{betResult.outcome}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-green-400/60">Prix exécuté</p>
                  <p className="font-mono text-white/90">{(asNumber(betResult.price) * 100).toFixed(1)}¢</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-green-400/60">Qté planifiée</p>
                  <p className="font-mono text-white/90">{betResult.plannedQuantity}</p>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

// ─── Main Export ─────────────────────────────────────────────────────────────

interface MarketsSectionProps {
  poolId: string;
  poolNav: number;
  adminKey: string;
  sportsDataTeamId?: string | null;
}

export function MarketsSection({ poolId, poolNav, adminKey, sportsDataTeamId }: MarketsSectionProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('selector');
  const [selectedMarkets, setSelectedMarkets] = useState<SelectedMarket[]>([]);
  const [proposal, setProposal] = useState<AllocationProposal | null>(null);
  const [loadingPrev, setLoadingPrev] = useState(true);

  // Load previously saved selected markets on mount
  useEffect(() => {
    setLoadingPrev(true);
    fetch(`${API_BASE_URL}/admin/pools/${poolId}/selected-markets`, {
      headers: { 'x-admin-key': adminKey },
    })
      .then(r => r.json())
      .then(data => {
        if (data.ok && Array.isArray(data.markets) && data.markets.length > 0) {
          const mapped: SelectedMarket[] = data.markets.map((m: any) => ({
            marketId:        m.marketId,
            conditionId:     m.conditionId,
            tokenId:         m.tokenId,
            eventId:         m.eventId ?? '',
            question:        m.question,
            marketType:      m.marketType ?? 'game',
            selectedSide:    m.selectedSide ?? 'YES',
            manualClusterId: m.manualClusterId ?? '',
          }));
          setSelectedMarkets(mapped);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingPrev(false));
  }, [poolId, adminKey]);

  // Auto-save selected markets to backend when they change
  const saveSelectedMarkets = useCallback(async (markets: SelectedMarket[]) => {
    if (markets.length === 0) return;
    try {
      await fetch(`${API_BASE_URL}/admin/pools/${poolId}/selected-markets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify({ markets }),
      });
    } catch {}
  }, [poolId, adminKey]);

  const handleSelectionChange = (markets: SelectedMarket[]) => {
    setSelectedMarkets(markets);
    saveSelectedMarkets(markets);
  };

  const tabs: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'selector', label: `Market Selector${selectedMarkets.length > 0 ? ` (${selectedMarkets.length})` : ''}`, icon: <Search className="w-3.5 h-3.5" /> },
    { id: 'engine',   label: 'Allocation Engine', icon: <BarChart2 className="w-3.5 h-3.5" /> },
    { id: 'manual',   label: 'Mise manuelle', icon: <Coins className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex gap-1 bg-white/3 rounded-lg p-1 border border-white/8">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex-1 justify-center',
              activeTab === tab.id
                ? 'bg-primary text-primary-foreground shadow'
                : 'text-muted-foreground hover:text-white'
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {loadingPrev ? (
        <div className="flex items-center gap-2 py-4 text-muted-foreground text-xs">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Loading saved markets…
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {activeTab === 'selector' ? (
            <motion.div key="selector" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <MarketSelectorTab
                poolId={poolId}
                sportsDataTeamId={sportsDataTeamId}
                selectedMarkets={selectedMarkets}
                onSelectionChange={handleSelectionChange}
              />
            </motion.div>
          ) : activeTab === 'engine' ? (
            <motion.div key="engine" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <AllocationEngineTab
                adminKey={adminKey}
                poolId={poolId}
                poolNav={poolNav}
                selectedMarkets={selectedMarkets}
                proposal={proposal}
                onProposalReady={setProposal}
              />
            </motion.div>
          ) : (
            <motion.div key="manual" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ManualBetTab
                poolId={poolId}
                adminKey={adminKey}
                sportsDataTeamId={sportsDataTeamId}
              />
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
