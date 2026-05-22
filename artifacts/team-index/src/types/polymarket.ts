export type MarketType = 'game' | 'future';
export type MarketSide = 'YES' | 'NO';
export type MarketStatus = 'open' | 'closed' | 'settled';

/** Single market returned by Gamma API search */
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
}

/** Current open position in a vault (user-facing) */
export interface VaultPosition {
  conditionId: string;
  question: string;
  marketType: MarketType;
  selectedSide: MarketSide;
  sizeUsdc: number;
  entryPrice: number;
  currentPrice: number;
  unrealizedPnl: number;
  unrealizedPnlPct: number;
  status: MarketStatus;
  endsAt: string | null;
}
