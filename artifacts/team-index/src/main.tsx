import { createRoot } from "react-dom/client";
import { PrivyProvider } from '@privy-io/react-auth';
import { base } from 'viem/chains';
import App from "./App";
import "./index.css";

const privyAppId = import.meta.env.VITE_PRIVY_APP_ID;
const privyClientId = import.meta.env.VITE_PRIVY_CLIENT_ID || undefined;

createRoot(document.getElementById("root")!).render(
  <PrivyProvider
    appId={privyAppId}
    clientId={privyClientId}
    config={{
      appearance: {
        theme: 'dark',
        accentColor: '#06B6D4',
      },
      defaultChain: base,
      supportedChains: [base],
      loginMethods: ['email', 'wallet', 'google'],
      embeddedWallets: {
        ethereum: { createOnLogin: 'users-without-wallets' },
      },
    }}
  >
    <App />
  </PrivyProvider>
);
