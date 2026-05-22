/**
 * Polymarket data fetching module.
 * All calls route through the backend proxy to avoid CORS issues.
 * Backend needs:  GET /admin/polymarket/search?q=...
 *                 GET /admin/polymarket/market-data?conditionId=...&tokenId=...
 */

import { API_BASE_URL } from './config';
import type { GammaMarket, MarketClobData } from '@/types/polymarket';

async function proxyFetch<T>(path: string, adminKey: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Proxy error ${res.status}`);
  }
  return res.json();
}

/**
 * Search Polymarket markets by team / keyword.
 * Backend calls Gamma API: https://gamma-api.polymarket.com/markets?tag_slug=...
 */
export async function searchPolymarketMarkets(
  query: string,
  adminKey: string
): Promise<GammaMarket[]> {
  const data = await proxyFetch<{ ok: boolean; markets: GammaMarket[] }>(
    `/admin/polymarket/search?q=${encodeURIComponent(query)}`,
    adminKey
  );
  return data.markets ?? [];
}

/**
 * Fetch live CLOB data (prices, spread, depth, historical) for a single market.
 * Backend calls CLOB API: https://clob.polymarket.com/markets/{conditionId}
 */
export async function fetchMarketClobData(
  conditionId: string,
  tokenId: string,
  adminKey: string
): Promise<MarketClobData> {
  return proxyFetch<MarketClobData>(
    `/admin/polymarket/market-data?conditionId=${conditionId}&tokenId=${encodeURIComponent(tokenId)}`,
    adminKey
  );
}

/**
 * Batch-fetch CLOB data for multiple markets.
 * Returns a map: conditionId → MarketClobData
 */
export async function fetchBatchClobData(
  markets: Array<{ conditionId: string; tokenId: string }>,
  adminKey: string
): Promise<Map<string, MarketClobData>> {
  const results = await Promise.allSettled(
    markets.map(m => fetchMarketClobData(m.conditionId, m.tokenId, adminKey))
  );

  const map = new Map<string, MarketClobData>();
  results.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      map.set(markets[i].conditionId, result.value);
    }
  });
  return map;
}

/**
 * Fetch current vault positions for a pool (from our backend).
 */
export async function fetchVaultPositions(poolId: string): Promise<unknown[]> {
  const res = await fetch(`${API_BASE_URL}/pools/${poolId}/positions`, {
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`Failed to fetch positions: ${res.status}`);
  const data = await res.json();
  return data.positions ?? [];
}
