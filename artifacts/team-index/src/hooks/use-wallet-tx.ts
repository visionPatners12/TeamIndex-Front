import { useCallback, useState } from "react";
import { useWallets } from "@privy-io/react-auth";
import {
  BASE_CHAIN,
  BASE_CHAIN_ID,
  BASE_USDC_ADDRESS,
} from "@/lib/config";
import { getWalletForAddress } from "@/utils/wallet";

export type TxStatus = "idle" | "switching" | "approving" | "sending" | "confirming" | "success" | "error";

type WalletTx = { to: string; data: string; value?: string; gas?: string; gasLimit?: string };

const CHAIN_METADATA: Record<number, { chainName: string; rpcUrls: string[]; nativeCurrency: { name: string; symbol: string; decimals: number }; blockExplorerUrls: string[] }> = {
  [BASE_CHAIN_ID]: {
    chainName: BASE_CHAIN.name,
    rpcUrls: [BASE_CHAIN.rpcUrl],
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    blockExplorerUrls: [BASE_CHAIN.blockExplorer],
  },
};

function getProvider(wallet: any) {
  return wallet.getEthereumProvider();
}

async function switchChain(provider: any, chainId: number) {
  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: `0x${chainId.toString(16)}` }],
    });
  } catch (err: any) {
    if (err.code === 4902) {
      const meta = CHAIN_METADATA[chainId];
      if (!meta) throw new Error(`Please add chain ${chainId} to your wallet first.`);
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [{ chainId: `0x${chainId.toString(16)}`, ...meta }],
      });
    } else {
      throw err;
    }
  }
}

async function sendRawTx(provider: any, from: string, tx: WalletTx) {
  const txHash = await provider.request({
    method: "eth_sendTransaction",
    params: [{
      from,
      to: tx.to,
      data: tx.data,
      ...(tx.value ? { value: tx.value } : {}),
      ...(tx.gas || tx.gasLimit ? { gas: tx.gas ?? tx.gasLimit } : {}),
    }],
  });
  return txHash as string;
}

async function waitForReceipt(provider: any, txHash: string, maxAttempts = 60): Promise<any> {
  for (let i = 0; i < maxAttempts; i++) {
    const receipt = await provider.request({
      method: "eth_getTransactionReceipt",
      params: [txHash],
    });
    if (receipt) return receipt;
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error("Transaction confirmation timeout");
}

export function useBaseUsdcDeposit() {
  const { ready, wallets } = useWallets();
  const [status, setStatus] = useState<TxStatus>("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const deposit = useCallback(async (
    approveTx: WalletTx,
    depositTx: WalletTx,
    senderAddress?: string,
    expectedDepositTo?: string
  ) => {
    setStatus("idle");
    setTxHash(null);
    setError(null);

    if (!ready) throw new Error("Wallets are still loading. Please try again in a moment.");

    const wallet = getWalletForAddress(wallets, senderAddress) as any;
    if (!wallet) throw new Error("No wallet connected");

    if (approveTx.to.toLowerCase() !== BASE_USDC_ADDRESS.toLowerCase()) {
      throw new Error("Backend returned an approval transaction for the wrong Base USDC contract.");
    }

    if (expectedDepositTo && depositTx.to.toLowerCase() !== expectedDepositTo.toLowerCase()) {
      throw new Error("Backend returned a deposit transaction for the wrong Base destination contract.");
    }

    try {
      const provider = await getProvider(wallet);
      const fromAddress = senderAddress || wallet.address;

      setStatus("switching");
      await switchChain(provider, BASE_CHAIN_ID);

      setStatus("approving");
      const approveTxHash = await sendRawTx(provider, fromAddress, approveTx);
      await waitForReceipt(provider, approveTxHash);

      setStatus("sending");
      const hash = await sendRawTx(provider, fromAddress, depositTx);
      setTxHash(hash);

      setStatus("confirming");
      await waitForReceipt(provider, hash);

      setStatus("success");
      return hash;
    } catch (err: any) {
      setStatus("error");
      setError(err.message || "Transaction failed");
      throw err;
    }
  }, [ready, wallets]);

  return { deposit, status, txHash, error, reset: () => { setStatus("idle"); setTxHash(null); setError(null); } };
}
