import { createPublicClient, createWalletClient, getAddress, http, parseAbi } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";

const ownableAbi = parseAbi([
  "function owner() view returns (address)",
  "function transferOwnership(address newOwner)",
]);

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function normalizePrivateKey(value: string): `0x${string}` {
  const key = value.trim();
  const prefixed = key.startsWith("0x") ? key : `0x${key}`;
  if (!/^0x[0-9a-fA-F]{64}$/.test(prefixed)) {
    throw new Error("OWNER_PRIVATE_KEY must be a 32-byte hex private key.");
  }
  return prefixed as `0x${string}`;
}

async function main() {
  const factoryAddress = getAddress(requiredEnv("FACTORY_ADDRESS")) as `0x${string}`;
  const newOwner = getAddress(requiredEnv("NEW_OWNER")) as `0x${string}`;
  const rpcUrl = process.env.RPC_URL?.trim() || "https://mainnet.base.org";
  const account = privateKeyToAccount(normalizePrivateKey(requiredEnv("OWNER_PRIVATE_KEY")));

  const publicClient = createPublicClient({
    chain: base,
    transport: http(rpcUrl),
  });

  const walletClient = createWalletClient({
    account,
    chain: base,
    transport: http(rpcUrl),
  });

  const currentOwner = await publicClient.readContract({
    address: factoryAddress,
    abi: ownableAbi,
    functionName: "owner",
  });

  console.log(`Factory:      ${factoryAddress}`);
  console.log(`Current owner:${currentOwner}`);
  console.log(`Signer:       ${account.address}`);
  console.log(`New owner:    ${newOwner}`);

  if (currentOwner.toLowerCase() !== account.address.toLowerCase()) {
    throw new Error("Signer is not the current owner. Use the current owner private key.");
  }

  if (currentOwner.toLowerCase() === newOwner.toLowerCase()) {
    console.log("No-op: NEW_OWNER is already the owner.");
    return;
  }

  const { request } = await publicClient.simulateContract({
    account,
    address: factoryAddress,
    abi: ownableAbi,
    functionName: "transferOwnership",
    args: [newOwner],
  });

  const hash = await walletClient.writeContract(request);
  console.log(`Tx sent:      ${hash}`);
  console.log(`BaseScan:     https://basescan.org/tx/${hash}`);

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log(`Status:       ${receipt.status}`);

  const updatedOwner = await publicClient.readContract({
    address: factoryAddress,
    abi: ownableAbi,
    functionName: "owner",
  });
  console.log(`Owner after:  ${updatedOwner}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
