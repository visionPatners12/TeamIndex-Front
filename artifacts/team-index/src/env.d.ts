/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PRIVY_APP_ID: string;
  readonly VITE_API_BASE_URL: string;
  readonly VITE_USDC_ADDRESS: string;
  readonly VITE_CHILIZ_DEPOSIT_RECEIVER_ADDRESS: string;
  readonly VITE_CHILIZ_WRAPPED_SHARE_ADDRESS: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
