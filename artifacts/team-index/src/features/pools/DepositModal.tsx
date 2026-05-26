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
import { api } from '@/lib/api';
import { useBaseUsdcDeposit, usePolygonDeposit, type TxStatus } from '@/hooks/use-wallet-tx';
import { BASE_CHAIN, POLYGON_CHAIN, POLYGON_USDC_ADDRESS } from '@/lib/config';
import afcLogo from '@assets/AFC_1776150749882.png';
import barLogo from '@assets/BAR_1776150749883.png';
import acmLogo from '@assets/ACM_1776150749863.png';
import cityLogo from '@assets/CITY_1776150749884.png';

type Network = 'polygon' | 'base';
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

const PolygonIcon = ({ size = 24 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} fill="none" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="11" fill="#8247E5" />
    <path
      fill="#fff"
      d="M15.73 8.46c-.28-.16-.64-.16-.96 0l-2.21 1.3-1.5-.87 2.17-1.26 1.5.86 1-.58-2.02-1.16a.98.98 0 0 0-.96 0L9.96 8.38a.94.94 0 0 0-.48.83v3.2l-1.5.87-1.5-.87v-1.73l1.5-.86 1 .58V9.24l-.52-.3a.98.98 0 0 0-.96 0l-2.02 1.17a.94.94 0 0 0-.48.83v2.34c0 .33.18.65.48.82l2.02 1.17c.28.16.64.16.96 0l2.02-1.17a.94.94 0 0 0 .48-.82v-3.2l1.5-.87 1.5.87v1.73l-1.5.87-1-.58v1.16l.52.3c.28.16.64.16.96 0l2.02-1.17a.94.94 0 0 0 .48-.82v-2.34a.94.94 0 0 0-.48-.83Z"
    />
  </svg>
);

const BaseIcon = ({ size = 24 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} fill="none" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="11" fill="#0052FF" />
    <path fill="#fff" d="M12.05 19.4a7.4 7.4 0 1 0 0-14.8 7.4 7.4 0 0 0 0 14.8Zm.05-2.42a4.98 4.98 0 0 1-4.7-3.34h9.4a4.98 4.98 0 0 1-4.7 3.34Zm-4.7-6.6a4.98 4.98 0 0 1 9.4 0h-9.4Z" />
  </svg>
);

function ChainIcon({ network, size = 24 }: { network: Network; size?: number }) {
  return network === 'base' ? <BaseIcon size={size} /> : <PolygonIcon size={size} />;
}

const FAN_TOKEN_MAP: Record<string, { name: string; symbol: string; logo: string }> = {
  AFC: { name: 'Arsenal FC', symbol: '$AFC', logo: afcLogo },
  BAR: { name: 'FC Barcelona', symbol: '$BAR', logo: barLogo },
  ACM: { name: 'AC Milan', symbol: '$ACM', logo: acmLogo },
  CITY: { name: 'Manchester City', symbol: '$CITY', logo: cityLogo },
};

function getFanTokenForPool(symbol: string) {
  const clean = symbol.replace(/^[\$]?p?/i, '').toUpperCase();
  return FAN_TOKEN_MAP[clean] ?? null;
}

const NETWORK_CONFIG = {
  polygon: {
    name: 'Polygon',
    asset: 'USDC',
    assetFull: 'USD Coin',
    color: '#8247E5',
    colorLight: 'rgba(130, 71, 229, 0.15)',
    colorBorder: 'rgba(130, 71, 229, 0.3)',
    chain: 'Polygon PoS',
    receives: 'Native Token',
    receiveDesc: 'You deposit Polygon USDC directly into the vault and receive native index shares on Polygon.',
    minAmount: 0.1,
    maxAmount: 100000,
    placeholder: '100',
    decimals: 6,
    rate: 1,
  },
  base: {
    name: 'Base',
    asset: 'USDC',
    assetFull: 'USD Coin',
    color: '#0052FF',
    colorLight: 'rgba(0, 82, 255, 0.15)',
    colorBorder: 'rgba(0, 82, 255, 0.35)',
    chain: 'Base',
    receives: 'Wrapped ERC20',
    receiveDesc: 'You deposit Base USDC into the receiver contract. The relayer mints wrapped index ERC20 shares on Base after completion.',
    minAmount: 0.1,
    maxAmount: 100000,
    placeholder: '100',
    decimals: 6,
    rate: 1,
  },
};

const PRESET_AMOUNTS: Record<Network, number[]> = {
  polygon: [50, 100, 500, 1000],
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
      return 'Bridge to Polygon USDC in progress';
    case 'DEPOSITING':
      return 'Depositing into the Polygon vault';
    case 'MINTING_SHARES':
      return 'Minting wrapped ERC20 shares on Base';
    case 'COMPLETED':
      return 'Wrapped ERC20 shares minted';
    case 'FAILED':
      return 'Relayer failed';
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
  const [network, setNetwork] = useState<Network>('polygon');
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<Step>('select');
  const [agreed, setAgreed] = useState(false);
  const [depositError, setDepositError] = useState<string | null>(null);
  const [finalTxHash, setFinalTxHash] = useState<string | null>(null);
  const [finalTxLink, setFinalTxLink] = useState<string | null>(null);

  const polygonHook = usePolygonDeposit();
  const baseHook = useBaseUsdcDeposit();

  const config = NETWORK_CONFIG[network];
  const numAmount = parseFloat(amount) || 0;
  const usdValue = numAmount * config.rate;
  const FEE_PCT = 0;
  const usdValueAfterFee = usdValue * (1 - FEE_PCT);
  const tokensReceived = pool ? usdValueAfterFee / pool.tokenValue : 0;
  const vaultReady = !!pool?.vaultAddress;

  const fanToken = pool ? getFanTokenForPool(pool.symbol) : null;
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
      if (network === 'base') {
        const rawAmount = BigInt(targetUsdcRaw);
        const prepared = await api.prepareBaseUsdcDeposit(pool.id, rawAmount.toString());
        const hash = await baseHook.deposit(prepared.txs.approveTx, prepared.txs.depositTx, walletAddress);
        setFinalTxHash(hash ?? null);
        await queryClient.invalidateQueries({ queryKey: ['base-deposits', walletAddress] });
        await refreshPoolViews();
        setStep('success');
      } else {
        const rawAmount = BigInt(targetUsdcRaw);
        const prepared = await api.prepareDeposit(pool.id, rawAmount.toString(), walletAddress);
        if (!prepared.assetAddress || !prepared.vaultAddress || !prepared.txs?.approveTx || !prepared.txs?.depositTx) {
          throw new Error('Polygon deposit is temporarily unavailable: backend did not return the vault asset and prepared approval transaction.');
        }
        if (prepared.assetAddress.toLowerCase() !== POLYGON_USDC_ADDRESS.toLowerCase()) {
          throw new Error(
            `This pool was deployed with a different Polygon USDC contract (${truncateAddr(prepared.assetAddress)}). Use Base for this pool, or create a new pool with the native Polygon USDC factory.`
          );
        }
        const depositTx = prepared.txs.depositTx;
        const vaultAddress = prepared.vaultAddress;
        const hash = await polygonHook.deposit(
          vaultAddress,
          rawAmount,
          depositTx,
          walletAddress,
          prepared.txs?.approveTx
        );
        setFinalTxHash(hash ?? null);
        if (hash) {
          try {
            await api.confirmPoolDeposit(pool.id, hash);
          } catch (e) {
            console.warn("POST /pools/:id/deposit/confirm failed", e);
          }
        }
        await refreshPoolViews();
        setStep('success');
      }
    } catch (err: any) {
      setDepositError(err.message || 'Transaction failed');
      setStep('error');
    }
  }, [
    pool,
    walletAddress,
    isValidAmount,
    network,
    targetUsdcRaw,
    polygonHook,
    baseHook,
    refreshPoolViews,
    queryClient,
  ]);

  const handleReset = () => {
    setNetwork('polygon');
    setAmount('');
    setStep('select');
    setAgreed(false);
    setDepositError(null);
    setFinalTxHash(null);
    setFinalTxLink(null);
    polygonHook.reset();
    baseHook.reset();
  };

  if (!pool) return null;

  const activeHook = network === 'base' ? baseHook : polygonHook;
  const explorerUrl = finalTxLink || (finalTxHash ? `${network === 'base' ? BASE_CHAIN.blockExplorer : POLYGON_CHAIN.blockExplorer}/tx/${finalTxHash}` : '');
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

                    <p className="text-xs font-jura font-bold uppercase tracking-widest text-white/30 mb-3">1. Choose your entry path</p>

                    {(() => {
                      const availableNetworks: Network[] = ['polygon', 'base'];
                      const cols = "grid grid-cols-2 gap-3 mb-4";
                      return (
                    <div className={cols}>
                      {availableNetworks.map((net) => {
                        const c = NETWORK_CONFIG[net];
                        const active = network === net;
                        return (
                          <button key={net} onClick={() => { setNetwork(net); setAmount(''); }}
                            className={cn('relative p-3.5 rounded-xl border text-left transition-all duration-200',
                              active ? '' : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/20'
                            )}
                            style={active ? { borderColor: c.colorBorder, background: c.colorLight } : {}}
                          >
                            {active && <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full" style={{ background: c.color }} />}
                            <div className="flex items-center gap-2 mb-2">
                              <span className="relative h-7 w-12 shrink-0">
                                <span className="absolute left-0 top-0 flex h-7 w-7 items-center justify-center rounded-full border border-black/30 bg-[#0D0A06]">
                                  <ChainIcon network={net} size={22} />
                                </span>
                                <span className="absolute right-0 top-0 flex h-7 w-7 items-center justify-center rounded-full border border-black/30 bg-[#0D0A06]">
                                  <UsdcIcon size={22} />
                                </span>
                              </span>
                              <span className="font-jura font-bold text-sm text-white">{c.name} {c.asset}</span>
                            </div>
                            <p className="text-[10px] font-golos text-white/40 leading-tight">{c.chain}</p>
                            <p className="text-[10px] font-jura font-semibold mt-1.5 uppercase tracking-wider" style={{ color: c.color }}>→ {c.receives}</p>
                          </button>
                        );
                      })}

                      {fanToken && (
                        <div
                          className="relative p-3.5 rounded-xl border border-white/10 bg-white/[0.02] opacity-50 cursor-not-allowed select-none"
                        >
                          <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-[#FEB413]/20 border border-[#FEB413]/30">
                            <span className="font-jura font-bold text-[8px] uppercase tracking-wider text-[#FEB413]">Soon</span>
                          </div>
                          <div className="flex items-center gap-2 mb-1.5">
                            <img src={fanToken.logo} alt={fanToken.symbol} className="w-[22px] h-[22px] rounded-full" />
                            <span className="font-jura font-bold text-sm text-white">{fanToken.symbol}</span>
                          </div>
                          <p className="text-[10px] font-golos text-white/40 leading-tight truncate">{fanToken.name}</p>
                          <p className="text-[10px] font-jura font-semibold mt-1.5 uppercase tracking-wider text-white/20">→ Fan Token</p>
                        </div>
                      )}
                    </div>
                      );
                    })()}

                    <div className="flex gap-3 p-3 rounded-xl mb-5 text-xs font-golos" style={{ background: config.colorLight, border: `1px solid ${config.colorBorder}` }}>
                      <Info className="w-4 h-4 shrink-0 mt-0.5" style={{ color: config.color }} />
                      <p className="text-white/60 leading-relaxed">{config.receiveDesc}</p>
                    </div>

                    <p className="text-xs font-jura font-bold uppercase tracking-widest text-white/30 mb-3">2. Enter amount</p>

                    <div className="relative rounded-xl border overflow-hidden mb-3 transition-all" style={{ borderColor: amount ? config.colorBorder : 'rgba(255,255,255,0.1)' }}>
                      <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={amountPlaceholder} min={config.minAmount} max={config.maxAmount}
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
                      {(network === 'base'
                        ? [
                            { label: 'Network', value: config.chain },
                            { label: 'You send', value: `${numAmount.toLocaleString()} ${config.asset}` },
                            { label: 'USD equivalent', value: `≈ $${usdValue.toFixed(2)}` },
                            { label: 'Estimated wrapped tokens', value: `${displayedTokensReceived.toFixed(4)} $${pool.symbol}` },
                            { label: 'Token type', value: config.receives },
                            { label: 'Destination', value: 'BaseDepositReceiver' },
                            { label: 'Signed by', value: 'Connected wallet' },
                          ]
                        : [
                            { label: 'Network', value: config.chain },
                            { label: 'You send', value: `${numAmount.toLocaleString()} ${config.asset}` },
                            { label: 'USD equivalent', value: `≈ $${usdValue.toFixed(2)}` },
                            { label: 'Estimated native tokens', value: `${displayedTokensReceived.toFixed(4)} $${pool.symbol}` },
                            { label: 'Token type', value: config.receives },
                            { label: 'Destination', value: 'Polygon vault' },
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
                        {network === 'base'
                          ? 'You will sign 2 Base transactions in your wallet: approve USDC + deposit.'
                          : 'You will sign 2 Polygon transactions in your wallet: approve USDC + deposit.'}
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
                      Your {network === 'base' ? 'Base' : 'Polygon'} USDC deposit into <span className="text-white font-semibold">{formatPoolName(pool.team)}</span> was confirmed.
                      {network === 'base'
                        ? ' Wrapped ERC20 shares will appear after relayer completion.'
                        : ' Native index token minted on Polygon.'}
                    </p>
                    {finalTxHash && (
                      <a href={explorerUrl} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm font-jura font-medium mb-6 hover:underline" style={{ color: config.color }}>
                        View on explorer <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 mb-6 text-left">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-golos text-white/40">{network === 'base' ? 'Base USDC sent' : 'Polygon USDC sent'}</span>
                        <span className="font-mono font-bold text-white">{numAmount.toLocaleString()} {config.asset}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="font-golos text-white/40">{network === 'base' ? 'Estimated wrapped tokens' : 'Estimated native tokens'}</span>
                        <span className="font-mono font-bold" style={{ color: config.color }}>{displayedTokensReceived.toFixed(4)} ${pool.symbol}</span>
                      </div>
                    </div>
                    {network === 'base' && (
                      <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 mb-6 text-left">
                        <div className="flex justify-between gap-3 text-sm mb-2">
                          <span className="font-golos text-white/40">Relayer status</span>
                          <span className="font-jura font-semibold text-white text-right">
                            {baseDepositStatusLabel(currentBaseDeposit?.status)}
                          </span>
                        </div>
                        {baseDepositsFetching && !currentBaseDeposit && (
                          <p className="text-xs font-golos text-white/30">Checking backend deposit status…</p>
                        )}
                        {!baseDepositsFetching && !currentBaseDeposit && (
                          <p className="text-xs font-golos text-white/30">Waiting for the backend to index the Base deposit event.</p>
                        )}
                        {currentBaseDeposit?.status === 'COMPLETED' && (
                          <div className="flex justify-between gap-3 text-sm mb-2">
                            <span className="font-golos text-white/40">ERC20 shares minted</span>
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
