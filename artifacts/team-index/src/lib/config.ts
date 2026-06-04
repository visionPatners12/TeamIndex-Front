export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

export const BASE_CHAIN_ID = 8453;

export const BASE_USDC_ADDRESS = import.meta.env.VITE_BASE_USDC_ADDRESS || "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
export const BASE_DEPOSIT_RECEIVER_ADDRESS = import.meta.env.VITE_BASE_DEPOSIT_RECEIVER_ADDRESS || "0x0bf74F50f9095AdD1091FE69574c3C630531dA6f";

export const BASE_CHAIN = {
  id: BASE_CHAIN_ID,
  name: "Base",
  rpcUrl: "https://mainnet.base.org",
  blockExplorer: "https://basescan.org",
};
