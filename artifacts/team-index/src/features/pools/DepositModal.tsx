import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ArrowRight,
  Info,
  CheckCircle,
  Loader2,
  ExternalLink,
  ChevronDown,
  Search,
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { ExtendedChain, LiFiStep, TokenExtended } from '@lifi/sdk';
import { formatUnits } from 'viem';
import { cn } from '@/lib/utils';
import type { PoolData } from '@/types/pool';
import { truncateAddr } from '@/utils/address';
import { formatPoolName } from '@/utils/pool';
import { api } from '@/lib/api';
import { usePolygonDeposit, type TxStatus } from '@/hooks/use-wallet-tx';
import { useLifiIndexDeposit, type LifiDepositStatus } from '@/hooks/use-lifi-index-deposit';
import {
  getIndexDepositUsdcAmountFromQuote,
  getLifiEvmChains,
  getLifiTokensForChain,
  isPolygonUsdcSource,
  parsePolygonUsdcAmount,
  parseTokenAmount,
} from '@/lib/lifi';
import { POLYGON_CHAIN } from '@/lib/config';
import afcLogo from '@assets/AFC_1776150749882.png';
import barLogo from '@assets/BAR_1776150749883.png';
import acmLogo from '@assets/ACM_1776150749863.png';
import cityLogo from '@assets/CITY_1776150749884.png';

type Network = 'polygon' | 'lifi';
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
    receives: 'Core Token',
    receiveDesc: 'You receive the core Team Index token on Polygon. Signed & sent from your wallet.',
    minAmount: 0.1,
    maxAmount: 100000,
    placeholder: '100',
    decimals: 6,
    rate: 1,
  },
  lifi: {
    name: 'LI.FI',
    asset: 'LI.FI',
    assetFull: 'Cross-chain deposit',
    color: '#19B6A5',
    colorLight: 'rgba(25, 182, 165, 0.13)',
    colorBorder: 'rgba(25, 182, 165, 0.35)',
    chain: 'Any EVM -> Polygon',
    receives: 'Index Token',
    receiveDesc: 'LI.FI routes your source token into Polygon USDC, then calls the index contract with your wallet as the shares receiver.',
    minAmount: 0,
    maxAmount: 1000000,
    placeholder: '0.5',
    decimals: 18,
    rate: 1,
  },
};

const PRESET_AMOUNTS: Record<Network, number[]> = {
  polygon: [50, 100, 500, 1000],
  lifi: [],
};

function statusLabel(s: TxStatus | LifiDepositStatus): string {
  switch (s) {
    case 'switching':   return 'Switching network…';
    case 'approving':   return 'Approve token in wallet…';
    case 'sending':     return 'Confirm deposit in wallet…';
    case 'bridging':    return 'Routing funds to Polygon USDC…';
    case 'confirming':  return 'Waiting for confirmation…';
    case 'quoting':     return 'Fetching LI.FI quote…';
    default:            return '';
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

function sumUsdCosts(
  costs?: Array<{ amountUSD?: string | number | null }>
): number {
  return (costs ?? []).reduce((sum, cost) => {
    const value = Number(cost.amountUSD ?? 0);
    return Number.isFinite(value) ? sum + value : sum;
  }, 0);
}

function quoteRouteLabel(quote?: LiFiStep | null): string {
  const names = quote?.includedSteps
    ?.map((step) => step.toolDetails?.name || step.tool)
    .filter(Boolean);
  return names?.length ? names.join(' -> ') : 'LI.FI route';
}

function chainLabel(chain?: ExtendedChain | null): string {
  return chain?.name || 'Source chain';
}

function tokenLabel(token?: TokenExtended | null): string {
  return token ? `${token.symbol} on chain ${token.chainId}` : 'Source token';
}

function ChainAvatar({ chain }: { chain?: ExtendedChain | null }) {
  if (chain?.logoURI) {
    return <img src={chain.logoURI} alt={chain.name} className="h-7 w-7 rounded-full object-cover" />;
  }

  return (
    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#19B6A5]/15 text-[10px] font-jura font-bold text-[#19B6A5]">
      {chain?.key?.slice(0, 2).toUpperCase() || 'EV'}
    </span>
  );
}

function TokenAvatar({ token }: { token?: TokenExtended | null }) {
  if (token?.logoURI) {
    return <img src={token.logoURI} alt={token.symbol} className="h-7 w-7 rounded-full object-cover" />;
  }

  return (
    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-[10px] font-jura font-bold text-white/50">
      {token?.symbol?.slice(0, 2).toUpperCase() || '--'}
    </span>
  );
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
  const [sourceChainId, setSourceChainId] = useState<number | null>(null);
  const [sourceToken, setSourceToken] = useState<TokenExtended | null>(null);
  const [chainSearch, setChainSearch] = useState('');
  const [tokenSearch, setTokenSearch] = useState('');
  const [openSelector, setOpenSelector] = useState<'chain' | 'token' | null>(null);
  const [lifiQuote, setLifiQuote] = useState<LiFiStep | null>(null);
  const [lifiQuoteKey, setLifiQuoteKey] = useState<string | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  const polygonHook = usePolygonDeposit();
  const lifiHook = useLifiIndexDeposit();

  const { data: lifiChains = [], isLoading: chainsLoading } = useQuery({
    queryKey: ['lifi', 'evm-chains'],
    queryFn: getLifiEvmChains,
    enabled: network === 'lifi',
    staleTime: 60 * 60 * 1000,
  });

  const { data: lifiTokens = [], isFetching: tokensLoading } = useQuery({
    queryKey: ['lifi', 'tokens', sourceChainId, tokenSearch.trim()],
    queryFn: () => getLifiTokensForChain(sourceChainId!, tokenSearch),
    enabled: network === 'lifi' && !!sourceChainId,
    staleTime: 10 * 60 * 1000,
  });

  const config = NETWORK_CONFIG[network];
  const numAmount = parseFloat(amount) || 0;
  const usdValue = numAmount * config.rate;
  const FEE_PCT = network === 'polygon' ? 0.10 : 0;
  const usdValueAfterFee = usdValue * (1 - FEE_PCT);
  const tokensReceived = pool ? usdValueAfterFee / pool.tokenValue : 0;
  const vaultReady = !!pool?.vaultAddress;

  const fanToken = pool ? getFanTokenForPool(pool.symbol) : null;
  const selectedSourceChain = useMemo(
    () => lifiChains.find((chain) => chain.id === sourceChainId) ?? null,
    [lifiChains, sourceChainId]
  );
  const filteredLifiChains = useMemo(() => {
    const search = chainSearch.trim().toLowerCase();
    if (!search) return lifiChains;
    return lifiChains.filter((chain) =>
      `${chain.name} ${chain.key} ${chain.id}`.toLowerCase().includes(search)
    );
  }, [chainSearch, lifiChains]);
  const targetUsdcRaw = useMemo(() => {
    try {
      return parsePolygonUsdcAmount(amount);
    } catch {
      return '0';
    }
  }, [amount]);
  const sourceAmountRaw = useMemo(() => {
    if (network !== 'lifi' || !sourceToken) return '0';
    try {
      return parseTokenAmount(amount, sourceToken.decimals);
    } catch {
      return '0';
    }
  }, [amount, network, sourceToken]);
  const isValidAmount =
    network === 'lifi'
      ? BigInt(sourceAmountRaw) > 0n
      : numAmount >= config.minAmount && numAmount <= config.maxAmount;
  const currentLifiQuoteKey = useMemo(() => {
    if (
      network !== 'lifi' ||
      !walletAddress ||
      !pool?.vaultAddress ||
      !sourceChainId ||
      !sourceToken ||
      sourceAmountRaw === '0'
    ) {
      return '';
    }

    return [
      walletAddress.toLowerCase(),
      pool.vaultAddress.toLowerCase(),
      sourceChainId,
      sourceToken.address.toLowerCase(),
      sourceAmountRaw,
    ].join(':');
  }, [network, walletAddress, pool?.vaultAddress, sourceChainId, sourceToken, sourceAmountRaw]);
  const isLifiQuoteFresh =
    network === 'lifi' && !!lifiQuote && lifiQuoteKey === currentLifiQuoteKey;
  const lifiSourceSpend = lifiQuote
    ? formatRawTokenAmount(
        lifiQuote.action.fromAmount || lifiQuote.estimate?.fromAmount,
        lifiQuote.action.fromToken.decimals
      )
    : null;
  const lifiEstimatedUsdcRaw = getIndexDepositUsdcAmountFromQuote(lifiQuote);
  const lifiEstimatedUsdc = lifiEstimatedUsdcRaw
    ? Number(formatUnits(BigInt(lifiEstimatedUsdcRaw), 6))
    : 0;
  const lifiEstimatedUsdcLabel = lifiEstimatedUsdcRaw
    ? `${formatRawTokenAmount(lifiEstimatedUsdcRaw, 6, 4)} Polygon USDC`
    : 'Quote required';
  const displayedTokensReceived =
    network === 'lifi'
      ? pool && lifiEstimatedUsdc > 0
        ? lifiEstimatedUsdc / pool.tokenValue
        : 0
      : tokensReceived;
  const amountTokenLabel =
    network === 'lifi' ? sourceToken?.symbol || 'TOKEN' : config.asset;
  const amountPlaceholder =
    network === 'lifi' ? (sourceToken?.symbol === 'ETH' ? '0.5' : '100') : config.placeholder;
  const lifiFeeUsd = lifiQuote
    ? sumUsdCosts(lifiQuote.estimate?.feeCosts) + sumUsdCosts(lifiQuote.estimate?.gasCosts)
    : 0;
  const sourceIsPolygonUsdc = isPolygonUsdcSource(sourceChainId, sourceToken?.address);
  const lifiSourceNeedsDirectPath = network === 'lifi' && sourceIsPolygonUsdc;

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  useEffect(() => {
    if (network !== 'lifi' || sourceChainId || !lifiChains.length) return;
    const preferredChain =
      lifiChains.find((chain) => chain.id === 1) ??
      lifiChains.find((chain) => chain.id !== 137) ??
      lifiChains[0];
    setSourceChainId(preferredChain.id);
  }, [network, sourceChainId, lifiChains]);

  useEffect(() => {
    if (network !== 'lifi') return;
    setSourceToken(null);
    setTokenSearch('');
    setOpenSelector(null);
  }, [network, sourceChainId]);

  useEffect(() => {
    if (network !== 'lifi' || sourceToken || !lifiTokens.length) return;
    const preferredToken =
      lifiTokens.find((token) => token.symbol.toUpperCase() === 'USDC') ??
      lifiTokens[0];
    setSourceToken(preferredToken);
  }, [network, sourceToken, lifiTokens]);

  useEffect(() => {
    if (network !== 'lifi') return;
    if (lifiQuoteKey && lifiQuoteKey !== currentLifiQuoteKey) {
      setLifiQuote(null);
      setLifiQuoteKey(null);
      setQuoteError(null);
    }
  }, [network, currentLifiQuoteKey, lifiQuoteKey]);

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

  const handleFetchLifiQuote = useCallback(async () => {
    if (
      !pool?.vaultAddress ||
      !walletAddress ||
      !sourceChainId ||
      !sourceToken ||
      sourceAmountRaw === '0' ||
      !currentLifiQuoteKey
    ) {
      return null;
    }

    setQuoteError(null);
    if (sourceIsPolygonUsdc) {
      setQuoteError('Polygon USDC already has a direct deposit path. Switch to Polygon USDC to avoid an unnecessary LI.FI route.');
      return null;
    }

    try {
      const quote = await lifiHook.quoteDeposit({
        fromChainId: sourceChainId,
        fromTokenAddress: sourceToken.address,
        fromAddress: walletAddress,
        vaultAddress: pool.vaultAddress,
        receiverAddress: walletAddress,
        fromAmountRaw: sourceAmountRaw,
      });
      setLifiQuote(quote);
      setLifiQuoteKey(currentLifiQuoteKey);
      return quote;
    } catch (err: any) {
      setQuoteError(err?.message || 'No LI.FI route available for this deposit.');
      return null;
    }
  }, [
    pool?.vaultAddress,
    walletAddress,
    sourceChainId,
    sourceToken,
    sourceAmountRaw,
    currentLifiQuoteKey,
    sourceIsPolygonUsdc,
    lifiHook,
  ]);

  const handleDeposit = useCallback(async () => {
    if (!pool || !walletAddress || !isValidAmount) return;

    setStep('processing');
    setDepositError(null);
    setFinalTxLink(null);

    try {
      if (network === 'polygon') {
        const rawAmount = BigInt(targetUsdcRaw);
        const { tx } = await api.prepareDeposit(pool.id, rawAmount.toString(), walletAddress);
        const hash = await polygonHook.deposit(tx.to, rawAmount, tx, walletAddress);
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
        const vaultAddress = pool.vaultAddress;
        if (!vaultAddress) throw new Error('Vault contract is not configured for this index.');

        const quote = isLifiQuoteFresh ? lifiQuote : await handleFetchLifiQuote();
        if (!quote) throw new Error('No fresh LI.FI quote available.');

        const result = await lifiHook.executeQuote(quote, {
          vaultAddress,
          signerAddress: walletAddress,
          receiverAddress: walletAddress,
        });
        setFinalTxHash(result.txHash ?? null);
        setFinalTxLink(result.txLink ?? null);
        if (result.txHash) {
          try {
            await api.confirmPoolDeposit(pool.id, result.txHash);
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
    lifiHook,
    isLifiQuoteFresh,
    lifiQuote,
    handleFetchLifiQuote,
    refreshPoolViews,
  ]);

  const handleReset = () => {
    setNetwork('polygon');
    setAmount('');
    setStep('select');
    setAgreed(false);
    setDepositError(null);
    setFinalTxHash(null);
    setFinalTxLink(null);
    setSourceChainId(null);
    setSourceToken(null);
    setChainSearch('');
    setTokenSearch('');
    setOpenSelector(null);
    setLifiQuote(null);
    setLifiQuoteKey(null);
    setQuoteError(null);
    polygonHook.reset();
    lifiHook.reset();
  };

  if (!pool) return null;

  const activeHook = network === 'polygon' ? polygonHook : lifiHook;
  const explorerUrl = finalTxLink || (finalTxHash ? `${POLYGON_CHAIN.blockExplorer}/tx/${finalTxHash}` : '');
  const canUseLifiSource = !!sourceChainId && !!sourceToken;
  const needsLifiQuote = network === 'lifi' && !isLifiQuoteFresh;
  const isQuoteLoading = lifiHook.status === 'quoting';
  const canContinue =
    isValidAmount &&
    !!walletAddress &&
    vaultReady &&
    (network === 'polygon' || (canUseLifiSource && !lifiSourceNeedsDirectPath));
  const selectButtonLabel = isQuoteLoading
    ? 'Getting LI.FI Quote...'
    : needsLifiQuote
      ? 'Get LI.FI Quote'
      : 'Review Deposit';
  const lifiQuoteSourceAmount = lifiQuote
    ? `${lifiSourceSpend} ${lifiQuote.action.fromToken.symbol}`
    : sourceToken
      ? `${amount || '0'} ${sourceToken.symbol}`
      : 'Select source token';

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
                      const availableNetworks: Network[] = ['polygon', 'lifi'];
                      const cols = cn(
                        "grid gap-3 mb-4",
                        fanToken
                          ? "grid-cols-3"
                          : "grid-cols-2"
                      );
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
                              {net === 'polygon' ? (
                                <UsdcIcon size={22} />
                              ) : (
                                <div className="w-[22px] h-[22px] rounded-full bg-[#19B6A5]/20 border border-[#19B6A5]/40 flex items-center justify-center">
                                  <span className="text-[9px] font-jura font-bold text-[#19B6A5]">LI</span>
                                </div>
                              )}
                              <span className="font-jura font-bold text-sm text-white">{c.asset}</span>
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

                    {network === 'lifi' && (
                      <div className="space-y-3 mb-5">
                        <div className="grid grid-cols-1 gap-2">
                          <label className="text-[10px] font-jura font-bold uppercase tracking-widest text-white/30">
                            Source chain
                          </label>
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setOpenSelector(openSelector === 'chain' ? null : 'chain')}
                              disabled={chainsLoading}
                              className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-left transition-colors hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:text-white/25"
                            >
                              <span className="flex min-w-0 items-center gap-3">
                                <ChainAvatar chain={selectedSourceChain} />
                                <span className="min-w-0">
                                  <span className="block truncate text-sm font-jura font-bold text-white">
                                    {chainsLoading ? 'Loading chains...' : chainLabel(selectedSourceChain)}
                                  </span>
                                  <span className="block truncate text-[10px] font-golos text-white/35">
                                    {selectedSourceChain ? `Chain ${selectedSourceChain.id}` : 'Choose any EVM source'}
                                  </span>
                                </span>
                              </span>
                              <span className="flex shrink-0 items-center gap-2">
                                <span className="rounded-full border border-[#19B6A5]/25 bg-[#19B6A5]/10 px-2 py-0.5 text-[9px] font-jura font-bold text-[#19B6A5]">
                                  EVM
                                </span>
                                <ChevronDown className="h-4 w-4 text-white/35" />
                              </span>
                            </button>

                            {openSelector === 'chain' && (
                              <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 rounded-xl border border-white/10 bg-[#11100D] p-2 shadow-2xl">
                                <div className="relative mb-2">
                                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />
                                  <input
                                    type="text"
                                    value={chainSearch}
                                    onChange={(event) => setChainSearch(event.target.value)}
                                    placeholder="Search chain"
                                    className="w-full rounded-lg border border-white/10 bg-black/20 py-2 pl-9 pr-3 text-sm font-golos text-white outline-none placeholder:text-white/20"
                                  />
                                </div>
                                <div className="max-h-52 overflow-y-auto">
                                  {filteredLifiChains.map((chain) => {
                                    const active = chain.id === sourceChainId;
                                    return (
                                      <button
                                        key={chain.id}
                                        type="button"
                                        onClick={() => {
                                          setSourceChainId(chain.id);
                                          setChainSearch('');
                                          setOpenSelector(null);
                                        }}
                                        className={cn(
                                          'flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left transition-colors',
                                          active
                                            ? 'border-[#19B6A5]/35 bg-[#19B6A5]/15'
                                            : 'border-transparent hover:bg-white/[0.05]'
                                        )}
                                      >
                                        <span className="flex min-w-0 items-center gap-3">
                                          <ChainAvatar chain={chain} />
                                          <span className="min-w-0">
                                            <span className="block truncate text-sm font-jura font-bold text-white">{chain.name}</span>
                                            <span className="block truncate text-[10px] font-golos text-white/35">Chain {chain.id}</span>
                                          </span>
                                        </span>
                                        <span className="flex shrink-0 items-center gap-2">
                                          <span className="rounded-full border border-white/10 px-2 py-0.5 text-[9px] font-jura font-bold text-white/35">
                                            EVM
                                          </span>
                                          {active && <CheckCircle className="h-4 w-4 text-[#19B6A5]" />}
                                        </span>
                                      </button>
                                    );
                                  })}
                                  {!chainsLoading && filteredLifiChains.length === 0 && (
                                    <div className="px-3 py-4 text-xs font-golos text-white/30">No chain found.</div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-2">
                          <label className="text-[10px] font-jura font-bold uppercase tracking-widest text-white/30">
                            Source token
                          </label>
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setOpenSelector(openSelector === 'token' ? null : 'token')}
                              disabled={!sourceChainId}
                              className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-left transition-colors hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:text-white/25"
                            >
                              <span className="flex min-w-0 items-center gap-3">
                                <TokenAvatar token={sourceToken} />
                                <span className="min-w-0">
                                  <span className="block truncate text-sm font-jura font-bold text-white">
                                    {sourceToken ? sourceToken.symbol : 'Select token'}
                                  </span>
                                  <span className="block truncate text-[10px] font-golos text-white/35">
                                    {sourceToken ? sourceToken.name : 'Token sent from your wallet'}
                                  </span>
                                </span>
                              </span>
                              <span className="flex shrink-0 items-center gap-2">
                                {selectedSourceChain && (
                                  <span className="hidden rounded-full border border-white/10 px-2 py-0.5 text-[9px] font-jura font-bold text-white/35 sm:inline">
                                    {selectedSourceChain.name}
                                  </span>
                                )}
                                <ChevronDown className="h-4 w-4 text-white/35" />
                              </span>
                            </button>

                            {openSelector === 'token' && (
                              <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 rounded-xl border border-white/10 bg-[#11100D] p-2 shadow-2xl">
                                <div className="relative mb-2">
                                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />
                                  <input
                                    type="text"
                                    value={tokenSearch}
                                    onChange={(event) => setTokenSearch(event.target.value)}
                                    placeholder="Search token"
                                    className="w-full rounded-lg border border-white/10 bg-black/20 py-2 pl-9 pr-3 text-sm font-golos text-white outline-none placeholder:text-white/20"
                                  />
                                </div>
                                <div className="max-h-56 overflow-y-auto">
                                  {tokensLoading && (
                                    <div className="px-3 py-4 text-xs font-golos text-white/30">Loading tokens...</div>
                                  )}
                                  {!tokensLoading && lifiTokens.length === 0 && (
                                    <div className="px-3 py-4 text-xs font-golos text-white/30">No token found.</div>
                                  )}
                                  {!tokensLoading && lifiTokens.map((token) => {
                                    const active = sourceToken?.chainId === token.chainId &&
                                      sourceToken?.address.toLowerCase() === token.address.toLowerCase();
                                    return (
                                      <button
                                        key={`${token.chainId}-${token.address}`}
                                        type="button"
                                        onClick={() => {
                                          setSourceToken(token);
                                          setTokenSearch('');
                                          setOpenSelector(null);
                                        }}
                                        className={cn(
                                          'flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left transition-colors',
                                          active
                                            ? 'border-[#19B6A5]/35 bg-[#19B6A5]/15'
                                            : 'border-transparent hover:bg-white/[0.05]'
                                        )}
                                      >
                                        <span className="flex min-w-0 items-center gap-3">
                                          <TokenAvatar token={token} />
                                          <span className="min-w-0">
                                            <span className="block truncate text-sm font-jura font-bold text-white">{token.symbol}</span>
                                            <span className="block truncate text-[10px] font-golos text-white/35">{token.name}</span>
                                          </span>
                                        </span>
                                        <span className="flex shrink-0 items-center gap-2">
                                          <span className="hidden text-[10px] font-golos text-white/30 sm:inline">
                                            {chainLabel(selectedSourceChain)}
                                          </span>
                                          {active && <CheckCircle className="h-4 w-4 text-[#19B6A5]" />}
                                        </span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3 p-3 rounded-xl mb-5 text-xs font-golos" style={{ background: config.colorLight, border: `1px solid ${config.colorBorder}` }}>
                      <Info className="w-4 h-4 shrink-0 mt-0.5" style={{ color: config.color }} />
                      <p className="text-white/60 leading-relaxed">{config.receiveDesc}</p>
                    </div>

                    <p className="text-xs font-jura font-bold uppercase tracking-widest text-white/30 mb-3">
                      2. Enter {network === 'lifi' ? 'source token amount' : 'amount'}
                    </p>

                    <div className="relative rounded-xl border overflow-hidden mb-3 transition-all" style={{ borderColor: amount ? config.colorBorder : 'rgba(255,255,255,0.1)' }}>
                      <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={amountPlaceholder} min={config.minAmount} max={config.maxAmount}
                        className="w-full bg-white/[0.03] text-white text-xl font-mono font-bold px-4 py-4 pr-24 outline-none placeholder:text-white/15 font-golos" />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                        {network === 'lifi' ? <TokenAvatar token={sourceToken} /> : <UsdcIcon size={18} />}
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
                          <span className="text-xs font-golos text-white/40">
                            {network === 'lifi' ? 'You send' : 'You send'}
                          </span>
                          <span className="text-sm font-mono text-white">
                            {network === 'lifi'
                              ? `${amount} ${amountTokenLabel}`
                              : `≈ $${usdValue.toFixed(4)}`}
                          </span>
                        </div>
                        {network === 'lifi' && (
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-golos text-white/40">Estimated Polygon USDC</span>
                            <span className="text-sm font-mono text-white">{lifiEstimatedUsdcLabel}</span>
                          </div>
                        )}
                        {FEE_PCT > 0 && (
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-golos text-white/40">Protocol fee ({(FEE_PCT * 100).toFixed(0)}%)</span>
                            <span className="text-sm font-mono text-red-400">− ${(usdValue * FEE_PCT).toFixed(4)}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center pt-2 border-t border-white/[0.06]">
                          <span className="text-xs font-golos text-white/40">Estimated tokens</span>
                          <span className="text-sm font-mono font-bold text-white">
                            {network === 'lifi' && !lifiQuote
                              ? 'Quote required'
                              : `${displayedTokensReceived.toFixed(4)} `}
                            {network === 'polygon' || lifiQuote ? (
                              <span className="text-white/30 text-xs">${pool.symbol}</span>
                            ) : null}
                          </span>
                        </div>
                      </motion.div>
                    )}

                    {network === 'lifi' && sourceToken && (
                      <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 mb-5 text-xs font-golos">
                        <div className="flex justify-between gap-3 mb-2">
                          <span className="text-white/40">Source</span>
                          <span className="text-right font-jura font-semibold text-white">
                            {sourceToken.symbol} on {chainLabel(selectedSourceChain)}
                          </span>
                        </div>
                        <div className="flex justify-between gap-3 mb-2">
                          <span className="text-white/40">Source amount</span>
                          <span className="text-right font-mono font-semibold text-white">{lifiQuoteSourceAmount}</span>
                        </div>
                        <div className="flex justify-between gap-3 mb-2">
                          <span className="text-white/40">Polygon USDC received</span>
                          <span className="text-right font-mono font-semibold text-white">{lifiEstimatedUsdcLabel}</span>
                        </div>
                        {lifiQuote && (
                          <>
                            <div className="flex justify-between gap-3 mb-2">
                              <span className="text-white/40">Route</span>
                              <span className="text-right font-jura font-semibold text-white">{quoteRouteLabel(lifiQuote)}</span>
                            </div>
                            <div className="flex justify-between gap-3 mb-2">
                              <span className="text-white/40">Fees / gas estimate</span>
                              <span className="text-right font-mono font-semibold text-white">≈ ${lifiFeeUsd.toFixed(2)}</span>
                            </div>
                          </>
                        )}
                        <div className="flex justify-between gap-3 pt-2 border-t border-white/[0.06]">
                          <span className="text-white/40">Destination</span>
                          <span className="text-right font-jura font-semibold text-[#19B6A5]">Polygon USDC {'->'} Index contract</span>
                        </div>
                        {sourceIsPolygonUsdc && (
                          <div className="mt-3 flex flex-col gap-2 rounded-lg border border-[#FEB413]/20 bg-[#FEB413]/10 p-3">
                            <p className="text-[11px] leading-relaxed text-[#FEB413]/80">
                              Polygon USDC already has the faster direct deposit path. Use it so the approve and vault deposit are prepared for the same transaction account.
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                setNetwork('polygon');
                                setLifiQuote(null);
                                setLifiQuoteKey(null);
                                setQuoteError(null);
                              }}
                              className="w-fit rounded-lg border border-[#FEB413]/30 px-3 py-1.5 font-jura text-[11px] font-bold uppercase tracking-wider text-[#FEB413] transition-colors hover:bg-[#FEB413]/15"
                            >
                              Use Polygon USDC
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {quoteError && (
                      <p className="text-xs font-golos text-red-400 mb-4">{quoteError}</p>
                    )}

                    {numAmount > 0 && !isValidAmount && (
                      <p className="text-xs font-golos text-red-400 mb-4">
                        {network === 'lifi'
                          ? `Enter a valid ${amountTokenLabel} amount.`
                          : `Min: ${config.minAmount.toLocaleString()} ${config.asset} · Max: ${config.maxAmount.toLocaleString()} ${config.asset}`}
                      </p>
                    )}

                    {!vaultReady && (
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-[#FEB413]/10 border border-[#FEB413]/20 text-xs font-golos text-[#FEB413]/80 mb-3">
                        <Info className="w-4 h-4 shrink-0 text-[#FEB413]" />
                        <span>Vault contract not yet deployed on Polygon. Contact admin to activate this pool.</span>
                      </div>
                    )}

                    <button
                      onClick={needsLifiQuote ? handleFetchLifiQuote : () => setStep('confirm')}
                      disabled={!canContinue || isQuoteLoading}
                      className={cn('w-full py-4 rounded-xl font-jura font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2',
                        canContinue && !isQuoteLoading ? 'text-white hover:opacity-90 hover:shadow-lg' : 'bg-white/5 text-white/20 cursor-not-allowed border border-white/10'
                      )}
                      style={canContinue && !isQuoteLoading ? { background: config.color } : {}}
                    >
                      {isQuoteLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                      {selectButtonLabel}
                      {!isQuoteLoading && <ArrowRight className="w-4 h-4" />}
                    </button>
                  </motion.div>
                )}

                {step === 'confirm' && (
                  <motion.div key="confirm" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.18 }}>
                    <p className="text-xs font-jura font-bold uppercase tracking-widest text-white/30 mb-4">Review your deposit</p>

                    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl divide-y divide-white/[0.06] mb-5">
                      {(network === 'polygon'
                        ? [
                            { label: 'Network', value: config.chain },
                            { label: 'You send', value: `${numAmount.toLocaleString()} ${config.asset}` },
                            { label: 'USD equivalent', value: `≈ $${usdValue.toFixed(2)}` },
                            { label: 'Estimated tokens', value: `${displayedTokensReceived.toFixed(4)} $${pool.symbol}` },
                            { label: 'Token type', value: config.receives },
                            { label: 'Signed by', value: 'Connected wallet' },
                          ]
                        : [
                            { label: 'Source chain', value: chainLabel(selectedSourceChain) },
                            { label: 'Source token', value: tokenLabel(sourceToken) },
                            { label: 'Source amount', value: lifiQuoteSourceAmount },
                            { label: 'Polygon USDC received', value: lifiEstimatedUsdcLabel },
                            { label: 'Route', value: quoteRouteLabel(lifiQuote) },
                            { label: 'Estimated index tokens', value: `${displayedTokensReceived.toFixed(4)} $${pool.symbol}` },
                            { label: 'Funds receiver', value: 'Index vault' },
                            { label: 'Index receiver', value: walletAddress ? truncateAddr(walletAddress) : 'Connected wallet' },
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
                        {network === 'polygon'
                          ? 'You will sign 2 transactions in your wallet: approve USDC + deposit.'
                          : 'LI.FI will request the approval and route transactions needed to deliver Polygon USDC into the index contract.'}
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
                    <h3 className="text-2xl font-jura font-bold text-white mb-2">Deposit Confirmed!</h3>
                    <p className="font-golos text-white/40 text-sm mb-6">
                      Your entry into <span className="text-white font-semibold">{formatPoolName(pool.team)}</span> was confirmed.
                      {network === 'lifi' && ' LI.FI converted your source token into Polygon USDC and called the index vault with your wallet as receiver.'}
                    </p>
                    {finalTxHash && (
                      <a href={explorerUrl} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm font-jura font-medium mb-6 hover:underline" style={{ color: config.color }}>
                        View on explorer <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 mb-6 text-left">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-golos text-white/40">{network === 'lifi' ? 'Polygon USDC received' : 'Amount sent'}</span>
                        <span className="font-mono font-bold text-white">
                          {network === 'lifi'
                            ? lifiEstimatedUsdcLabel
                            : `${numAmount.toLocaleString()} ${config.asset}`}
                        </span>
                      </div>
                      {network === 'lifi' && (
                        <div className="flex justify-between text-sm mb-2">
                          <span className="font-golos text-white/40">Source spend</span>
                          <span className="font-mono font-bold text-white">{lifiQuoteSourceAmount}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="font-golos text-white/40">Estimated tokens</span>
                        <span className="font-mono font-bold" style={{ color: config.color }}>{displayedTokensReceived.toFixed(4)} ${pool.symbol}</span>
                      </div>
                    </div>
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
