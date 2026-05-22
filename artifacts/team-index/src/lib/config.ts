const DEFAULT_API_BASE_URL = "https://teamindex-production.up.railway.app";

const rawApiBaseUrl =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? DEFAULT_API_BASE_URL;

export const API_BASE_URL = rawApiBaseUrl.replace(/\/+$/, "");

export const POLYGON_CHAIN_ID = 137;
export const CHILIZ_CHAIN_ID = 88888;

export const POLYGON_CHAIN = {
  id: POLYGON_CHAIN_ID,
  name: "Polygon",
  blockExplorer: "https://polygonscan.com",
} as const;

export const CHILIZ_CHAIN = {
  id: CHILIZ_CHAIN_ID,
  name: "Chiliz",
  blockExplorer: "https://chiliscan.com",
} as const;
