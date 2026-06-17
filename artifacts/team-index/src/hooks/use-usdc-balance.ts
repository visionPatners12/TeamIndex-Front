import { useQuery } from "@tanstack/react-query";
import { formatUnits } from "viem";
import { BASE_CHAIN, BASE_USDC_ADDRESS } from "@/lib/config";

const ERC20_BALANCE_OF_SIG = "0x70a08231";

function encodeBalanceOf(address: string): string {
  return ERC20_BALANCE_OF_SIG + address.slice(2).toLowerCase().padStart(64, "0");
}

async function fetchUsdcBalance(walletAddress: string): Promise<{
  raw: bigint;
  formatted: number;
}> {
  const res = await fetch(BASE_CHAIN.rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "eth_call",
      params: [
        { to: BASE_USDC_ADDRESS, data: encodeBalanceOf(walletAddress) },
        "latest",
      ],
    }),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error.message ?? "RPC error");
  const raw = BigInt(json.result ?? "0x0");
  const formatted = Number(formatUnits(raw, 6));
  return { raw, formatted };
}

export function useUsdcBalance(walletAddress: string | null | undefined) {
  return useQuery({
    queryKey: ["usdc-balance", walletAddress],
    queryFn: () => fetchUsdcBalance(walletAddress!),
    enabled: !!walletAddress,
    refetchInterval: 15_000,
    staleTime: 10_000,
  });
}
