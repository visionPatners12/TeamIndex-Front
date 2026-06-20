import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ArrowRight,
  Info,
  CheckCircle,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { formatUnits, parseUnits } from 'viem';
import { cn } from '@/lib/utils';
import type { PoolData } from '@/types/pool';
import { truncateAddr } from '@/utils/address';
import { formatPoolName } from '@/utils/pool';
import { ApiError, api } from '@/lib/api';
import { useBaseUsdcDeposit, type TxStatus } from '@/hooks/use-wallet-tx';
import { BASE_CHAIN } from '@/lib/config';

type Network = 'base';
type Step = 'select' | 'confirm' | 'processing' | 'success' | 'error';

interface DepositModalProps {
  pool: PoolData | null;
  onClose: () => void;
  walletAddress?: string;
  onConnectWallet?: () => void;
}

const UsdcIcon = ({ size = 24 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} fill="none" viewBox="0 0 24 24">
    <path fill="#0B53BF" d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18" />
    <path fill="#fff" d="M13.62 5.45v1.159a5.64 5.64 0 0 1 4.005 5.394 5.64 5.64 0 0 1-4.005 5.394v1.16a6.74 6.74 0 0 0 5.13-6.554 6.74 6.74 0 0 0-5.13-6.553m-7.245 6.553a5.64 5.64 0 0 1 4.005-5.394V5.45a6.74 6.74 0 0 0-5.13 6.553 6.74 6.74 0 0 0 5.13 6.553v-1.159a5.63 5.63 0 0 1-4.005-5.394" />
    <path fill="#fff" d="M14.419 13.258c0-2.301-3.606-1.356-3.606-2.627 0-.456.366-.748 1.063-.748.833 0 1.12.405 1.21.95h1.147c-.102-1.024-.69-1.67-1.67-1.863v-.904h-1.125v.872c-1.075.137-1.75.762-1.75 1.693 0 2.312 3.611 1.445 3.611 2.694 0 .472-.455.787-1.226.787-1.007 0-1.339-.444-1.462-1.057H9.49c.073 1.122.764 1.823 1.947 1.999v.886h1.125v-.875c1.153-.149 1.856-.82 1.856-1.807" />
  </svg>
);

const BaseIcon = ({ size = 24 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} fill="none" viewBox="0 0 24 24">
    <path fill="#00F" d="M3 4.706c0-.585 0-.877.11-1.101.106-.215.28-.39.496-.495C3.83 3 4.122 3 4.706 3h14.588c.585 0 .876 0 1.101.11.215.105.389.28.494.495.111.225.111.517.111 1.101v14.588c0 .585 0 .876-.11 1.101-.106.215-.28.389-.495.494-.225.111-.517.111-1.101.111H4.706c-.585 0-.876 0-1.101-.11a1.08 1.08 0 0 1-.494-.495C3 20.17 3 19.878 3 19.294z" />
  </svg>
);

function ChainIcon({ size = 24 }: { size?: number }) {
  return <BaseIcon size={size} />;
}

const NETWORK_CONFIG = {
  base: {
    name: 'Base',
    asset: 'USDC',
    assetFull: 'USD Coin',
    color: '#0052FF',
    colorLight: 'rgba(0, 82, 255, 0.15)',
    colorBorder: 'rgba(0, 82, 255, 0.35)',
    chain: 'Base',
    receives: 'Index token',
    receiveDesc: 'You deposit Base USDC and receive the index token that represents your share of the team pool on Base.',
    minAmount: 0.01,
    maxAmount: 100000,
    placeholder: '0.01',
    decimals: 6,
    rate: 1,
  },
};

const PRESET_AMOUNTS: Record<Network, number[]> = {
  base: [50, 100, 500, 1000],
};

function statusLabel(s: TxStatus): string {
  switch (s) {
    case 'switching':   return 'Switching network…';
    case 'approving':   return 'Approve token in wallet…';
    case 'sending':     return 'Confirm deposit in wallet…';
    case 'confirming':  return 'Waiting for confirmation…';
    default:            return '';
  }
}

function baseDepositStatusLabel(status?: string | null): string {
  switch (status) {
    case 'RECEIVED':
      return 'Base deposit received';
    case 'BRIDGING':
      return 'Preparing the Base pool deposit';
    case 'DEPOSITING':
      return 'Depositing into the Base index vault';
    case 'MINTING_SHARES':
      return 'Minting index tokens on Base';
    case 'COMPLETED':
      return 'Index tokens minted on Base';
    case 'FAILED':
      return 'Deposit processing failed';
    case 'NEEDS_MANUAL_RECONCILIATION':
      return 'Manual reconciliation needed';
    default:
      return 'Waiting for backend indexing';
  }
}

function formatRawTokenAmount(raw?: string, decimals = 18, maxFractionDigits = 6): string {
  if (!raw) return '0';
  try {
    return Number(formatUnits(BigInt(raw), decimals)).toLocaleString(undefined, {
      maximumFractionDigits: maxFractionDigits,
    });
  } catch {
    return '0';
  }
}

export function DepositModal({ pool, onClose, walletAddress, onConnectWallet }: DepositModalProps) {
  const queryClient = useQueryClient();
  const [network, setNetwork] = useState<Network>('base');
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<Step>('select');
  const [agreed, setAgreed] = useState(false);
  const [depositError, setDepositError] = useState<string | null>(null);
  const [finalTxHash, setFinalTxHash] = useState<string | null>(null);
  const [finalTxLink, setFinalTxLink] = useState<string | null>(null);

  const baseHook = useBaseUsdcDeposit();

  const config = NETWORK_CONFIG[network];
  const numAmount = parseFloat(amount) || 0;
  const usdValue = numAmount * config.rate;
  const FEE_PCT = 0;
  const usdValueAfterFee = usdValue * (1 - FEE_PCT);
  const tokensReceived = pool ? usdValueAfterFee / pool.tokenValue : 0;
  const vaultReady = !!pool?.vaultAddress;

  const targetUsdcRaw = useMemo(() => {
    try {
      return parseUnits(amount || '0', 6).toString();
    } catch {
      return '0';
    }
  }, [amount]);
  const isValidAmount =
    numAmount >= config.minAmount && numAmount <= config.maxAmount;
  const displayedTokensReceived = tokensReceived;
  const amountTokenLabel = config.asset;
  const amountPlaceholder = config.placeholder;
  const { data: baseDepositsData, isFetching: baseDepositsFetching } = useQuery({
    queryKey: ['base-deposits', walletAddress],
    queryFn: () => api.getBaseDeposits(walletAddress!),
    enabled: network === 'base' && !!walletAddress && step === 'success',
    refetchInterval: network === 'base' && step === 'success' ? 5000 : false,
  });
  const currentBaseDeposit = useMemo(() => {
    if (!pool) return null;
    const deposits = baseDepositsData?.deposits ?? [];
    const normalizedTxHash = finalTxHash?.toLowerCase();
    return (
      deposits.find((deposit) =>
        normalizedTxHash && deposit.baseTxHash?.toLowerCase() === normalizedTxHash
      ) ??
      deposits.find((deposit) => deposit.clubPoolId === pool.id) ??
      null
    );
  }, [baseDepositsData?.deposits, finalTxHash, pool]);
  const baseMintTxLink = currentBaseDeposit?.baseMintTxHash
    ? `${BASE_CHAIN.blockExplorer}/tx/${currentBaseDeposit.baseMintTxHash}`
    : null;

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const refreshPoolViews = useCallback(async () => {
    if (!pool) return;
    await queryClient.invalidateQueries({ queryKey: ["pools"] });
    await queryClient.invalidateQueries({ queryKey: ["pool", pool.id] });
    await queryClient.refetchQueries({ queryKey: ["pools"] });
    await queryClient.refetchQueries({ queryKey: ["pool", pool.id] });
    const bump = () => {
      void queryClient.invalidateQueries({ queryKey: ["pools"] });
      void queryClient.invalidateQueries({ queryKey: ["pool", pool.id] });
    };
    setTimeout(bump, 3000);
    setTimeout(bump, 12_000);
  }, [pool, queryClient]);

  const handleDeposit = useCallback(async () => {
    if (!pool || !walletAddress || !isValidAmount) return;

    setStep('processing');
    setDepositError(null);
    setFinalTxLink(null);

    try {
      const rawAmount = BigInt(targetUsdcRaw);
      if (rawAmount < parseUnits(String(config.minAmount), config.decimals)) {
        throw new Error(`Minimum deposit is ${config.minAmount.toLocaleString()} ${config.asset}.`);
      }

      const prepared = await api.prepareBaseUsdcDeposit(pool.id, rawAmount.toString());
      const hash = await baseHook.deposit(prepared.txs.approveTx, prepared.txs.depositTx, walletAddress);
      setFinalTxHash(hash ?? null);
      if (hash) {
        try {
          await api.confirmBaseDeposit(hash);
        } catch (err) {
          if (err instanceof ApiError && err.code === 'RPC_RATE_LIMITED') {
            setDepositError('Deposit confirmed on Base. Backend indexing is delayed and will update shortly.');
          } else {
            throw err;
          }
        }
      }
      await queryClient.invalidateQueries({ queryKey: ['base-deposits', walletAddress] });
      await refreshPoolViews();
      setStep('success');
    } catch (err: any) {
      setDepositError(err.message || 'Transaction failed');
      setStep('error');
    }
  }, [
    pool,
    walletAddress,
    isValidAmount,
    targetUsdcRaw,
    config.minAmount,
    config.decimals,
    config.asset,
    baseHook,
    refreshPoolViews,
    queryClient,
  ]);

  const handleReset = () => {
    setNetwork('base');
    setAmount('');
    setStep('select');
    setAgreed(false);
    setDepositError(null);
    setFinalTxHash(null);
    setFinalTxLink(null);
    baseHook.reset();
  };

  if (!pool) return null;

  const activeHook = baseHook;
  const explorerUrl = finalTxLink || (finalTxHash ? `${BASE_CHAIN.blockExplorer}/tx/${finalTxHash}` : '');
  const canContinue =
    isValidAmount &&
    !!walletAddress &&
    vaultReady;
  const selectButtonLabel = 'Review Deposit';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 bg-black/70 backdrop-blur-md"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.25, type: 'spring', damping: 25 }}
          className="relative w-full max-w-md max-h-[92vh] z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="absolute -inset-1 rounded-3xl blur-xl opacity-20 pointer-events-none"
            style={{ background: `radial-gradient(circle, ${config.color} 0%, transparent 70%)` }}
          />

          <div className="relative max-h-[92vh] bg-[#0D0A06] border border-[#3f392b]/60 rounded-2xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center border overflow-hidden p-1.5"
                  style={{ background: 'rgba(254,180,19,0.12)', borderColor: 'rgba(254,180,19,0.3)' }}
                >
                  <img
                    src={import.meta.env.BASE_URL + "images/logo_img.svg"}
                    alt="Pryzen"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h2 className="font-jura font-bold text-white text-base leading-tight">{formatPoolName(pool.team)}</h2>
                  <p className="text-xs font-golos text-white/40">${pool.symbol} · ${pool.tokenValue.toFixed(2)} per token</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-white/40" />
              </button>
            </div>

            <div className="p-6 max-h-[calc(92vh-89px)] overflow-y-auto">
              <AnimatePresence mode="wait">

                {step === 'select' && (
                  <motion.div key="select" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.18 }}>
                    {!walletAddress && onConnectWallet && (
                      <div className="flex items-center justify-between gap-3 bg-[#FEB413]/10 border border-[#FEB413]/20 p-3 rounded-xl mb-5 text-xs text-[#FEB413]/90 font-golos">
                        <span>Connect your wallet to enter the pool</span>
                        <button onClick={onConnectWallet} className="shrink-0 px-3 py-1.5 rounded-lg bg-[#FEB413]/20 hover:bg-[#FEB413]/30 border border-[#FEB413]/30 text-[#FEB413] font-jura font-semibold transition-colors">
                          Connect
                        </button>
                      </div>
                    )}

                    <p className="text-xs font-jura font-bold uppercase tracking-widest text-white/30 mb-3">1. Entry path</p>

                    <div
                      className="relative p-4 rounded-xl border text-left mb-4"
                      style={{ borderColor: config.colorBorder, background: config.colorLight }}
                    >
                      <div className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full" style={{ background: config.color }} />
                      <div className="flex items-center gap-3 mb-2">
                        <span className="relative h-8 w-14 shrink-0">
                          <span className="absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-lg border border-black/30 bg-[#0D0A06]">
                            <ChainIcon size={24} />
                          </span>
                          <span className="absolute right-0 top-0 flex h-8 w-8 items-center justify-center rounded-full border border-black/30 bg-[#0D0A06]">
                            <UsdcIcon size={24} />
                          </span>
                        </span>
                        <div>
                          <p className="font-jura font-bold text-sm text-white">Base USDC</p>
                          <p className="text-[11px] font-golos text-white/45 leading-tight">Built on Base</p>
                        </div>
                      </div>
                      <p className="text-[11px] font-jura font-semibold uppercase tracking-wider" style={{ color: config.color }}>
                        Receive index token
                      </p>
                    </div>

                    <div className="flex gap-3 p-3 rounded-xl mb-5 text-xs font-golos" style={{ background: config.colorLight, border: `1px solid ${config.colorBorder}` }}>
                      <Info className="w-4 h-4 shrink-0 mt-0.5" style={{ color: config.color }} />
                      <p className="text-white/60 leading-relaxed">{config.receiveDesc}</p>
                    </div>

                    <p className="text-xs font-jura font-bold uppercase tracking-widest text-white/30 mb-3">2. Enter amount</p>

                    <div className="relative rounded-xl border overflow-hidden mb-3 transition-all" style={{ borderColor: amount ? config.colorBorder : 'rgba(255,255,255,0.1)' }}>
                      <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={amountPlaceholder} min={config.minAmount} max={config.maxAmount} step="0.01"
                        className="w-full bg-white/[0.03] text-white text-xl font-mono font-bold px-4 py-4 pr-24 outline-none placeholder:text-white/15 font-golos" />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                        <UsdcIcon size={18} />
                        <span className="text-sm font-jura font-bold" style={{ color: config.color }}>{amountTokenLabel}</span>
                      </div>
                    </div>

                    {PRESET_AMOUNTS[network].length > 0 && (
                      <div className="flex gap-2 mb-5">
                        {PRESET_AMOUNTS[network].map((preset) => (
                        <button key={preset} onClick={() => setAmount(String(preset))}
                          className={cn('flex-1 py-1.5 rounded-lg text-xs font-jura font-semibold transition-all border',
                            amount === String(preset) ? 'text-white' : 'text-white/30 border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'
                          )}
                          style={amount === String(preset) ? { background: config.colorLight, borderColor: config.colorBorder, color: config.color } : {}}
                        >
                          {preset.toLocaleString()}
                        </button>
                        ))}
                      </div>
                    )}

                    {numAmount > 0 && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 mb-5">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-golos text-white/40">You send</span>
                          <span className="text-sm font-mono text-white">{numAmount.toLocaleString()} {config.asset}</span>
                        </div>
                        {FEE_PCT > 0 && (
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-golos text-white/40">Protocol fee ({(FEE_PCT * 100).toFixed(0)}%)</span>
                            <span className="text-sm font-mono text-red-400">− ${(usdValue * FEE_PCT).toFixed(4)}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center pt-2 border-t border-white/[0.06]">
                          <span className="text-xs font-golos text-white/40">Estimated tokens</span>
                          <span className="text-sm font-mono font-bold text-white">
                            {displayedTokensReceived.toFixed(4)} <span className="text-white/30 text-xs">${pool.symbol}</span>
                          </span>
                        </div>
                      </motion.div>
                    )}

                    {numAmount > 0 && !isValidAmount && (
                      <p className="text-xs font-golos text-red-400 mb-4">
                        Min: {config.minAmount.toLocaleString()} {config.asset} · Max: {config.maxAmount.toLocaleString()} {config.asset}
                      </p>
                    )}

                    {!vaultReady && (
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-[#FEB413]/10 border border-[#FEB413]/20 text-xs font-golos text-[#FEB413]/80 mb-3">
                        <Info className="w-4 h-4 shrink-0 text-[#FEB413]" />
                        <span>Index vault is not ready yet. Contact admin to activate this pool before deposits.</span>
                      </div>
                    )}

                    <button
                      onClick={() => setStep('confirm')}
                      disabled={!canContinue}
                      className={cn('w-full py-4 rounded-xl font-jura font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2',
                        canContinue ? 'text-white hover:opacity-90 hover:shadow-lg' : 'bg-white/5 text-white/20 cursor-not-allowed border border-white/10'
                      )}
                      style={canContinue ? { background: config.color } : {}}
                    >
                      {selectButtonLabel}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}

                {step === 'confirm' && (
                  <motion.div key="confirm" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.18 }}>
                    <p className="text-xs font-jura font-bold uppercase tracking-widest text-white/30 mb-4">Review your deposit</p>

                    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl divide-y divide-white/[0.06] mb-5">
                      {([
                            { label: 'Network', value: config.chain },
                            { label: 'You send', value: `${numAmount.toLocaleString()} ${config.asset}` },
                            { label: 'USD equivalent', value: `≈ $${usdValue.toFixed(2)}` },
                            { label: 'Estimated index tokens', value: `${displayedTokensReceived.toFixed(4)} $${pool.symbol}` },
                            { label: 'Token type', value: config.receives },
                            { label: 'Destination', value: 'Base index vault' },
                            { label: 'Signed by', value: 'Connected wallet' },
                          ]
                      ).map(({ label, value }) => (
                        <div key={label} className="flex justify-between px-4 py-3 text-sm">
                          <span className="font-golos text-white/40">{label}</span>
                          <span className="font-jura font-semibold text-white text-right">{value}</span>
                        </div>
                      ))}
                      {walletAddress && (
                        <div className="flex justify-between px-4 py-3 text-sm">
                          <span className="font-golos text-white/40">From wallet</span>
                          <span className="font-mono font-semibold text-[#FEB413]">{truncateAddr(walletAddress)}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3 bg-[#FEB413]/10 border border-[#FEB413]/20 p-3 rounded-xl mb-5 text-xs font-golos text-[#FEB413]/80">
                      <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#FEB413]" />
                      <p>
                        You will sign 2 Base transactions in your wallet: approve USDC + deposit.
                      </p>
                    </div>

                    <label className="flex items-start gap-3 mb-5 cursor-pointer group">
                      <div onClick={() => setAgreed(!agreed)}
                        className={cn('mt-0.5 w-5 h-5 rounded border-2 shrink-0 flex items-center justify-center transition-all',
                          agreed ? 'border-[#FEB413] bg-[#FEB413]' : 'border-white/20 bg-white/5 group-hover:border-white/40'
                        )}
                      >
                        {agreed && <CheckCircle className="w-3.5 h-3.5 text-[#0D0A06] fill-current" />}
                      </div>
                      <span className="text-xs font-golos text-white/40 leading-relaxed">
                        I understand this deposit is signed from my own wallet. Smart contracts carry risks.
                      </span>
                    </label>

                    <div className="flex gap-3">
                      <button onClick={() => setStep('select')} className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-sm font-jura font-semibold text-white/40 hover:bg-white/10 transition-all">
                        Back
                      </button>
                      <button onClick={handleDeposit} disabled={!agreed}
                        className={cn('flex-1 py-3 rounded-xl font-jura font-bold text-sm transition-all flex items-center justify-center gap-2',
                          agreed ? 'text-white hover:opacity-90' : 'bg-white/5 text-white/20 cursor-not-allowed border border-white/10'
                        )}
                        style={agreed ? { background: config.color } : {}}
                      >
                        Confirm Deposit
                      </button>
                    </div>
                  </motion.div>
                )}

                {step === 'processing' && (
                  <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-8">
                    <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" style={{ color: config.color }} />
                    <h3 className="text-lg font-jura font-bold text-white mb-2">Processing deposit…</h3>
                    <p className="text-sm font-golos text-white/40 mb-4">{statusLabel(activeHook.status)}</p>
                    <p className="text-xs font-golos text-white/25">Do not close this window or switch tabs.</p>
                  </motion.div>
                )}

                {step === 'success' && (
                  <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3, type: 'spring' }} className="text-center py-4">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1, type: 'spring', damping: 12 }}
                      className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                      style={{ background: config.colorLight, border: `2px solid ${config.colorBorder}` }}
                    >
                      <CheckCircle className="w-10 h-10" style={{ color: config.color }} />
                    </motion.div>
                    <h3 className="text-2xl font-jura font-bold text-white mb-2">Deposit Received!</h3>
                    <p className="font-golos text-white/40 text-sm mb-6">
                      Your Base USDC deposit into <span className="text-white font-semibold">{formatPoolName(pool.team)}</span> was confirmed.
                      {' '}Your index token represents your share of this team pool on Base.
                    </p>
                    {finalTxHash && (
                      <a href={explorerUrl} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm font-jura font-medium mb-6 hover:underline" style={{ color: config.color }}>
                        View on explorer <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 mb-6 text-left">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-golos text-white/40">Base USDC sent</span>
                        <span className="font-mono font-bold text-white">{numAmount.toLocaleString()} {config.asset}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="font-golos text-white/40">Estimated index tokens</span>
                        <span className="font-mono font-bold" style={{ color: config.color }}>{displayedTokensReceived.toFixed(4)} ${pool.symbol}</span>
                      </div>
                    </div>
                    {network === 'base' && (
                      <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 mb-6 text-left">
                        <div className="flex justify-between gap-3 text-sm mb-2">
                          <span className="font-golos text-white/40">Deposit status</span>
                          <span className="font-jura font-semibold text-white text-right">
                            {baseDepositStatusLabel(currentBaseDeposit?.status)}
                          </span>
                        </div>
                        {baseDepositsFetching && !currentBaseDeposit && (
                          <p className="text-xs font-golos text-white/30">Checking backend deposit status…</p>
                        )}
                        {depositError && !currentBaseDeposit && (
                          <p className="text-xs font-golos text-amber-300 mt-2">{depositError}</p>
                        )}
                        {!baseDepositsFetching && !currentBaseDeposit && (
                          <p className="text-xs font-golos text-white/30">Waiting for the backend to index the Base deposit event.</p>
                        )}
                        {currentBaseDeposit?.status === 'COMPLETED' && (
                          <div className="flex justify-between gap-3 text-sm mb-2">
                            <span className="font-golos text-white/40">Index tokens minted</span>
                            <span className="font-mono font-bold text-white">
                              {formatRawTokenAmount(currentBaseDeposit.sharesMinted ?? undefined, 6, 4)} ${pool.symbol}
                            </span>
                          </div>
                        )}
                        {currentBaseDeposit?.lastError && (
                          <p className="text-xs font-golos text-red-400 mt-2">{currentBaseDeposit.lastError}</p>
                        )}
                        {baseMintTxLink && (
                          <a href={baseMintTxLink} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-xs font-jura font-semibold hover:underline" style={{ color: config.color }}>
                            View mint on BaseScan <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    )}
                    <div className="flex gap-3">
                      <button onClick={handleReset} className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-sm font-jura font-semibold text-white/40 hover:bg-white/10 transition-all">
                        Enter Another Pool
                      </button>
                      <button onClick={onClose} className="flex-1 py-3 rounded-xl font-jura font-bold text-sm text-white transition-all hover:opacity-90" style={{ background: config.color }}>
                        Done
                      </button>
                    </div>
                  </motion.div>
                )}

                {step === 'error' && (
                  <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-6">
                    <div className="w-16 h-16 rounded-full bg-red-500/20 border-2 border-red-500/40 flex items-center justify-center mx-auto mb-4">
                      <X className="w-8 h-8 text-red-400" />
                    </div>
                    <h3 className="text-xl font-jura font-bold text-white mb-2">Deposit Failed</h3>
                    <p className="text-sm font-golos text-white/40 mb-6 max-w-xs mx-auto">{depositError || 'Something went wrong. Please try again.'}</p>
                    <div className="flex gap-3">
                      <button onClick={handleReset} className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-sm font-jura font-semibold text-white/40 hover:bg-white/10 transition-all">
                        Try Again
                      </button>
                      <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-sm font-jura font-semibold text-white/40 hover:bg-white/10 transition-all">
                        Close
                      </button>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
