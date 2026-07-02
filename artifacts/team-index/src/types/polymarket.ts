export type MarketType = 'game' | 'future';
export type MarketSide = 'YES' | 'NO';
export type MarketStatus = 'open' | 'closed' | 'settled' | 'cancelled';

/** Legacy market shape kept for allocation data compatibility */
export interface GammaMarket {
  id: string;
  conditionId: string;
  question: string;
  endDateIso: string | null;
  liquidity: number;
  volume24h: number;
  yesPrice: number;
  noPrice: number;
  active: boolean;
  closed: boolean;
  tokens: Array<{ token_id: string; outcome: string }>;
  eventId?: string;
  eventSlug?: string;
  eventTitle?: string;
  marketType?: MarketType;
  /** Polymarket game identifier (populated for match markets only) */
  gameId?: string | null;
  /** Kickoff / match start time (ISO) for game markets */
  gameStartTime?: string | null;
  /** Polymarket's own classification: "match" | "future" | "outright" | null */
  sportsMarketType?: string | null;
}

/** Market manually selected by admin, ready to be fed to the engine */
export interface SelectedMarket {
  marketId: string;
  conditionId: string;
  tokenId: string;
  eventId: string;
  question: string;
  marketType: MarketType;
  selectedSide: MarketSide;
  manualClusterId?: string;
}

/** Live data fetched from Polymarket CLOB for a selected market */
export interface MarketClobData {
  conditionId: string;
  price: number;
  bestBid: number;
  bestAsk: number;
  midpoint: number;
  spread: number;
  liquidity: number;
  volume24h: number;
  depthAt2PctSlippage: number;
  estimatedSlippage: number;
  daysToResolution: number;
  marketStatus: 'open' | 'closed';
  historicalPrices: Array<{ t: number; p: number }>;
}

/** Allocation result for a single market (passed) */
export interface ScoredAllocation {
  marketId: string;
  conditionId: string;
  question: string;
  selectedSide: MarketSide;
  price: number;
  qualityScore: number;
  adjustedScore: number;
  correlationRisk: 'Low' | 'Medium' | 'High';
  historicalRisk: 'Low' | 'Medium' | 'High';
  allocationWeight: number;
  allocationAmount: number;
  reasons: string[];
  rejected: false;

  // ─── Quant diagnostics (optional; populated by the v2 engine) ───────────────
  /** Model-implied "true" probability q for the chosen side (= price + edge). */
  impliedProb?: number;
  /** Net per-position edge in basis points: (q − price)/price, after costs. */
  edgeBps?: number;
  /** Full-Kelly fraction f* = (q − price)/(1 − price) before fractional scaling. */
  kellyFraction?: number;
  /** Share of total portfolio variance contributed by this position (0–1). */
  riskContributionPct?: number;
  /** Holding-period return volatility of this position (0–1). */
  periodVolPct?: number;
  /** Momentum t-stat of the logit price trend (sign = direction vs chosen side). */
  momentumZ?: number;
  /** Variance-ratio persistence: >1 trending, <1 mean-reverting, ~1 random walk. */
  trendPersistence?: number;
  /** Which risk limit clipped this position, if any. */
  bindingConstraint?:
    | 'per-market'
    | 'liquidity'
    | 'depth'
    | 'per-event'
    | 'per-cluster'
    | 'corr-group'
    | 'total-exposure'
    | null;
}

/** Market rejected by the engine */
export interface RejectedMarket {
  marketId: string;
  conditionId: string;
  question: string;
  reason: string;
  rejected: true;
}

/** Full output of the allocation engine */
export interface AllocationProposal {
  nav: number;
  targetExposure: number;
  cashWeight: number;
  cashAmount: number;
  portfolioQuality: number;
  goodMarketsCount: number;
  independentGoodMarketsCount: number;
  allocations: ScoredAllocation[];
  rejectedMarkets: RejectedMarket[];
  clusterExposure: Record<string, number>;

  // ─── Portfolio-level quant diagnostics (optional; populated by the v2 engine) ─
  /** Expected portfolio return on NAV over the holding horizon (fraction). */
  expectedReturnPct?: number;
  /** Expected portfolio volatility on NAV over the holding horizon (fraction). */
  expectedVolPct?: number;
  /** Annual-ish volatility target the gross exposure was sized to (fraction). */
  targetVolPct?: number;
  /** Expected return / expected vol (a Sharpe-like ratio). */
  riskAdjustedReturn?: number;
  /** Diversification ratio: Σ(wᵢσᵢ) / σ_portfolio (≥1; higher = more diversified). */
  diversificationRatio?: number;
  /** Effective number of independent bets = 1 / Σ wᵢ² (on invested weights). */
  effectiveBets?: number;
  /** Confidence in the edge signal (0–1): drives how far gross moves above the floor. */
  signalConfidence?: number;
  /** Short label describing the sizing method actually used. */
  methodology?: string;
}

export interface VaultPositionFormatted {
  sizeUsdc?: string;
  entryPrice?: string;
  currentPrice?: string;
  unrealizedPnl?: string;
  unrealizedPnlPct?: string;
  realizedPnl?: string;
  plannedStake?: string;
  plannedQuantity?: string;
  filledStake?: string;
  filledQuantity?: string;
  fillPct?: string;
  investedAmount?: string;
  currentValue?: string;
}

export interface VaultPositionOrder {
  id: string | null;
  status: string;
  side: MarketSide | string;
  marketId: string;
  tokenId: string;
  queueId: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

/** Current open position in a vault (user-facing) */
export interface VaultPosition {
  id?: string;
  poolId?: string;
  queueId?: string | null;
  eventId?: string;
  marketId?: string;
  tokenId?: string;
  clobOrderId?: string | null;
  conditionId: string;
  question: string;
  marketType: MarketType;
  selectedSide: MarketSide;
  sizeUsdc: number;
  entryPrice: number;
  currentPrice: number;
  unrealizedPnl: number;
  unrealizedPnlPct: number;
  realizedPnl?: number;
  status: MarketStatus;
  endsAt: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  order?: VaultPositionOrder;
  planned?: {
    stake: number;
    quantity: number;
  };
  filled?: {
    stake: number;
    quantity: number;
    fillPct: number;
  };
  valuation?: {
    entryPrice: number;
    currentPrice: number;
    investedAmount: number;
    currentValue: number;
    unrealizedPnl: number;
    unrealizedPnlPct: number;
    realizedPnl: number;
  };
  formatted?: VaultPositionFormatted;
}
