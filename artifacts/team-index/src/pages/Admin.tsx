import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import {
  Plus, RefreshCw, Trash2, ExternalLink, CheckCircle,
  XCircle, Loader2, Shield, Copy, Eye, EyeOff, Layers,
  AlertTriangle, ChevronDown, ChevronUp, Settings, Zap, Link, Search
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { API_BASE_URL, BASE_CHAIN } from '@/lib/config';
import {
  useAdminPools,
  tokenPriceUsdPerWholeShare,
  totalPoolValueToHuman,
  depositCapToHuman,
  type BackendPool,
} from '@/hooks/use-pools';
import { api, type TeamEntry } from '@/lib/api';
import { MarketsSection } from '@/features/pools/MarketsSection';

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
  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    // Non-JSON response (HTML 404/502 page) — usually the backend isn't deployed/reachable
    // or VITE_API_BASE_URL points to the wrong host.
    const snippet = text.slice(0, 120).replace(/\s+/g, ' ').trim();
    throw new Error(
      `Backend returned non-JSON (HTTP ${res.status}) for ${path}. ` +
      `Is the backend deployed & reachable, and VITE_API_BASE_URL correct? ${snippet}`
    );
  }
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
  return data;
}

type CreatePoolResponse = {
  ok: boolean;
  pool: {
    id: string;
    vaultAddress: string | null;
  };
  vaultDeployment?: {
    vaultAddress: string;
    created: boolean;
  } | null;
};

function usdcHumanToRawString(value: string) {
  const clean = value.trim();
  if (!clean) return '0';
  if (!/^\d+(\.\d{1,6})?$/.test(clean)) {
    throw new Error('Deposit cap must be a positive USDC amount with up to 6 decimals.');
  }

  const [whole, fraction = ''] = clean.split('.');
  const raw =
    BigInt(whole || '0') * 1_000_000n +
    BigInt(fraction.padEnd(6, '0') || '0');
  return raw.toString();
}

// ─── Create Pool Form ────────────────────────────────────────────────────────

type CreateStep =
  | 'form'
  | 'deploying-vault'
  | 'saving-db'
  | 'linking-limitless'
  | 'done'
  | 'error';

interface CreatePoolFormProps {
  adminKey: string;
  onCreated: () => void;
}

function CreatePoolForm({ adminKey, onCreated }: CreatePoolFormProps) {
  const [teams, setTeams] = useState<TeamEntry[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [teamsFetchError, setTeamsFetchError] = useState<string | null>(null);
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
    vaultAlreadyDeployed: boolean;
    limitlessLinked: boolean;
    limitlessLinkError?: string;
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

  const filteredTeams = useMemo(() => {
    const q = teamSearch.trim().toLowerCase();
    if (!q) return teams;
    return teams.filter((t) => t.name.toLowerCase().includes(q));
  }, [teams, teamSearch]);

  const handleTeamSelect = (teamId: string) => {
    setSelectedTeamId(teamId);
    setTeamSearch('');
    const team = teams.find(t => t.id === teamId);
    if (team) {
      setClubName(team.name);
      const words = team.name.trim().split(/\s+/);
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
    'deploying-vault': 'Deploying vault via backend owner wallet…',
    'saving-db': 'Saving pool to database…',
    'linking-limitless': 'Linking Limitless server wallet…',
    done: 'Pool created!',
    error: '',
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clubName.trim() || !symbol.trim()) return;

    setError(null);
    setResult(null);

    try {
      const normalizedClubName = clubName.trim();
      const normalizedSymbol = symbol.trim().toUpperCase();
      const depositCapRaw = usdcHumanToRawString(depositCap);
      const mappedTeam = teams.find((t) => t.id === selectedTeamId);
      if (!mappedTeam) throw new Error('Select a sports_data team before creating the pool.');

      // The factory is onlyOwner; the backend owner wallet deploys the vault.
      setCreateStep('deploying-vault');
      const poolData = await adminFetch('/admin/pools', adminKey, {
        method: 'POST',
        body: JSON.stringify({
          clubName: normalizedClubName,
          symbol: normalizedSymbol,
          depositCap: depositCapRaw,
          deployOnchain: true,
          sportsDataTeamId: mappedTeam.id,
          riskParams: {
            maxPerMatchPct: 3,
            maxTotalExposurePct: 20,
            liquidityMinUsd: 50000,
          },
        }),
      }) as CreatePoolResponse;
      setCreateStep('saving-db');

      const vaultAddress = poolData.pool.vaultAddress ?? poolData.vaultDeployment?.vaultAddress ?? null;
      if (!vaultAddress) {
        throw new Error('Pool created, but the backend did not return a vault address.');
      }
      const vaultAlreadyDeployed = poolData.vaultDeployment?.created === false;

      let limitlessLinked = false;
      let limitlessLinkError: string | undefined;
      setCreateStep('linking-limitless');
      try {
        const linked = await adminFetch('/admin/limitless/server-wallet-accounts', adminKey, {
          method: 'POST',
          body: JSON.stringify({ poolId: poolData.pool.id }),
        });
        const first = linked.results?.[0];
        limitlessLinked = !!first?.serverWalletProfileId && !!first?.serverWalletAddress && !first?.error;
        if (!limitlessLinked && first?.error) limitlessLinkError = first.error;
      } catch (e: any) {
        limitlessLinkError = e.message || 'Limitless server-wallet link failed';
      }

      setResult({
        poolId: poolData.pool.id,
        vaultAddress,
        vaultAlreadyDeployed,
        limitlessLinked,
        limitlessLinkError,
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

  return (
    <form onSubmit={handleCreate} className="space-y-4">
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs border bg-primary/10 border-primary/30 text-primary">
        <Shield className="w-3.5 h-3.5 shrink-0" />
        <span className="flex-1">Vault deployment is signed by the backend owner wallet. No MetaMask factory transaction is required.</span>
      </div>

      <div>
        <label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1.5 block">
          Select Team
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
          <div className="space-y-3">
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>No teams returned from sports_data.limitless_team.</span>
            </div>
            <button
              type="button"
              onClick={() => void loadTeams()}
              className="w-full sm:w-auto px-4 py-3 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Reload teams
            </button>
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
                  ? selectedTeam.name
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
                    aria-label="Sports data teams"
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
                        <span className="font-medium">{t.name}</span>
                        <span className="text-muted-foreground text-xs"> · {t.id}</span>
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
              onClick={() => void loadTeams()}
              className="text-xs text-primary hover:underline disabled:opacity-50 flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              Reload teams
            </button>
          </div>
          </>
        )}
        {selectedTeamId && (
          <p className="text-xs text-green-400/70 mt-1.5 flex items-center gap-1.5">
            <CheckCircle className="w-3 h-3" />
            Linked to sports_data team — markets will be fetched by UUID
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
          <p>{result.vaultAlreadyDeployed ? 'Vault already deployed; reused existing vault.' : 'Vault deployed and confirmed on Base.'}</p>
          <p>{result.limitlessLinked ? 'Limitless server wallet linked on-chain.' : 'Limitless server wallet not linked yet.'}</p>
          {result.limitlessLinkError && <p className="text-amber-300">Limitless: {result.limitlessLinkError}</p>}
          {result.vaultAddress && (
            <p>Vault: <a href={`${BASE_CHAIN.blockExplorer}/address/${result.vaultAddress}`} target="_blank" rel="noopener noreferrer" className="font-mono underline">{result.vaultAddress}</a></p>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading || !selectedTeamId || !clubName.trim() || !symbol.trim()}
        className={cn(
          'w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all',
          !isLoading && selectedTeamId && clubName.trim() && symbol.trim()
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

interface LimitlessAccount {
  limitlessProfileId: string | null;
  accountAddress: string | null;
  status: string | null;
  allowanceStatus: string | null;
  serverWallet: boolean | null;
  displayName: string | null;
}

function LimitlessServerWalletSection({ poolId, adminKey, vaultAddress }: { poolId: string; adminKey: string; vaultAddress: string | null }) {
  const [account, setAccount] = useState<LimitlessAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [linking, setLinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminFetch(`/admin/pools/${poolId}/limitless-account`, adminKey);
      setAccount(data.account ?? null);
    } catch (e: any) {
      setError(e.message || 'Could not load Limitless server wallet');
    } finally {
      setLoading(false);
    }
  }, [poolId, adminKey]);

  useEffect(() => { void load(); }, [load]);

  const linkServerWallet = async () => {
    setLinking(true);
    setError(null);
    setActionMsg(null);
    try {
      const data = await adminFetch('/admin/limitless/server-wallet-accounts', adminKey, {
        method: 'POST',
        body: JSON.stringify({ poolId }),
      });
      const r = data.results?.[0];
      if (r?.error) {
        setActionMsg(`Échec : ${r.error}`);
      } else if (r?.serverWalletProfileId) {
        const wallet = r.serverWalletAddress ? ` (${r.serverWalletAddress})` : '';
        setActionMsg(`Server wallet ${r.action ?? 'lié'} : #${r.serverWalletProfileId}${wallet}`);
      } else {
        setActionMsg(data.total === 0 ? 'Aucun pool traité par le backend.' : 'Aucun résultat retourné.');
      }
      await load();
    } catch (e: any) {
      setError(e.message || 'Liaison server wallet échouée');
    } finally {
      setLinking(false);
    }
  };

  const hasProfile = !!account?.limitlessProfileId;
  const isServerWallet = account?.serverWallet === true;
  const hasLegacyProfile = hasProfile && !isServerWallet;

  return (
    <div className="border-t border-white/8 pt-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-6 h-6 rounded-md bg-primary/20 border border-primary/30 flex items-center justify-center">
          <Link className="w-3 h-3 text-primary" />
        </div>
        <p className="text-xs font-bold uppercase tracking-wider text-white">Server wallet Limitless</p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Chargement…
        </div>
      ) : hasProfile ? (
        <div className={cn(
          'flex items-start gap-2 p-3 rounded-xl border text-xs',
          isServerWallet
            ? 'bg-green-500/10 border-green-500/30'
            : 'bg-amber-500/10 border-amber-500/30'
        )}>
          {isServerWallet ? (
            <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          )}
          <div className="space-y-2 min-w-0 flex-1">
            <p className={cn('font-semibold', isServerWallet ? 'text-green-300' : 'text-amber-300')}>
              {isServerWallet ? 'Server wallet lié on-chain' : 'Profil legacy détecté'}
            </p>
            <p className="text-white/80 font-mono">Profile ID : {account!.limitlessProfileId}</p>
            {account!.accountAddress && (
              <p className="text-white/50 font-mono break-all">wallet : {account!.accountAddress}</p>
            )}
            {account!.displayName && <p className="text-white/50">name: {account!.displayName}</p>}
            <div className="flex gap-2 flex-wrap mt-1">
              <span className={cn(
                'text-[10px] px-1.5 py-0.5 rounded',
                isServerWallet ? 'bg-green-500/15 text-green-300' : 'bg-amber-500/15 text-amber-300'
              )}>
                mode: {isServerWallet ? 'server wallet' : 'legacy vault account'}
              </span>
              {account!.status && <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/60">status: {account!.status}</span>}
              {account!.allowanceStatus && <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/60">allowance: {account!.allowanceStatus}</span>}
            </div>
            {hasLegacyProfile && (
              <p className="text-amber-200/80">
                Les mises doivent passer par un server wallet lié au vault. Relance la liaison pour créer ce compte et l'autoriser on-chain.
              </p>
            )}
            <button
              onClick={linkServerWallet}
              disabled={linking || !vaultAddress}
              className={cn(
                'inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all',
                linking || !vaultAddress
                  ? 'bg-white/5 text-muted-foreground cursor-not-allowed'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
              )}
            >
              {linking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Link className="w-3.5 h-3.5" />}
              {isServerWallet ? 'Vérifier / relier on-chain' : 'Créer / lier server wallet'}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Aucun server wallet Limitless lié à ce pool. Crée-le pour que les mises utilisent le wallet serveur autorisé par le vault.</span>
          </div>
          <button
            onClick={linkServerWallet}
            disabled={linking || !vaultAddress}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all',
              linking || !vaultAddress
                ? 'bg-white/5 text-muted-foreground cursor-not-allowed'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            )}
          >
            {linking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {linking ? 'Liaison…' : 'Créer / lier server wallet'}
          </button>
          {!vaultAddress && (
            <p className="text-[11px] text-amber-400/70">Définis d'abord l'adresse du vault ci-dessus.</p>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 mt-3 p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-300">
          <XCircle className="w-3.5 h-3.5 shrink-0" /> {error}
        </div>
      )}
      {actionMsg && !error && (
        <div className="mt-3 p-2.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white/70">{actionMsg}</div>
      )}
    </div>
  );
}

function PoolRow({ pool, adminKey, onRefresh }: { pool: BackendPool; adminKey: string; onRefresh: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [vaultInput, setVaultInput] = useState(pool.vaultAddress ?? '');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [redeploying, setRedeploying] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    setVaultInput(pool.vaultAddress ?? '');
  }, [pool.vaultAddress]);

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

  const redeployVault = async () => {
    if (!confirm(`Redéployer un nouveau vault pour "${pool.clubName}" ? À faire seulement après migration des fonds ou si l'ancien vault est vide.`)) return;
    setRedeploying(true);
    try {
      const data = await adminFetch(`/admin/pools/${pool.id}/redeploy-vault`, adminKey, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      const newVault = data.deployment?.vaultAddress ?? data.vaultAddress ?? data.pool?.vaultAddress ?? null;
      if (newVault) setVaultInput(newVault);
      showMsg('ok', newVault ? `New vault deployed: ${newVault}` : 'Vault redeployed');
      onRefresh();
    } catch (e: any) {
      showMsg('err', e.message);
    } finally {
      setRedeploying(false);
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
  const tokenValue = tokenPriceUsdPerWholeShare(pool);
  const poolValue = totalPoolValueToHuman(pool.totalPoolValue);
  const rawCap = Number(pool.depositCap);
  const capUnlimited = !Number.isFinite(rawCap) || rawCap <= 0;
  const depositCap = capUnlimited ? 0 : depositCapToHuman(pool.depositCap);

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
            sports_data team ID:{' '}
            {pool.sportsDataTeamId ? (
              <code className="text-primary/90">{pool.sportsDataTeamId}</code>
            ) : (
              <span className="text-amber-400/80">not linked — recreate from a sports_data team or PATCH pool</span>
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
                  Vault Contract Address (Base)
                </label>
                {hasVault && (
                  <div className="flex items-center gap-2 mb-2">
                    <code className="text-xs text-primary font-mono bg-primary/10 px-2 py-1 rounded">{pool.vaultAddress}</code>
                    <button onClick={() => copyText(pool.vaultAddress!)} className="text-muted-foreground hover:text-white transition-colors">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <a href={`${BASE_CHAIN.blockExplorer}/address/${pool.vaultAddress}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
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
                    No vault set. Deploy or redeploy from the backend, then paste the address above if needed.
                  </p>
                )}
                {hasVault && (
                  <p className="text-xs text-white/35 mt-2">
                    Pour les anciens vaults, redéploie via la nouvelle factory afin d'autoriser le server wallet on-chain.
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
                  onClick={redeployVault}
                  disabled={redeploying}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 transition-all"
                >
                  {redeploying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Layers className="w-3.5 h-3.5" />}
                  Redeploy Vault
                </button>

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
                    Use the admin redeploy action to create a vault with the current factory, then link the Limitless server wallet below.
                  </p>
                </div>
              )}

              {/* ─── Limitless server wallet ─────────────────────────── */}
              <LimitlessServerWalletSection
                poolId={pool.id}
                adminKey={adminKey}
                vaultAddress={pool.vaultAddress}
              />

              {/* ─── Markets & Allocation Engine ─────────────────────── */}
              <div className="border-t border-white/8 pt-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 rounded-md bg-primary/20 border border-primary/30 flex items-center justify-center">
                    <Zap className="w-3 h-3 text-primary" />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-wider text-white">
                    Limitless Markets & Allocation
                  </p>
                </div>
                <MarketsSection
                  poolId={pool.id}
                  poolNav={totalPoolValueToHuman(pool.totalPoolValue)}
                  adminKey={adminKey}
                  sportsDataTeamId={pool.sportsDataTeamId}
                />
              </div>

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
                <p className="text-xs text-muted-foreground">Deploy a new club pool on Base via ClubVaultFactory</p>
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
