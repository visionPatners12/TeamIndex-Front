import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Info, CheckCircle, Loader2, ExternalLink } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import type { PoolData } from './PoolCard';
import { api } from '@/lib/api';
import { usePolygonDeposit, useChilizDeposit, type TxStatus } from '@/hooks/use-wallet-tx';
import { POLYGON_CHAIN, CHILIZ_CHAIN } from '@/lib/config';

type Network = 'polygon' | 'chiliz';
type Step = 'select' | 'confirm' | 'processing' | 'success' | 'error';

interface DepositModalProps {
  pool: PoolData | null;
  onClose: () => void;
  walletAddress?: string;
  onConnectWallet?: () => void;
}

const NETWORK_CONFIG = {
  polygon: {
    name: 'Polygon',
    asset: 'USDC',
    assetFull: 'USD Coin',
    color: '#8247E5',
    colorLight: 'rgba(130, 71, 229, 0.15)',
    colorBorder: 'rgba(130, 71, 229, 0.3)',
    icon: '⬡',
    chain: 'Polygon PoS',
    receives: 'Core Token',
    receiveDesc: 'You receive the core Team Index token on Polygon. Signed & sent from your wallet.',
    minAmount: 0.1,
    maxAmount: 100000,
    placeholder: '100',
    decimals: 6,
    rate: 1,
  },
  chiliz: {
    name: 'Chiliz',
    asset: 'CHZ',
    assetFull: 'Chiliz',
    color: '#CD0124',
    colorLight: 'rgba(205, 1, 36, 0.12)',
    colorBorder: 'rgba(205, 1, 36, 0.3)',
    icon: '🌶',
    chain: 'Chiliz Chain',
    receives: 'Wrapped Token',
    receiveDesc: 'You receive a wrapped Pryzen Team Index token on Chiliz Chain after cross-chain processing.',
    minAmount: 1,
    maxAmount: 1000000,
    placeholder: '500',
    decimals: 18,
    rate: 0.084,
  },
};

const PRESET_AMOUNTS: Record<Network, number[]> = {
  polygon: [50, 100, 500, 1000],
  chiliz: [500, 1000, 5000, 10000],
};

function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function statusLabel(s: TxStatus): string {
  switch (s) {
    case 'switching': return 'Switching network…';
    case 'approving': return 'Approve token in wallet…';
    case 'sending': return 'Confirm deposit in wallet…';
    case 'confirming': return 'Waiting for confirmation…';
    default: return '';
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

  const polygonHook = usePolygonDeposit();
  const chilizHook = useChilizDeposit();

  const config = NETWORK_CONFIG[network];
  const numAmount = parseFloat(amount) || 0;
  const usdValue = numAmount * config.rate;
  // Polygon vault charges 10% fee (FEE_BPS=1000). Chiliz has no additional fee here.
  const FEE_PCT = network === 'polygon' ? 0.10 : 0;
  const usdValueAfterFee = usdValue * (1 - FEE_PCT);
  const tokensReceived = pool ? usdValueAfterFee / pool.tokenValue : 0;
  const isValidAmount = numAmount >= config.minAmount && numAmount <= config.maxAmount;
  const vaultReady = network === 'chiliz' || !!pool?.vaultAddress;

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

    try {
      if (network === 'polygon') {
        const rawAmount = BigInt(Math.floor(numAmount * 10 ** config.decimals));
        const { tx } = await api.prepareDeposit(pool.id, rawAmount.toString(), walletAddress);

        const hash = await polygonHook.deposit(tx.to, rawAmount, tx);
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
      } else {
        const rawAmount = BigInt(Math.floor(numAmount * 10 ** config.decimals));
        const { tx, receiverAddress } = await api.prepareChilizDepositChz(pool.id);

        const hash = await chilizHook.depositCHZ(
          receiverAddress,
          '',
          tx,
          rawAmount.toString()
        );
        setFinalTxHash(hash ?? null);
        await refreshPoolViews();
        setStep('success');
      }
    } catch (err: any) {
      setDepositError(err.message || 'Transaction failed');
      setStep('error');
    }
  }, [pool, walletAddress, isValidAmount, network, numAmount, config.decimals, polygonHook, chilizHook, refreshPoolViews]);

  const handleReset = () => {
    setNetwork('polygon');
    setAmount('');
    setStep('select');
    setAgreed(false);
    setDepositError(null);
    setFinalTxHash(null);
    polygonHook.reset();
    chilizHook.reset();
  };

  if (!pool) return null;

  const activeHook = network === 'polygon' ? polygonHook : chilizHook;
  const explorerUrl = network === 'polygon'
    ? `${POLYGON_CHAIN.blockExplorer}/tx/${finalTxHash}`
    : `${CHILIZ_CHAIN.blockExplorer}/tx/${finalTxHash}`;

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
          className="relative w-full max-w-md z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="absolute -inset-1 rounded-3xl blur-xl opacity-30 pointer-events-none"
            style={{ background: `radial-gradient(circle, ${config.color} 0%, transparent 70%)` }}
          />

          <div className="relative bg-[#0d0f18] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold border"
                  style={{ background: config.colorLight, borderColor: config.colorBorder }}
                >
                  {pool.symbol[0]}
                </div>
                <div>
                  <h2 className="font-bold text-white text-base leading-tight">{pool.team}</h2>
                  <p className="text-xs text-muted-foreground">${pool.symbol} · ${pool.tokenValue.toFixed(2)} per token</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <div className="p-6">
              <AnimatePresence mode="wait">

                {/* STEP: SELECT NETWORK + AMOUNT */}
                {step === 'select' && (
                  <motion.div key="select" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.18 }}>
                    {!walletAddress && onConnectWallet && (
                      <div className="flex items-center justify-between gap-3 bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl mb-5 text-xs text-amber-300/90">
                        <span>Connect your wallet to enter the pool</span>
                        <button onClick={onConnectWallet} className="shrink-0 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 font-semibold transition-colors">
                          Connect
                        </button>
                      </div>
                    )}

                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">1. Choose your entry network</p>

                    <div className="grid grid-cols-2 gap-3 mb-6">
                      {(['polygon', 'chiliz'] as Network[]).map((net) => {
                        const c = NETWORK_CONFIG[net];
                        const active = network === net;
                        return (
                          <button key={net} onClick={() => { setNetwork(net); setAmount(''); }}
                            className={cn('relative p-4 rounded-xl border text-left transition-all duration-200',
                              active ? 'border-[var(--net-color)] bg-[var(--net-bg)]' : 'border-white/10 bg-white/5 hover:bg-white/8 hover:border-white/20'
                            )}
                            style={active ? { '--net-color': c.colorBorder, '--net-bg': c.colorLight } as React.CSSProperties : {}}
                          >
                            {active && <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full" style={{ background: c.color }} />}
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xl">{c.icon}</span>
                              <span className="font-bold text-sm text-white">{c.asset}</span>
                            </div>
                            <p className="text-xs text-muted-foreground leading-tight">{c.chain}</p>
                            <p className="text-[10px] font-semibold mt-1.5 uppercase tracking-wider" style={{ color: c.color }}>→ {c.receives}</p>
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex gap-3 p-3 rounded-xl mb-5 text-xs" style={{ background: config.colorLight, border: `1px solid ${config.colorBorder}` }}>
                      <Info className="w-4 h-4 shrink-0 mt-0.5" style={{ color: config.color }} />
                      <p className="text-white/80 leading-relaxed">{config.receiveDesc}</p>
                    </div>

                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">2. Enter amount</p>

                    <div className="relative rounded-xl border overflow-hidden mb-3 transition-all" style={{ borderColor: amount ? config.colorBorder : 'rgba(255,255,255,0.1)' }}>
                      <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={config.placeholder} min={config.minAmount} max={config.maxAmount}
                        className="w-full bg-white/5 text-white text-xl font-mono font-bold px-4 py-4 pr-20 outline-none placeholder:text-white/20" />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                        <span className="text-sm font-bold" style={{ color: config.color }}>{config.asset}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 mb-5">
                      {PRESET_AMOUNTS[network].map((preset) => (
                        <button key={preset} onClick={() => setAmount(String(preset))}
                          className={cn('flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all border',
                            amount === String(preset) ? 'text-white' : 'text-muted-foreground border-white/10 bg-white/5 hover:bg-white/10'
                          )}
                          style={amount === String(preset) ? { background: config.colorLight, borderColor: config.colorBorder, color: config.color } : {}}
                        >
                          {preset.toLocaleString()}
                        </button>
                      ))}
                    </div>

                    {numAmount > 0 && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-white/5 border border-white/8 rounded-xl p-4 mb-5">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs text-muted-foreground">You send</span>
                          <span className="text-sm font-mono text-white">≈ ${usdValue.toFixed(4)}</span>
                        </div>
                        {FEE_PCT > 0 && (
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs text-muted-foreground">Protocol fee ({(FEE_PCT * 100).toFixed(0)}%)</span>
                            <span className="text-sm font-mono text-red-400">− ${(usdValue * FEE_PCT).toFixed(4)}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center pt-2 border-t border-white/8">
                          <span className="text-xs text-muted-foreground">Estimated tokens</span>
                          <span className="text-sm font-mono font-bold text-white">
                            {tokensReceived.toFixed(4)} <span className="text-muted-foreground text-xs">${pool.symbol}</span>
                          </span>
                        </div>
                      </motion.div>
                    )}

                    {numAmount > 0 && !isValidAmount && (
                      <p className="text-xs text-destructive mb-4">
                        Min: {config.minAmount.toLocaleString()} {config.asset} · Max: {config.maxAmount.toLocaleString()} {config.asset}
                      </p>
                    )}

                    {!vaultReady && (
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300/90 mb-3">
                        <Info className="w-4 h-4 shrink-0 text-amber-400" />
                        <span>Vault contract not yet deployed on Polygon. Contact admin to activate this pool.</span>
                      </div>
                    )}
                    <button onClick={() => setStep('confirm')} disabled={!isValidAmount || !walletAddress || !vaultReady}
                      className={cn('w-full py-4 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2',
                        isValidAmount && walletAddress && vaultReady ? 'text-white hover:opacity-90 hover:shadow-lg' : 'bg-white/5 text-muted-foreground cursor-not-allowed border border-white/10'
                      )}
                      style={isValidAmount && walletAddress && vaultReady ? { background: config.color } : {}}
                    >
                      Review Deposit <ArrowRight className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}

                {/* STEP: CONFIRM */}
                {step === 'confirm' && (
                  <motion.div key="confirm" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.18 }}>
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Review your deposit</p>

                    <div className="bg-white/5 border border-white/10 rounded-xl divide-y divide-white/5 mb-5">
                      {[
                        { label: 'Network', value: config.chain },
                        { label: 'You send', value: `${numAmount.toLocaleString()} ${config.asset}` },
                        { label: 'USD equivalent', value: `≈ $${usdValue.toFixed(2)}` },
                        { label: 'Estimated tokens', value: `${tokensReceived.toFixed(4)} $${pool.symbol}` },
                        { label: 'Token type', value: config.receives },
                        { label: 'Signed by', value: 'Your wallet (MetaMask)' },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex justify-between px-4 py-3 text-sm">
                          <span className="text-muted-foreground">{label}</span>
                          <span className="font-semibold text-white">{value}</span>
                        </div>
                      ))}
                      {walletAddress && (
                        <div className="flex justify-between px-4 py-3 text-sm">
                          <span className="text-muted-foreground">From wallet</span>
                          <span className="font-mono font-semibold text-primary">{truncateAddress(walletAddress)}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3 bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl mb-5 text-xs text-amber-300/90">
                      <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                      <p>You will sign {network === 'polygon' ? '2 transactions' : '1 transaction'} in MetaMask: {network === 'polygon' ? 'approve USDC + deposit' : 'send CHZ to deposit receiver'}.</p>
                    </div>

                    <label className="flex items-start gap-3 mb-5 cursor-pointer group">
                      <div onClick={() => setAgreed(!agreed)}
                        className={cn('mt-0.5 w-5 h-5 rounded border-2 shrink-0 flex items-center justify-center transition-all',
                          agreed ? 'border-primary bg-primary' : 'border-white/20 bg-white/5 group-hover:border-white/40'
                        )}
                      >
                        {agreed && <CheckCircle className="w-3.5 h-3.5 text-primary-foreground fill-current" />}
                      </div>
                      <span className="text-xs text-muted-foreground leading-relaxed">
                        I understand this deposit is signed from my own wallet. Smart contracts carry risks.
                      </span>
                    </label>

                    <div className="flex gap-3">
                      <button onClick={() => setStep('select')} className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-sm font-semibold text-muted-foreground hover:bg-white/10 transition-all">
                        Back
                      </button>
                      <button onClick={handleDeposit} disabled={!agreed}
                        className={cn('flex-1 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2',
                          agreed ? 'text-white hover:opacity-90' : 'bg-white/5 text-muted-foreground cursor-not-allowed border border-white/10'
                        )}
                        style={agreed ? { background: config.color } : {}}
                      >
                        Confirm Deposit
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* STEP: PROCESSING */}
                {step === 'processing' && (
                  <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-8">
                    <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" style={{ color: config.color }} />
                    <h3 className="text-lg font-bold text-white mb-2">Processing deposit…</h3>
                    <p className="text-sm text-muted-foreground mb-4">{statusLabel(activeHook.status)}</p>
                    <p className="text-xs text-white/40">Do not close this window or switch tabs.</p>
                  </motion.div>
                )}

                {/* STEP: SUCCESS */}
                {step === 'success' && (
                  <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3, type: 'spring' }} className="text-center py-4">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1, type: 'spring', damping: 12 }}
                      className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                      style={{ background: config.colorLight, border: `2px solid ${config.colorBorder}` }}
                    >
                      <CheckCircle className="w-10 h-10" style={{ color: config.color }} />
                    </motion.div>

                    <h3 className="text-2xl font-bold font-display text-white mb-2">Deposit Confirmed!</h3>
                    <p className="text-muted-foreground text-sm mb-6">
                      Your entry into <span className="text-white font-semibold">{pool.team}</span> was confirmed on {config.chain}.
                      {network === 'chiliz' && ' Wrapped shares will be minted by the relayer shortly.'}
                    </p>

                    {finalTxHash && (
                      <a href={explorerUrl} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm font-medium mb-6 hover:underline" style={{ color: config.color }}>
                        View on explorer <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}

                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6 text-left">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Amount sent</span>
                        <span className="font-mono font-bold text-white">{numAmount.toLocaleString()} {config.asset}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Estimated tokens</span>
                        <span className="font-mono font-bold" style={{ color: config.color }}>{tokensReceived.toFixed(4)} ${pool.symbol}</span>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button onClick={handleReset} className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-sm font-semibold text-muted-foreground hover:bg-white/10 transition-all">
                        Enter Another Pool
                      </button>
                      <button onClick={onClose} className="flex-1 py-3 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90" style={{ background: config.color }}>
                        Done
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* STEP: ERROR */}
                {step === 'error' && (
                  <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-6">
                    <div className="w-16 h-16 rounded-full bg-destructive/20 border-2 border-destructive/40 flex items-center justify-center mx-auto mb-4">
                      <X className="w-8 h-8 text-destructive" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Deposit Failed</h3>
                    <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">{depositError || 'Something went wrong. Please try again.'}</p>
                    <div className="flex gap-3">
                      <button onClick={handleReset} className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-sm font-semibold text-muted-foreground hover:bg-white/10 transition-all">
                        Try Again
                      </button>
                      <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-sm font-semibold text-muted-foreground hover:bg-white/10 transition-all">
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
