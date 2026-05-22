import { createRoot } from "react-dom/client";
import { PrivyProvider } from '@privy-io/react-auth';
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <PrivyProvider
    appId={import.meta.env.VITE_PRIVY_APP_ID}
    config={{
      appearance: {
        theme: 'dark',
        accentColor: '#06B6D4',
      },
      loginMethods: ['email', 'wallet', 'google'],
      embeddedWallets: {
        ethereum: { createOnLogin: 'users-without-wallets' },
      },
    }}
  >
    <App />
  </PrivyProvider>
);
