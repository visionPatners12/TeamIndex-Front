export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

export const POLYGON_CHAIN_ID = 137;
export const CHILIZ_CHAIN_ID = 88882;       // Chiliz Spicy Testnet
export const CHILIZ_TESTNET_CHAIN_ID = 88882;

export const POLYGON_USDC_ADDRESS = import.meta.env.VITE_USDC_ADDRESS || "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359";
export const CHILIZ_DEPOSIT_RECEIVER_ADDRESS = import.meta.env.VITE_CHILIZ_DEPOSIT_RECEIVER_ADDRESS || "";
export const CHILIZ_WRAPPED_SHARE_ADDRESS = import.meta.env.VITE_CHILIZ_WRAPPED_SHARE_ADDRESS || "";

export const POLYGON_CHAIN = {
  id: POLYGON_CHAIN_ID,
  name: "Polygon",
  rpcUrl: "https://polygon-rpc.com",
  blockExplorer: "https://polygonscan.com",
};

export const CHILIZ_CHAIN = {
  id: CHILIZ_CHAIN_ID,
  name: "Chiliz Spicy Testnet",
  rpcUrl: "https://spicy-rpc.chiliz.com",
  blockExplorer: "https://testnet.chiliscan.com",
};
