export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

export const POLYGON_CHAIN_ID = 137;
export const BASE_CHAIN_ID = 8453;

export const POLYGON_USDC_ADDRESS = import.meta.env.VITE_USDC_ADDRESS || "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359";
export const BASE_USDC_ADDRESS = import.meta.env.VITE_BASE_USDC_ADDRESS || "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
export const BASE_DEPOSIT_RECEIVER_ADDRESS = import.meta.env.VITE_BASE_DEPOSIT_RECEIVER_ADDRESS || "0x0bf74F50f9095AdD1091FE69574c3C630531dA6f";

export const POLYGON_CHAIN = {
  id: POLYGON_CHAIN_ID,
  name: "Polygon",
  rpcUrl: "https://polygon-rpc.com",
  blockExplorer: "https://polygonscan.com",
};

export const BASE_CHAIN = {
  id: BASE_CHAIN_ID,
  name: "Base",
  rpcUrl: "https://mainnet.base.org",
  blockExplorer: "https://basescan.org",
};
