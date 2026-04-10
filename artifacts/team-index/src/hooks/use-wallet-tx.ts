import { useCallback, useState } from "react";
import { useWallets } from "@privy-io/react-auth";
import { POLYGON_CHAIN_ID, POLYGON_USDC_ADDRESS, CHILIZ_CHAIN_ID, CHILIZ_CHAIN, POLYGON_CHAIN } from "@/lib/config";

export type TxStatus = "idle" | "switching" | "approving" | "sending" | "confirming" | "success" | "error";

const CHAIN_METADATA: Record<number, { chainName: string; rpcUrls: string[]; nativeCurrency: { name: string; symbol: string; decimals: number }; blockExplorerUrls: string[] }> = {
  [POLYGON_CHAIN_ID]: {
    chainName: POLYGON_CHAIN.name,
    rpcUrls: [POLYGON_CHAIN.rpcUrl],
    nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
    blockExplorerUrls: [POLYGON_CHAIN.blockExplorer],
  },
  [CHILIZ_CHAIN_ID]: {
    chainName: CHILIZ_CHAIN.name,
    rpcUrls: [CHILIZ_CHAIN.rpcUrl],
    nativeCurrency: { name: "CHZ", symbol: "CHZ", decimals: 18 },
    blockExplorerUrls: [CHILIZ_CHAIN.blockExplorer],
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

async function sendRawTx(provider: any, from: string, tx: { to: string; data: string; value?: string }) {
  const txHash = await provider.request({
    method: "eth_sendTransaction",
    params: [{
      from,
      to: tx.to,
      data: tx.data,
      ...(tx.value ? { value: tx.value } : {}),
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

export function usePolygonDeposit() {
  const { wallets } = useWallets();
  const [status, setStatus] = useState<TxStatus>("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const deposit = useCallback(async (
    vaultAddress: string,
    usdcAmount: bigint,
    depositTxData: { to: string; data: string }
  ) => {
    setStatus("idle");
    setTxHash(null);
    setError(null);

    const wallet = wallets[0];
    if (!wallet) throw new Error("No wallet connected");

    try {
      const provider = await getProvider(wallet);

      setStatus("switching");
      await switchChain(provider, POLYGON_CHAIN_ID);

      setStatus("approving");
      const approveData = encodeApprove(vaultAddress, usdcAmount);
      const approveTxHash = await sendRawTx(provider, wallet.address, {
        to: POLYGON_USDC_ADDRESS,
        data: approveData,
      });
      await waitForReceipt(provider, approveTxHash);

      setStatus("sending");
      const hash = await sendRawTx(provider, wallet.address, depositTxData);
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
  }, [wallets]);

  return { deposit, status, txHash, error, reset: () => { setStatus("idle"); setTxHash(null); setError(null); } };
}

export function useChilizDeposit() {
  const { wallets } = useWallets();
  const [status, setStatus] = useState<TxStatus>("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const depositCHZ = useCallback(async (
    receiverAddress: string,
    poolIdHash: string,
    txData: { to: string; data: string },
    chzAmountWei: string
  ) => {
    setStatus("idle");
    setTxHash(null);
    setError(null);

    const wallet = wallets[0];
    if (!wallet) throw new Error("No wallet connected");

    try {
      const provider = await getProvider(wallet);

      setStatus("switching");
      await switchChain(provider, CHILIZ_CHAIN_ID);

      setStatus("sending");
      const hash = await sendRawTx(provider, wallet.address, {
        to: txData.to,
        data: txData.data,
        value: `0x${BigInt(chzAmountWei).toString(16)}`,
      });
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
  }, [wallets]);

  const depositToken = useCallback(async (
    approveTx: { to: string; data: string },
    depositTx: { to: string; data: string }
  ) => {
    setStatus("idle");
    setTxHash(null);
    setError(null);

    const wallet = wallets[0];
    if (!wallet) throw new Error("No wallet connected");

    try {
      const provider = await getProvider(wallet);

      setStatus("switching");
      await switchChain(provider, CHILIZ_CHAIN_ID);

      setStatus("approving");
      const appHash = await sendRawTx(provider, wallet.address, approveTx);
      await waitForReceipt(provider, appHash);

      setStatus("sending");
      const hash = await sendRawTx(provider, wallet.address, depositTx);
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
  }, [wallets]);

  return { depositCHZ, depositToken, status, txHash, error, reset: () => { setStatus("idle"); setTxHash(null); setError(null); } };
}

function encodeApprove(spender: string, amount: bigint): string {
  const fnSelector = "0x095ea7b3";
  const paddedSpender = spender.slice(2).toLowerCase().padStart(64, "0");
  const paddedAmount = amount.toString(16).padStart(64, "0");
  return `${fnSelector}${paddedSpender}${paddedAmount}`;
}
