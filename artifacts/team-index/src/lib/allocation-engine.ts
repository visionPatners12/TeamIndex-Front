/**
 * Polymarket Allocation Proposal Engine
 *
 * Receives selected markets + live CLOB data, proposes conservative capital
 * allocation between 30% and 80% of NAV.
 *
 * Does NOT execute trades — display only.
 */

import type {
  SelectedMarket,
  MarketClobData,
  ScoredAllocation,
  RejectedMarket,
  AllocationProposal,
} from '@/types/polymarket';

// ─── Defaults ────────────────────────────────────────────────────────────────

const MAX_EXPOSURE        = 0.80;
const MIN_EXPOSURE        = 0.30;
const MAX_PER_MARKET      = 0.08;   // 8% NAV
const MAX_PER_EVENT       = 0.15;   // 15% NAV
const MAX_PER_CLUSTER     = 0.25;   // 25% NAV
const MAX_BY_LIQUIDITY    = 0.10;   // 10% of market liquidity
const MAX_BY_DEPTH_PCT    = 0.50;   // 50% of depth @ 2% slippage
const CORRELATION_PENALTY = 1.5;
const QUALITY_THRESHOLD   = 0.70;
const CORRELATION_INDEPENDENT_THRESHOLD = 0.50;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function normalize(value: number, min: number, max: number): number {
  return clamp((value - min) / (max - min), 0, 1);
}

// ─── Score Components ─────────────────────────────────────────────────────────

function probabilityScore(price: number): number {
  return normalize(price, 0.50, 0.90);
}

function liquidityScore(liquidity: number): number {
  return Math.min(1, liquidity / 50_000);
}

function volumeScore(volume24h: number): number {
  return Math.min(1, volume24h / 20_000);
}

function depthScore(depthAt2Pct: number): number {
  return Math.min(1, depthAt2Pct / 5_000);
}

function resolutionScore(days: number): number {
  if (days <= 0)   return 0;
  if (days <= 1)   return 0.35;
  if (days <= 7)   return 0.90;
  if (days <= 21)  return 1.00;
  if (days <= 60)  return 0.75;
  if (days <= 120) return 0.55;
  return 0.35;
}

function spreadPenalty(spread: number): number {
  return Math.min(1, spread / 0.04);
}

function slippagePenalty(slippage: number): number {
  return Math.min(1, slippage / 0.03);
}

function priceStabilityScore(history: Array<{ t: number; p: number }>): {
  stability: number;
  drawdown: number;
} {
  if (history.length < 3) return { stability: 0.5, drawdown: 0 };

  const prices = history.map(h => h.p);
  const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
  const variance =
    prices.reduce((acc, p) => acc + Math.pow(p - mean, 2), 0) / prices.length;
  const stdDev = Math.sqrt(variance);
  const stability = clamp(1 - stdDev * 5, 0, 1);

  let peak = prices[0];
  let maxDrawdown = 0;
  for (const p of prices) {
    if (p > peak) peak = p;
    const drawdown = (peak - p) / peak;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  }

  return { stability, drawdown: maxDrawdown };
}

// ─── Quality Score ────────────────────────────────────────────────────────────

interface QualityComponents {
  qualityScore: number;
  stabilityScore: number;
  drawdownScore: number;
}

function calculateQualityScore(
  price: number,
  clob: MarketClobData
): QualityComponents {
  const { stability, drawdown } = priceStabilityScore(clob.historicalPrices);

  const pScore   = probabilityScore(price);
  const lScore   = liquidityScore(clob.liquidity);
  const vScore   = volumeScore(clob.volume24h);
  const dScore   = depthScore(clob.depthAt2PctSlippage);
  const rScore   = resolutionScore(clob.daysToResolution);
  const sPenalty = spreadPenalty(clob.spread);
  const slPenalty = slippagePenalty(clob.estimatedSlippage);
  const ddPenalty = Math.min(1, drawdown / 0.5);

  const raw =
    0.25 * pScore +
    0.15 * lScore +
    0.15 * vScore +
    0.20 * dScore +
    0.10 * rScore +
    0.10 * stability -
    0.05 * sPenalty -
    0.05 * slPenalty -
    0.05 * ddPenalty;

  return {
    qualityScore: clamp(raw, 0, 1),
    stabilityScore: stability,
    drawdownScore: drawdown,
  };
}

// ─── Rejection Rules ─────────────────────────────────────────────────────────

function getRejectionReason(
  clob: MarketClobData
): string | null {
  if (clob.marketStatus === 'closed')         return 'Market is closed';
  if (clob.daysToResolution <= 0)             return 'Market already resolved';
  if (clob.spread > 0.06)                     return 'Spread too high (> 6%)';
  if (clob.estimatedSlippage > 0.04)          return 'Slippage too high (> 4%)';
  if (liquidityScore(clob.liquidity) < 0.20)  return 'Liquidity too low';
  if (depthScore(clob.depthAt2PctSlippage) < 0.20) return 'Order book depth too low';
  return null;
}

// ─── Correlation ─────────────────────────────────────────────────────────────

function ruleBasedCorrelation(a: SelectedMarket, b: SelectedMarket): number {
  if (a.conditionId === b.conditionId) {
    if (a.selectedSide !== b.selectedSide) return -0.90;
    return 1.00;
  }
  if (a.eventId && a.eventId === b.eventId) return 0.80;
  if (
    a.manualClusterId &&
    b.manualClusterId &&
    a.manualClusterId === b.manualClusterId
  ) return 0.70;
  return 0.10;
}

function historicalCorrelation(
  aHistory: Array<{ t: number; p: number }>,
  bHistory: Array<{ t: number; p: number }>
): number | null {
  if (aHistory.length < 5 || bHistory.length < 5) return null;

  const len = Math.min(aHistory.length, bHistory.length);
  const a = aHistory.slice(-len).map(h => h.p);
  const b = bHistory.slice(-len).map(h => h.p);

  const meanA = a.reduce((s, v) => s + v, 0) / len;
  const meanB = b.reduce((s, v) => s + v, 0) / len;

  let cov = 0, varA = 0, varB = 0;
  for (let i = 0; i < len; i++) {
    const da = a[i] - meanA;
    const db = b[i] - meanB;
    cov  += da * db;
    varA += da * da;
    varB += db * db;
  }

  const denom = Math.sqrt(varA * varB);
  if (denom === 0) return null;
  return clamp(cov / denom, -1, 1);
}

function finalCorrelation(
  a: SelectedMarket,
  b: SelectedMarket,
  aClob: MarketClobData,
  bClob: MarketClobData
): number {
  const ruleBased = ruleBasedCorrelation(a, b);
  const hist = historicalCorrelation(aClob.historicalPrices, bClob.historicalPrices);

  if (hist === null) return ruleBased;
  return 0.60 * ruleBased + 0.40 * hist;
}

// ─── Dynamic Exposure ────────────────────────────────────────────────────────

interface ExposureInputs {
  qualityScores: number[];
  correlationMatrix: number[][];
  clusterIds: Array<string | undefined>;  // manualClusterId per market
}

function calculateDynamicExposure({ qualityScores, correlationMatrix, clusterIds }: ExposureInputs): {
  targetExposure: number;
  goodMarketsCount: number;
  independentGoodMarketsCount: number;
  averageQualityScore: number;
} {
  const n = qualityScores.length;
  const goodIndices = qualityScores
    .map((s, i) => ({ s, i }))
    .filter(({ s }) => s >= QUALITY_THRESHOLD);

  const goodMarketsCount = goodIndices.length;
  const averageQualityScore = n > 0
    ? qualityScores.reduce((a, b) => a + b, 0) / n
    : 0;

  // Count independent good markets (no high correlation pair)
  let independentGoodMarketsCount = 0;
  for (const { i } of goodIndices) {
    const isDependent = goodIndices.some(({ i: j }) => {
      if (i === j) return false;
      return (correlationMatrix[i]?.[j] ?? 0) >= CORRELATION_INDEPENDENT_THRESHOLD;
    });
    if (!isDependent) independentGoodMarketsCount++;
  }

  const qualityBonus         = averageQualityScore * 0.30;
  const diversificationBonus = Math.min(independentGoodMarketsCount / 6, 1) * 0.20;

  // Biggest cluster share: what fraction of markets share the same manualClusterId
  const clusterCounts = new Map<string, number>();
  for (const cid of clusterIds) {
    if (cid && cid.trim()) {
      clusterCounts.set(cid, (clusterCounts.get(cid) ?? 0) + 1);
    }
  }
  const biggestClusterCount = clusterCounts.size > 0
    ? Math.max(...clusterCounts.values())
    : 0;
  const biggestClusterShare = n > 0 ? biggestClusterCount / n : 0;
  const clusterPenalty      = biggestClusterShare * 0.20;

  const targetExposure = clamp(
    MIN_EXPOSURE + qualityBonus + diversificationBonus - clusterPenalty,
    MIN_EXPOSURE,
    MAX_EXPOSURE
  );

  return { targetExposure, goodMarketsCount, independentGoodMarketsCount, averageQualityScore };
}

// ─── Allocation Reasons ───────────────────────────────────────────────────────

function buildReasons(price: number, clob: MarketClobData, stability: number, drawdown: number): string[] {
  const reasons: string[] = [];

  if (price >= 0.75) reasons.push('Strong probability');
  else if (price >= 0.60) reasons.push('Good probability');
  else reasons.push('Moderate probability');

  if (clob.liquidity >= 20_000) reasons.push('Good liquidity');
  else reasons.push('Limited liquidity');

  if (clob.spread <= 0.02) reasons.push('Low spread');
  else if (clob.spread <= 0.04) reasons.push('Acceptable spread');
  else reasons.push('Elevated spread');

  if (stability >= 0.70) reasons.push('Stable historical price');
  else if (stability >= 0.40) reasons.push('Moderate price stability');
  else reasons.push('Volatile historical price');

  if (drawdown >= 0.30) reasons.push('Notable historical drawdown');

  if (clob.daysToResolution <= 7) reasons.push('Short-term (quick resolution)');
  else if (clob.daysToResolution <= 21) reasons.push('Near-term resolution');
  else if (clob.daysToResolution > 60) reasons.push('Long-term market');

  if (clob.volume24h >= 10_000) reasons.push('High 24h volume');

  return reasons;
}

// ─── Main Engine ─────────────────────────────────────────────────────────────

export function runAllocationEngine(
  selectedMarkets: SelectedMarket[],
  clobData: Map<string, MarketClobData>,
  nav: number
): AllocationProposal {
  if (selectedMarkets.length === 0 || nav <= 0) {
    return {
      nav,
      targetExposure: MIN_EXPOSURE,
      cashWeight: 1 - MIN_EXPOSURE,
      cashAmount: nav * (1 - MIN_EXPOSURE),
      portfolioQuality: 0,
      goodMarketsCount: 0,
      independentGoodMarketsCount: 0,
      allocations: [],
      rejectedMarkets: [],
      clusterExposure: { cash: 1 },
    };
  }

  const rejected: RejectedMarket[] = [];
  const valid: Array<{
    market: SelectedMarket;
    clob: MarketClobData;
    price: number;
    qualityScore: number;
    stabilityScore: number;
    drawdownScore: number;
  }> = [];

  // Step 1: reject bad markets, score the rest
  for (const market of selectedMarkets) {
    const clob = clobData.get(market.conditionId);
    if (!clob) {
      rejected.push({
        marketId: market.marketId,
        conditionId: market.conditionId,
        question: market.question,
        reason: 'Market data unavailable',
        rejected: true,
      });
      continue;
    }

    const rejectionReason = getRejectionReason(clob);
    if (rejectionReason) {
      rejected.push({
        marketId: market.marketId,
        conditionId: market.conditionId,
        question: market.question,
        reason: rejectionReason,
        rejected: true,
      });
      continue;
    }

    // Use the selected side's price
    const price = market.selectedSide === 'YES' ? clob.price : 1 - clob.price;
    const { qualityScore, stabilityScore, drawdownScore } = calculateQualityScore(price, clob);

    valid.push({ market, clob, price, qualityScore, stabilityScore, drawdownScore });
  }

  if (valid.length === 0) {
    return {
      nav,
      targetExposure: MIN_EXPOSURE,
      cashWeight: 1 - MIN_EXPOSURE,
      cashAmount: nav * (1 - MIN_EXPOSURE),
      portfolioQuality: 0,
      goodMarketsCount: 0,
      independentGoodMarketsCount: 0,
      allocations: [],
      rejectedMarkets: rejected,
      clusterExposure: { cash: 1 },
    };
  }

  // Step 2: build correlation matrix
  const n = valid.length;
  const corrMatrix: number[][] = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => {
      if (i === j) return 1;
      return finalCorrelation(
        valid[i].market,
        valid[j].market,
        valid[i].clob,
        valid[j].clob
      );
    })
  );

  // Step 3: dynamic exposure
  const qualityScores = valid.map(v => v.qualityScore);
  const clusterIds    = valid.map(v => v.market.manualClusterId);
  const { targetExposure, goodMarketsCount, independentGoodMarketsCount, averageQualityScore } =
    calculateDynamicExposure({ qualityScores, correlationMatrix: corrMatrix, clusterIds });

  // Step 4: correlation-adjusted scores
  const preWeights = qualityScores.map(s => s / qualityScores.reduce((a, b) => a + b, 0));

  const adjustedScores = valid.map((v, i) => {
    const correlationBurden = valid.reduce((sum, _, j) => {
      if (i === j) return sum;
      return sum + preWeights[j] * Math.max(corrMatrix[i][j], 0);
    }, 0);
    return v.qualityScore / (1 + CORRELATION_PENALTY * correlationBurden);
  });

  const totalAdjusted = adjustedScores.reduce((a, b) => a + b, 0);
  const investableAmount = nav * targetExposure;

  // Step 5: raw allocations
  const rawAllocations = valid.map((v, i) => ({
    ...v,
    adjustedScore: adjustedScores[i],
    rawWeight: totalAdjusted > 0 ? adjustedScores[i] / totalAdjusted : 0,
    rawAmount: totalAdjusted > 0 ? investableAmount * (adjustedScores[i] / totalAdjusted) : 0,
  }));

  // Step 6: apply risk limits
  const eventAllocated = new Map<string, number>();
  const clusterAllocated = new Map<string, number>();
  let totalAllocated = 0;

  const capped = rawAllocations.map(v => {
    let amount = v.rawAmount;

    // Per-market cap
    amount = Math.min(amount, nav * MAX_PER_MARKET);

    // Per-market liquidity cap
    amount = Math.min(amount, v.clob.liquidity * MAX_BY_LIQUIDITY);

    // Per-market depth cap
    amount = Math.min(amount, v.clob.depthAt2PctSlippage * MAX_BY_DEPTH_PCT);

    // Per-event cap
    if (v.market.eventId) {
      const used = eventAllocated.get(v.market.eventId) ?? 0;
      const remaining = nav * MAX_PER_EVENT - used;
      if (remaining <= 0) { amount = 0; }
      else { amount = Math.min(amount, remaining); }
    }

    // Per-cluster cap
    if (v.market.manualClusterId) {
      const used = clusterAllocated.get(v.market.manualClusterId) ?? 0;
      const remaining = nav * MAX_PER_CLUSTER - used;
      if (remaining <= 0) { amount = 0; }
      else { amount = Math.min(amount, remaining); }
    }

    // Total exposure cap
    if (totalAllocated + amount > nav * MAX_EXPOSURE) {
      amount = Math.max(0, nav * MAX_EXPOSURE - totalAllocated);
    }

    totalAllocated += amount;
    if (v.market.eventId) eventAllocated.set(v.market.eventId, (eventAllocated.get(v.market.eventId) ?? 0) + amount);
    if (v.market.manualClusterId) clusterAllocated.set(v.market.manualClusterId, (clusterAllocated.get(v.market.manualClusterId) ?? 0) + amount);

    return { ...v, finalAmount: amount };
  });

  // Step 7: build output allocations
  const allocations: ScoredAllocation[] = capped.map(v => {
    const corrBurden = adjustedScores.reduce((sum, _, j) => {
      const idx = capped.indexOf(v);
      if (idx === j) return sum;
      return sum + Math.max(corrMatrix[idx]?.[j] ?? 0, 0);
    }, 0);
    const corrRisk: ScoredAllocation['correlationRisk'] =
      corrBurden > 1.2 ? 'High' : corrBurden > 0.6 ? 'Medium' : 'Low';
    const histRisk: ScoredAllocation['historicalRisk'] =
      v.drawdownScore > 0.35 ? 'High' : v.drawdownScore > 0.15 ? 'Medium' : 'Low';

    return {
      marketId: v.market.marketId,
      conditionId: v.market.conditionId,
      question: v.market.question,
      selectedSide: v.market.selectedSide,
      price: v.price,
      qualityScore: v.qualityScore,
      adjustedScore: v.adjustedScore,
      correlationRisk: corrRisk,
      historicalRisk: histRisk,
      allocationWeight: nav > 0 ? v.finalAmount / nav : 0,
      allocationAmount: v.finalAmount,
      reasons: buildReasons(v.price, v.clob, v.stabilityScore, v.drawdownScore),
      rejected: false,
    };
  });

  // Step 8: cluster exposure summary
  const clusterExposure: Record<string, number> = {};
  for (const [k, v] of clusterAllocated.entries()) {
    clusterExposure[k] = nav > 0 ? v / nav : 0;
  }
  clusterExposure['cash'] = nav > 0 ? (nav - totalAllocated) / nav : 1;

  return {
    nav,
    targetExposure,
    cashWeight: nav > 0 ? (nav - totalAllocated) / nav : 1 - MIN_EXPOSURE,
    cashAmount: nav - totalAllocated,
    portfolioQuality: averageQualityScore,
    goodMarketsCount,
    independentGoodMarketsCount,
    allocations,
    rejectedMarkets: rejected,
    clusterExposure,
  };
}
