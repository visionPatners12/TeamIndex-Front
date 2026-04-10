import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { useWallets, usePrivy } from '@privy-io/react-auth';
import {
  Plus, RefreshCw, Trash2, ExternalLink, CheckCircle,
  XCircle, Loader2, Shield, Copy, Eye, EyeOff, Layers,
  AlertTriangle, ChevronDown, ChevronUp, Settings, Zap, Wallet, LogOut, Link, Search
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { API_BASE_URL, POLYGON_CHAIN, POLYGON_CHAIN_ID } from '@/lib/config';
import { useAdminPools, type BackendPool } from '@/hooks/use-pools';
import { api, type TeamEntry } from '@/lib/api';

// ─── helpers ────────────────────────────────────────────────────────────────

function copyText(text: string) {
  navigator.clipboard.writeText(text).catch(() => {});
}

async function adminFetch(path: string, adminKey: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-admin-key': adminKey,
      ...(options?.headers ?? {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
  return data;
}

// ─── Create Pool Form ────────────────────────────────────────────────────────

type CreateStep =
  | 'form'
  | 'switching-network'
  | 'waiting-metamask'
  | 'confirming-tx'
  | 'saving-db'
  | 'polymarket-setup'
  | 'done'
  | 'error';

interface CreatePoolFormProps {
  adminKey: string;
  onCreated: () => void;
}

function CreatePoolForm({ adminKey, onCreated }: CreatePoolFormProps) {
  const { wallets } = useWallets();
  const { connectWallet, logout } = usePrivy();
  const [teams, setTeams] = useState<TeamEntry[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [teamsFetchError, setTeamsFetchError] = useState<string | null>(null);
  const [mapClubName, setMapClubName] = useState('');
  const [mapPolyId, setMapPolyId] = useState('');
  const [mapSaving, setMapSaving] = useState(false);
  const [mapMsg, setMapMsg] = useState<string | null>(null);
  const [gammaSyncing, setGammaSyncing] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [teamSearch, setTeamSearch] = useState('');
  const [teamDropdownOpen, setTeamDropdownOpen] = useState(false);
  const teamComboRef = useRef<HTMLDivElement>(null);
  const teamSearchInputRef = useRef<HTMLInputElement>(null);
  const [clubName, setClubName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [depositCap, setDepositCap] = useState('200000');
  const [createStep, setCreateStep] = useState<CreateStep>('form');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    poolId: string;
    vaultAddress: string | null;
    polymarketSetup?: string;
  } | null>(null);

  const loadTeams = useCallback(async () => {
    setTeamsLoading(true);
    setTeamsFetchError(null);
    try {
      const res = await api.getTeams();
      setTeams(res.teams);
    } catch {
      setTeams([]);
      setTeamsFetchError('Could not load teams. Is the backend running? Check VITE_API_BASE_URL in .env.');
    } finally {
      setTeamsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTeams();
  }, [loadTeams]);

  const syncTeamsFromGamma = async () => {
    setGammaSyncing(true);
    setMapMsg(null);
    try {
      const data = await adminFetch('/admin/club-team-map/sync-from-gamma', adminKey, {
        method: 'POST',
        body: JSON.stringify({}),
      }) as { inserted?: number; pagesFetched?: number };
      setMapMsg(
        `Polymarket Gamma: ${data.inserted ?? 0} new row(s) added to club_teams_map (${data.pagesFetched ?? 0} page(s)).`
      );
      await loadTeams();
    } catch (err: any) {
      setMapMsg(err.message || 'Gamma sync failed');
    } finally {
      setGammaSyncing(false);
    }
  };

  const addTeamMapping = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mapClubName.trim() || !mapPolyId.trim()) return;
    setMapSaving(true);
    setMapMsg(null);
    try {
      await adminFetch('/admin/club-team-map', adminKey, {
        method: 'POST',
        body: JSON.stringify({
          internalClubName: mapClubName.trim(),
          polymarketTeamId: mapPolyId.trim(),
        }),
      });
      setMapClubName('');
      setMapPolyId('');
      setMapMsg('Mapping saved. Select the team above.');
      await loadTeams();
    } catch (err: any) {
      setMapMsg(err.message || 'Save failed');
    } finally {
      setMapSaving(false);
    }
  };

  const filteredTeams = useMemo(() => {
    const q = teamSearch.trim().toLowerCase();
    if (!q) return teams;
    return teams.filter(
      (t) =>
        t.internalClubName.toLowerCase().includes(q) ||
        t.polymarketTeamId.toLowerCase().includes(q)
    );
  }, [teams, teamSearch]);

  const handleTeamSelect = (teamId: string) => {
    setSelectedTeamId(teamId);
    setTeamSearch('');
    const team = teams.find(t => t.id === teamId);
    if (team) {
      setClubName(team.internalClubName);
      const words = team.internalClubName.trim().split(/\s+/);
      const suggested = 'p' + words.map(w => w[0]).join('').toUpperCase();
      setSymbol(suggested);
    } else {
      setClubName('');
      setSymbol('');
    }
  };

  const pickTeam = (teamId: string) => {
    handleTeamSelect(teamId);
    setTeamDropdownOpen(false);
  };

  useEffect(() => {
    if (!teamDropdownOpen) return;
    const onDocDown = (e: MouseEvent) => {
      const el = teamComboRef.current;
      if (el && !el.contains(e.target as Node)) {
        setTeamDropdownOpen(false);
        setTeamSearch('');
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setTeamDropdownOpen(false);
        setTeamSearch('');
      }
    };
    document.addEventListener('mousedown', onDocDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [teamDropdownOpen]);

  useEffect(() => {
    if (teamDropdownOpen) {
      requestAnimationFrame(() => teamSearchInputRef.current?.focus());
    }
  }, [teamDropdownOpen]);

  const selectedTeam = useMemo(
    () => teams.find((t) => t.id === selectedTeamId),
    [teams, selectedTeamId]
  );

  const stepLabel: Record<CreateStep, string> = {
    form: '',
    'switching-network': 'Switching to Polygon…',
    'waiting-metamask': 'Confirm in MetaMask…',
    'confirming-tx': 'Waiting for on-chain confirmation…',
    'saving-db': 'Saving pool to database…',
    'polymarket-setup': 'Polymarket discovery & scheduling…',
    done: 'Pool created!',
    error: '',
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clubName.trim() || !symbol.trim()) return;

    const wallet = wallets[0];
    if (!wallet) {
      setError('No wallet connected. Connect MetaMask via the main site first.');
      return;
    }

    setError(null);
    setResult(null);

    try {
      // 1. Get unsigned tx from backend (pure read — no signing)
      const depositCapUnits = Math.floor(parseFloat(depositCap) * 1_000_000);
      const prepared = await adminFetch('/admin/pools/tx/deploy-vault', adminKey, {
        method: 'POST',
        body: JSON.stringify({
          clubName: clubName.trim(),
          symbol: symbol.trim().toUpperCase(),
          depositCap: depositCapUnits,
        }),
      });

      let vaultAddress: string | null = null;

      if (prepared.alreadyDeployed) {
        // Vault already exists on-chain, skip MetaMask
        vaultAddress = prepared.vaultAddress;
      } else {
        // 2. Switch MetaMask to Polygon
        setCreateStep('switching-network');
        const provider = await wallet.getEthereumProvider();
        try {
          await provider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${POLYGON_CHAIN_ID.toString(16)}` }],
          });
        } catch (switchErr: any) {
          if (switchErr.code === 4902) throw new Error('Add Polygon network to MetaMask first.');
          throw switchErr;
        }

        // 3. Admin signs the createClubVault tx in MetaMask
        setCreateStep('waiting-metamask');
        const txHash = await provider.request({
          method: 'eth_sendTransaction',
          params: [{
            from: wallet.address,
            to: prepared.tx.to,
            data: prepared.tx.data,
          }],
        });

        // 4. Wait for on-chain confirmation
        setCreateStep('confirming-tx');
        for (let i = 0; i < 60; i++) {
          const receipt = await provider.request({
            method: 'eth_getTransactionReceipt',
            params: [txHash],
          }) as any;
          if (receipt) break;
          await new Promise(r => setTimeout(r, 2000));
        }
      }

      // 5. Create DB pool record (links polymarketTeamId from club_teams_map when team selected)
      setCreateStep('saving-db');
      const mappedTeam = teams.find((t) => t.id === selectedTeamId);
      const poolData = await adminFetch('/admin/pools', adminKey, {
        method: 'POST',
        body: JSON.stringify({
          clubName: clubName.trim(),
          symbol: symbol.trim().toUpperCase(),
          depositCap: depositCapUnits,
          vaultAddress: vaultAddress ?? undefined,
          ...(mappedTeam?.polymarketTeamId
            ? { polymarketTeamId: mappedTeam.polymarketTeamId.trim() }
            : {}),
        }),
      });

      setCreateStep('polymarket-setup');
      let polymarketSetup: string;
      try {
        await adminFetch(`/admin/${poolData.pool.id}/discover`, adminKey, {
          method: 'POST',
          body: JSON.stringify({}),
        });
        await adminFetch(`/admin/${poolData.pool.id}/schedule`, adminKey, {
          method: 'POST',
          body: JSON.stringify({}),
        });
        polymarketSetup =
          'Polymarket discovery ran and match tranches were scheduled (if candidates exist).';
      } catch (setupErr: any) {
        polymarketSetup = `Pool saved; Polymarket auto-setup failed: ${setupErr.message ?? 'unknown error'}`;
      }

      setResult({
        poolId: poolData.pool.id,
        vaultAddress: poolData.pool.vaultAddress,
        polymarketSetup,
      });
      setCreateStep('done');
      setSelectedTeamId('');
      setTeamSearch('');
      setTeamDropdownOpen(false);
      setClubName('');
      setSymbol('');
      setDepositCap('200000');
      onCreated();

    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      setCreateStep('error');
    }
  };

  const isLoading = !['form', 'done', 'error'].includes(createStep);
  const wallet = wallets[0];

  return (
    <form onSubmit={handleCreate} className="space-y-4">
      {/* Wallet status */}
      {wallet ? (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs border bg-green-500/10 border-green-500/30 text-green-300">
          <Wallet className="w-3.5 h-3.5 shrink-0" />
          <span className="flex-1">
            Admin wallet: <code className="font-mono ml-1">{wallet.address.slice(0, 8)}…{wallet.address.slice(-6)}</code>
          </span>
          <button
            type="button"
            onClick={() => connectWallet()}
            title="Switch / connect different wallet"
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all"
          >
            <Link className="w-3 h-3" /> Switch
          </button>
          <button
            type="button"
            onClick={() => logout()}
            title="Disconnect wallet"
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-red-200 transition-all"
          >
            <LogOut className="w-3 h-3" /> Disconnect
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs border bg-amber-500/10 border-amber-500/30 text-amber-300">
          <Wallet className="w-3.5 h-3.5 shrink-0" />
          <span className="flex-1">No wallet connected</span>
          <button
            type="button"
            onClick={() => connectWallet()}
            className="flex items-center gap-1 px-3 py-1 rounded bg-primary text-primary-foreground hover:bg-primary/90 font-semibold transition-all"
          >
            <Link className="w-3 h-3" /> Connect MetaMask
          </button>
        </div>
      )}

      <div>
        <label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1.5 block">
          Select Team (from Polymarket map)
        </label>
        {teamsLoading ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading teams…
          </div>
        ) : teamsFetchError ? (
          <div className="space-y-3">
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-300">
              <XCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              {teamsFetchError}
            </div>
            <button
              type="button"
              onClick={() => void loadTeams()}
              className="text-xs text-primary underline"
            >
              Retry
            </button>
          </div>
        ) : teams.length === 0 ? (
          <div className="space-y-4">
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>
                <code className="font-mono bg-black/30 px-1 rounded">club_teams_map</code> is empty. Polymarket does not push into your database — we store mappings locally so discovery uses the same names as your pools.
                Use the button below to pull teams from Polymarket&apos;s Gamma API, or run <code className="font-mono bg-black/30 px-1 rounded">npm run db:seed</code> in <code className="font-mono bg-black/30 px-1 rounded">backend</code> for a small default list.
              </span>
            </div>
            <button
              type="button"
              onClick={() => void syncTeamsFromGamma()}
              disabled={gammaSyncing}
              className="w-full sm:w-auto px-4 py-3 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {gammaSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              {gammaSyncing ? 'Fetching from Polymarket…' : 'Import teams from Polymarket (Gamma)'}
            </button>
            {mapMsg && teams.length === 0 && (
              <p className={cn('text-xs', mapMsg.toLowerCase().includes('fail') ? 'text-red-400' : 'text-green-400')}>
                {mapMsg}
              </p>
            )}
            <form onSubmit={addTeamMapping} className="rounded-lg border border-white/10 bg-white/[0.03] p-4 space-y-3">
              <p className="text-xs font-semibold text-white/80 uppercase tracking-wider">Or add one mapping manually</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase mb-1 block">Internal club name</label>
                  <input
                    value={mapClubName}
                    onChange={e => setMapClubName(e.target.value)}
                    placeholder="e.g. Arsenal"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/25 outline-none focus:border-primary/40"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase mb-1 block">Polymarket team id</label>
                  <input
                    value={mapPolyId}
                    onChange={e => setMapPolyId(e.target.value)}
                    placeholder="Gamma / team slug or id"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/25 outline-none focus:border-primary/40"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={mapSaving || !mapClubName.trim() || !mapPolyId.trim()}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-primary text-primary-foreground disabled:opacity-40"
              >
                {mapSaving ? 'Saving…' : 'Save mapping'}
              </button>
            </form>
          </div>
        ) : (
          <>
          <div className="relative" ref={teamComboRef}>
            <button
              type="button"
              disabled={isLoading}
              onClick={() => !isLoading && setTeamDropdownOpen((o) => !o)}
              aria-expanded={teamDropdownOpen}
              aria-haspopup="listbox"
              className={cn(
                'w-full flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-left outline-none transition-all disabled:opacity-50',
                teamDropdownOpen ? 'border-primary/50 ring-1 ring-primary/20' : 'hover:border-white/20'
              )}
            >
              <span
                className={cn(
                  'flex-1 min-w-0 truncate',
                  !selectedTeam && 'text-muted-foreground'
                )}
              >
                {selectedTeam
                  ? `${selectedTeam.internalClubName} · ${selectedTeam.polymarketTeamId}`
                  : '— Select a team —'}
              </span>
              <ChevronDown
                className={cn(
                  'w-4 h-4 text-muted-foreground shrink-0 transition-transform',
                  teamDropdownOpen && 'rotate-180'
                )}
              />
            </button>

            <AnimatePresence>
              {teamDropdownOpen && (
                <motion.div
                  key="team-combo-panel"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 rounded-xl border border-white/10 bg-[#0d0f18] shadow-xl shadow-black/50 overflow-hidden flex flex-col max-h-72"
                >
                  <div className="p-2 border-b border-white/10 shrink-0 bg-[#0a0c14]">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                      <input
                        ref={teamSearchInputRef}
                        type="search"
                        autoComplete="off"
                        placeholder="Search team…"
                        value={teamSearch}
                        onChange={(e) => setTeamSearch(e.target.value)}
                        onMouseDown={(e) => e.stopPropagation()}
                        className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-primary/50"
                      />
                    </div>
                  </div>
                  <div
                    className="overflow-y-auto max-h-52 divide-y divide-white/[0.06]"
                    role="listbox"
                    aria-label="Teams from map"
                  >
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => pickTeam('')}
                      className={cn(
                        'w-full text-left px-3 py-2.5 text-sm text-muted-foreground hover:bg-white/5 transition-colors',
                        !selectedTeamId && 'bg-white/[0.06]'
                      )}
                    >
                      — Clear selection —
                    </button>
                    {filteredTeams.map((t) => (
                      <button
                        type="button"
                        key={t.id}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => pickTeam(t.id)}
                        className={cn(
                          'w-full text-left px-3 py-2.5 text-sm hover:bg-white/5 transition-colors border-l-2 border-transparent',
                          selectedTeamId === t.id && 'bg-primary/15 border-l-primary text-white'
                        )}
                      >
                        <span className="font-medium">{t.internalClubName}</span>
                        <span className="text-muted-foreground text-xs"> · {t.polymarketTeamId}</span>
                      </button>
                    ))}
                    {filteredTeams.length === 0 && teamSearch.trim() !== '' && (
                      <p className="px-3 py-4 text-xs text-muted-foreground text-center">
                        No teams match &ldquo;{teamSearch.trim()}&rdquo;
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <button
              type="button"
              onClick={() => void syncTeamsFromGamma()}
              disabled={gammaSyncing}
              className="text-xs text-primary hover:underline disabled:opacity-50 flex items-center gap-1"
            >
              {gammaSyncing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
              Pull more teams from Polymarket Gamma
            </button>
            {mapMsg && teams.length > 0 && (
              <span className={cn('text-xs', mapMsg.toLowerCase().includes('fail') ? 'text-red-400' : 'text-green-400')}>
                {mapMsg}
              </span>
            )}
          </div>
          </>
        )}
        {selectedTeamId && (
          <p className="text-xs text-green-400/70 mt-1.5 flex items-center gap-1.5">
            <CheckCircle className="w-3 h-3" />
            Linked to Polymarket — positions will be taken automatically
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1.5 block">Club Name</label>
          <input
            value={clubName}
            onChange={e => setClubName(e.target.value)}
            placeholder="Auto-filled from selection"
            disabled={isLoading}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-primary/50 transition-all disabled:opacity-50"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1.5 block">Symbol</label>
          <input
            value={symbol}
            onChange={e => setSymbol(e.target.value)}
            placeholder="e.g. pAFC"
            disabled={isLoading}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-primary/50 transition-all disabled:opacity-50"
          />
        </div>
      </div>

      <div>
        <label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1.5 block">Deposit Cap (USDC)</label>
        <div className="relative">
          <input
            type="number"
            value={depositCap}
            onChange={e => setDepositCap(e.target.value)}
            disabled={isLoading}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-primary/50 transition-all pr-20 disabled:opacity-50"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-semibold">USDC</span>
        </div>
        <p className="text-xs text-white/30 mt-1">0 = unlimited</p>
      </div>

      {/* Step progress */}
      {isLoading && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20 text-sm text-primary">
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          {stepLabel[createStep]}
        </div>
      )}

      {/* Error */}
      {createStep === 'error' && error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-300">
          <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* Success */}
      {createStep === 'done' && result && (
        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-xs text-green-300 space-y-1">
          <div className="flex items-center gap-2 font-semibold"><CheckCircle className="w-4 h-4" /> Pool created!</div>
          <p>Pool ID: <code className="font-mono">{result.poolId}</code></p>
          {result.vaultAddress && (
            <p>Vault: <a href={`${POLYGON_CHAIN.blockExplorer}/address/${result.vaultAddress}`} target="_blank" rel="noopener noreferrer" className="font-mono underline">{result.vaultAddress}</a></p>
          )}
          {result.polymarketSetup && (
            <p className="text-white/70">{result.polymarketSetup}</p>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading || !selectedTeamId || !clubName.trim() || !symbol.trim() || !wallet}
        className={cn(
          'w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all',
          !isLoading && selectedTeamId && clubName.trim() && symbol.trim() && wallet
            ? 'bg-primary text-primary-foreground hover:bg-primary/90'
            : 'bg-white/5 text-muted-foreground cursor-not-allowed border border-white/10'
        )}
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
        {isLoading ? stepLabel[createStep] : 'Create Club Pool'}
      </button>
    </form>
  );
}

// ─── Pool Row ────────────────────────────────────────────────────────────────

function PoolRow({ pool, adminKey, onRefresh }: { pool: BackendPool; adminKey: string; onRefresh: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [vaultInput, setVaultInput] = useState(pool.vaultAddress ?? '');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const showMsg = (type: 'ok' | 'err', text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  };

  const saveVault = async () => {
    if (!vaultInput.match(/^0x[a-fA-F0-9]{40}$/)) {
      showMsg('err', 'Invalid address format');
      return;
    }
    setSaving(true);
    try {
      await adminFetch(`/admin/pools/${pool.id}`, adminKey, {
        method: 'PATCH',
        body: JSON.stringify({ vaultAddress: vaultInput }),
      });
      showMsg('ok', 'Vault address saved!');
      onRefresh();
    } catch (e: any) {
      showMsg('err', e.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async () => {
    setToggling(true);
    const newStatus = pool.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    try {
      await adminFetch(`/admin/pools/${pool.id}`, adminKey, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      showMsg('ok', `Pool ${newStatus === 'ACTIVE' ? 'activated' : 'paused'}`);
      onRefresh();
    } catch (e: any) {
      showMsg('err', e.message);
    } finally {
      setToggling(false);
    }
  };

  const syncPool = async () => {
    setSyncing(true);
    try {
      await adminFetch(`/admin/${pool.id}/sync`, adminKey, { method: 'POST', body: JSON.stringify({}) });
      showMsg('ok', 'Sync complete');
      onRefresh();
    } catch (e: any) {
      showMsg('err', e.message);
    } finally {
      setSyncing(false);
    }
  };

  const deletePool = async () => {
    if (!confirm(`Delete pool "${pool.clubName}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await adminFetch(`/admin/pools/${pool.id}`, adminKey, { method: 'DELETE' });
      onRefresh();
    } catch (e: any) {
      showMsg('err', e.message);
    } finally {
      setDeleting(false);
    }
  };

  const isActive = pool.status === 'ACTIVE';
  const hasVault = !!pool.vaultAddress;
  const tokenValue = parseFloat(pool.officialTokenPrice) || 0;
  const poolValue = parseFloat(pool.totalPoolValue) || 0;
  const depositCap = parseFloat(pool.depositCap) / 1e6 || 0;

  return (
    <div className="bg-white/3 border border-white/8 rounded-xl overflow-hidden">
      {/* Header row */}
      <div className="flex items-center gap-4 px-5 py-4">
        <div className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center font-bold text-base shrink-0 border',
          isActive ? 'bg-primary/20 border-primary/30 text-primary' : 'bg-white/5 border-white/10 text-muted-foreground'
        )}>
          {pool.symbol[0]}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-white">{pool.clubName}</span>
            <span className="text-xs text-muted-foreground bg-white/5 px-2 py-0.5 rounded font-mono">${pool.symbol}</span>
            <span className={cn(
              'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border',
              isActive ? 'bg-green-500/15 text-green-400 border-green-500/30' : 'bg-white/5 text-muted-foreground border-white/10'
            )}>
              {pool.status}
            </span>
            {hasVault ? (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30">
                ⛓ On-chain
              </span>
            ) : (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                ⚠ No Vault
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 font-mono truncate">{pool.id}</p>
          <p className="text-[11px] text-white/40 mt-0.5">
            Polymarket team ID:{' '}
            {pool.polymarketTeamId ? (
              <code className="text-primary/90">{pool.polymarketTeamId}</code>
            ) : (
              <span className="text-amber-400/80">not linked — recreate from mapped team or PATCH pool</span>
            )}
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-6 text-sm shrink-0">
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Token Price</p>
            <p className="font-mono font-bold text-white">${tokenValue.toFixed(4)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Pool Value</p>
            <p className="font-mono font-bold text-white">${poolValue.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Cap</p>
            <p className="font-mono font-bold text-white">{depositCap > 0 ? `$${depositCap.toLocaleString()}` : '∞'}</p>
          </div>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors shrink-0"
        >
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>
      </div>

      {/* Expanded detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/8 px-5 py-4 space-y-5">

              {/* Vault Address */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
                  Vault Contract Address (Polygon)
                </label>
                {hasVault && (
                  <div className="flex items-center gap-2 mb-2">
                    <code className="text-xs text-primary font-mono bg-primary/10 px-2 py-1 rounded">{pool.vaultAddress}</code>
                    <button onClick={() => copyText(pool.vaultAddress!)} className="text-muted-foreground hover:text-white transition-colors">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <a href={`${POLYGON_CHAIN.blockExplorer}/address/${pool.vaultAddress}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    value={vaultInput}
                    onChange={e => setVaultInput(e.target.value)}
                    placeholder="0x... vault contract address"
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm font-mono text-white placeholder:text-white/20 outline-none focus:border-primary/50 transition-all"
                  />
                  <button
                    onClick={saveVault}
                    disabled={saving || vaultInput === pool.vaultAddress}
                    className={cn(
                      'px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5',
                      saving || vaultInput === pool.vaultAddress
                        ? 'bg-white/5 text-muted-foreground cursor-not-allowed'
                        : 'bg-primary text-primary-foreground hover:bg-primary/90'
                    )}
                  >
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                    Save
                  </button>
                </div>
                {!hasVault && (
                  <p className="text-xs text-amber-400/70 mt-2 flex items-center gap-1.5">
                    <AlertTriangle className="w-3 h-3" />
                    No vault set. Run deployment script and paste the address above.
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={toggleStatus}
                  disabled={toggling}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all border',
                    isActive
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                      : 'bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20'
                  )}
                >
                  {toggling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : isActive ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                  {isActive ? 'Pause Pool' : 'Activate Pool'}
                </button>

                {hasVault && (
                  <button
                    onClick={syncPool}
                    disabled={syncing}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-white/5 border border-white/10 text-muted-foreground hover:bg-white/10 hover:text-white transition-all"
                  >
                    {syncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    Sync from Chain
                  </button>
                )}

                <button
                  onClick={deletePool}
                  disabled={deleting}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all ml-auto"
                >
                  {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  Delete
                </button>
              </div>

              {/* Feedback */}
              {msg && (
                <div className={cn(
                  'flex items-center gap-2 p-2.5 rounded-lg text-xs border',
                  msg.type === 'ok' ? 'bg-green-500/10 border-green-500/30 text-green-300' : 'bg-red-500/10 border-red-500/30 text-red-300'
                )}>
                  {msg.type === 'ok' ? <CheckCircle className="w-3.5 h-3.5 shrink-0" /> : <XCircle className="w-3.5 h-3.5 shrink-0" />}
                  {msg.text}
                </div>
              )}

              {/* Deployment guide if no vault */}
              {!hasVault && (
                <div className="bg-black/30 border border-white/8 rounded-xl p-4">
                  <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Deploy Vault On-chain</p>
                  <p className="text-xs text-muted-foreground mb-3">
                    Run this in terminal to create the vault via ClubVaultFactory:
                  </p>
                  <code className="block text-xs text-white/70 bg-white/5 border border-white/8 rounded-lg p-3 font-mono whitespace-pre-wrap break-all">
{`cd smartContract
FACTORY_ADDRESS=<your_factory>\\
CLUB_NAME="${pool.clubName}"\\
VAULT_SYMBOL="${pool.symbol}"\\
DEPOSIT_CAP_USDC="${(parseFloat(pool.depositCap) / 1e6 || 200000).toFixed(0)}"\\
npx hardhat run scripts/create-club-vault.js --network polygon`}
                  </code>
                  <p className="text-xs text-muted-foreground mt-2">Then paste the printed vault address above.</p>
                </div>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Admin Page ─────────────────────────────────────────────────────────

export default function Admin() {
  const [adminKey, setAdminKey] = useState(() => localStorage.getItem('admin_key') || '');
  const [keyInput, setKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [authenticated, setAuthenticated] = useState(() => !!localStorage.getItem('admin_key'));
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const queryClient = useQueryClient();

  const { data: pools, isLoading, isError, refetch } = useAdminPools(adminKey);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    try {
      const res = await fetch(`${API_BASE_URL}/pools`, {
        headers: { 'x-admin-key': keyInput },
      });
      if (res.status === 403) {
        setAuthError('Invalid admin key');
        setAuthLoading(false);
        return;
      }
      localStorage.setItem('admin_key', keyInput);
      setAdminKey(keyInput);
      setAuthenticated(true);
    } catch {
      setAuthError('Cannot reach backend');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_key');
    setAdminKey('');
    setAuthenticated(false);
    setKeyInput('');
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-pools'] });
    queryClient.invalidateQueries({ queryKey: ['pools'] });
  };

  // ─── Auth screen ───────────────────────────────────────────────────────────
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <div className="bg-[#0d0f18] border border-white/10 rounded-2xl p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Admin Panel</h1>
                <p className="text-xs text-muted-foreground">Pryzen Team Index</p>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                  Admin API Key
                </label>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={keyInput}
                    onChange={e => setKeyInput(e.target.value)}
                    placeholder="Enter admin key…"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-primary/50 transition-all pr-10"
                  />
                  <button type="button" onClick={() => setShowKey(!showKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors">
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {authError && (
                <p className="text-xs text-red-400 flex items-center gap-1.5">
                  <XCircle className="w-3.5 h-3.5" /> {authError}
                </p>
              )}

              <button type="submit" disabled={!keyInput || authLoading}
                className={cn(
                  'w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all',
                  keyInput && !authLoading ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-white/5 text-muted-foreground cursor-not-allowed'
                )}
              >
                {authLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                {authLoading ? 'Verifying…' : 'Enter Admin Panel'}
              </button>
            </form>

            <p className="text-xs text-muted-foreground/50 text-center mt-6">
              Key is set via <code className="text-white/40">ADMIN_API_KEY</code> in backend .env
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── Main admin dashboard ──────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-white/8 bg-[#0a0b12]/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
              <Layers className="w-5 h-5 text-primary" />
            </a>
            <span className="text-white/20">/</span>
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-primary" />
              <span className="font-bold text-white text-sm">Admin Panel</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleRefresh} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-muted-foreground hover:text-white hover:bg-white/10 transition-all">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
            <button onClick={handleLogout} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-muted-foreground hover:text-red-400 transition-all">
              Log Out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Pools', value: pools?.length ?? '—' },
            { label: 'Active', value: pools?.filter(p => p.status === 'ACTIVE').length ?? '—' },
            { label: 'With Vault', value: pools?.filter(p => !!p.vaultAddress).length ?? '—' },
            { label: 'Paused', value: pools?.filter(p => p.status === 'PAUSED').length ?? '—' },
          ].map(stat => (
            <div key={stat.label} className="bg-white/3 border border-white/8 rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
              <p className="text-2xl font-bold font-mono text-white">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Create Pool */}
        <div className="bg-[#0d0f18] border border-white/10 rounded-2xl overflow-hidden">
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="w-full flex items-center justify-between px-6 py-5 hover:bg-white/3 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
                <Plus className="w-4 h-4 text-primary" />
              </div>
              <div className="text-left">
                <p className="font-bold text-white text-sm">Create New Pool</p>
                <p className="text-xs text-muted-foreground">Deploy a new club pool on Polygon via ClubVaultFactory</p>
              </div>
            </div>
            {showCreate ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>
          <AnimatePresence>
            {showCreate && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                <div className="border-t border-white/8 px-6 py-5">
                  <CreatePoolForm adminKey={adminKey} onCreated={() => { setShowCreate(false); handleRefresh(); }} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Pool List */}
        <div>
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" /> Live Pools ({pools?.length ?? 0})
          </h2>

          {isLoading ? (
            <div className="flex items-center justify-center py-16 gap-3 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading pools…</span>
            </div>
          ) : isError ? (
            <div className="text-center py-12 text-red-400 text-sm">
              Failed to load pools. Check backend is running.
            </div>
          ) : pools?.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-white/10 rounded-2xl">
              <Plus className="w-10 h-10 text-white/20 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No pools yet. Create one above.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pools?.map(pool => (
                <PoolRow key={pool.id} pool={pool} adminKey={adminKey} onRefresh={handleRefresh} />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
