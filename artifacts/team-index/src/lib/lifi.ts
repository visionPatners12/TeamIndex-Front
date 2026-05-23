import type {
  ContractCallsQuoteRequest,
  ExtendedChain,
  LiFiStep,
  RouteExtended,
  TokenExtended,
  UpdateRouteHook,
} from '@lifi/sdk';
import {
  createWalletClient,
  custom,
  encodeFunctionData,
  parseUnits,
  type Address,
} from 'viem';
import { POLYGON_CHAIN_ID, POLYGON_USDC_ADDRESS } from '@/lib/config';

export const LIFI_DESTINATION_CHAIN_ID = POLYGON_CHAIN_ID;
export const LIFI_DESTINATION_TOKEN_ADDRESS = POLYGON_USDC_ADDRESS;

const LIFI_INTEGRATOR =
  (import.meta.env.VITE_LIFI_INTEGRATOR as string | undefined) || 'team-index';
const LIFI_API_KEY = import.meta.env.VITE_LIFI_API_KEY as string | undefined;
const LIFI_SLIPPAGE = Number(import.meta.env.VITE_LIFI_SLIPPAGE ?? 0.005);
const DEFAULT_CONTRACT_GAS_LIMIT =
  (import.meta.env.VITE_LIFI_INDEX_DEPOSIT_GAS_LIMIT as string | undefined) || '350000';

const ERC4626_DEPOSIT_ABI = [
  {
    type: 'function',
    name: 'deposit',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'assets', type: 'uint256' },
      { name: 'receiver', type: 'address' },
    ],
    outputs: [{ name: 'shares', type: 'uint256' }],
  },
] as const;

type PrivyEvmWallet = {
  address: string;
  getEthereumProvider: () => Promise<any>;
};

export interface IndexDepositQuoteParams {
  fromChainId: number;
  fromTokenAddress: string;
  fromAddress: string;
  vaultAddress: string;
  receiverAddress: string;
  usdcAmountRaw: string;
}

export interface LifiRouteTxInfo {
  txHash: string | null;
  txLink: string | null;
}

let lifiConfigCreated = false;
let lifiSdkPromise: Promise<typeof import('@lifi/sdk')> | null = null;

async function loadLifiSdk() {
  lifiSdkPromise ??= import('@lifi/sdk');
  return lifiSdkPromise;
}

export async function ensureLifiConfig() {
  const sdk = await loadLifiSdk();
  if (lifiConfigCreated) return sdk;

  sdk.createConfig({
    integrator: LIFI_INTEGRATOR,
    ...(LIFI_API_KEY ? { apiKey: LIFI_API_KEY } : {}),
    disableVersionCheck: true,
    routeOptions: {
      slippage: Number.isFinite(LIFI_SLIPPAGE) ? LIFI_SLIPPAGE : 0.005,
      allowDestinationCall: true,
    },
  });

  lifiConfigCreated = true;
  return sdk;
}

export function parsePolygonUsdcAmount(amount: string): string {
  return parseUnits(amount || '0', 6).toString();
}

export function isPolygonUsdcSource(chainId?: number | null, tokenAddress?: string | null) {
  return (
    chainId === POLYGON_CHAIN_ID &&
    !!tokenAddress &&
    tokenAddress.toLowerCase() === POLYGON_USDC_ADDRESS.toLowerCase()
  );
}

export function encodeIndexDepositCalldata(usdcAmountRaw: string, receiverAddress: string) {
  return encodeFunctionData({
    abi: ERC4626_DEPOSIT_ABI,
    functionName: 'deposit',
    args: [BigInt(usdcAmountRaw), receiverAddress as Address],
  });
}

export async function getLifiEvmChains(): Promise<ExtendedChain[]> {
  const sdk = await ensureLifiConfig();
  return sdk.getChains({ chainTypes: [sdk.ChainType.EVM] });
}

export async function getLifiTokensForChain(
  chainId: number,
  search?: string
): Promise<TokenExtended[]> {
  const sdk = await ensureLifiConfig();

  const cleanSearch = search?.trim();
  const result = await sdk.getTokens({
    chains: [chainId],
    chainTypes: [sdk.ChainType.EVM],
    extended: true,
    orderBy: 'marketCapUSD',
    limit: cleanSearch ? 50 : 80,
    ...(cleanSearch ? { search: cleanSearch } : {}),
  });

  return result.tokens[chainId] ?? [];
}

export async function getIndexDepositContractCallQuote({
  fromChainId,
  fromTokenAddress,
  fromAddress,
  vaultAddress,
  receiverAddress,
  usdcAmountRaw,
}: IndexDepositQuoteParams): Promise<LiFiStep> {
  const sdk = await ensureLifiConfig();

  if (!vaultAddress) throw new Error('Vault contract is not configured for this index.');
  if (BigInt(usdcAmountRaw) <= 0n) throw new Error('Enter a Polygon USDC target amount.');

  const depositCallData = encodeIndexDepositCalldata(usdcAmountRaw, receiverAddress);
  const request: ContractCallsQuoteRequest = {
    fromAddress,
    fromChain: fromChainId,
    fromToken: fromTokenAddress,
    toChain: LIFI_DESTINATION_CHAIN_ID,
    toToken: LIFI_DESTINATION_TOKEN_ADDRESS,
    toAmount: usdcAmountRaw,
    toFallbackAddress: receiverAddress,
    allowDestinationCall: true,
    contractCalls: [
      {
        fromAmount: usdcAmountRaw,
        fromTokenAddress: LIFI_DESTINATION_TOKEN_ADDRESS,
        toContractAddress: vaultAddress,
        toContractCallData: depositCallData,
        toContractGasLimit: DEFAULT_CONTRACT_GAS_LIMIT,
        toApprovalAddress: vaultAddress,
        toTokenAddress: LIFI_DESTINATION_TOKEN_ADDRESS,
      },
    ],
  };

  return sdk.getContractCallsQuote(request);
}

async function getWalletClientForChain(wallet: PrivyEvmWallet, chainId?: number) {
  const sdk = await ensureLifiConfig();

  const provider = await wallet.getEthereumProvider();
  const activeChainId = chainId ?? (await getProviderChainId(provider));
  const chain = await sdk.config.getChainById(activeChainId);

  return createWalletClient({
    account: wallet.address as Address,
    chain: sdk.convertExtendedChain(chain),
    transport: custom(provider),
  });
}

async function getProviderChainId(provider: any) {
  const chainId = await provider.request({ method: 'eth_chainId' });
  return Number(BigInt(chainId as string));
}

async function switchProviderChain(provider: any, chainId: number) {
  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${chainId.toString(16)}` }],
    });
  } catch (error: any) {
    if (error?.code !== 4902) throw error;

    const sdk = await ensureLifiConfig();
    const chain = await sdk.config.getChainById(chainId);
    await provider.request({
      method: 'wallet_addEthereumChain',
      params: [
        {
          ...chain.metamask,
          chainId: `0x${chainId.toString(16)}`,
        },
      ],
    });
  }
}

export async function configureLifiWalletProvider(wallet: PrivyEvmWallet) {
  const sdk = await ensureLifiConfig();

  const provider = await wallet.getEthereumProvider();

  sdk.config.setProviders([
    sdk.EVM({
      getWalletClient: () => getWalletClientForChain(wallet),
      switchChain: async (chainId) => {
        await switchProviderChain(provider, chainId);
        return getWalletClientForChain(wallet, chainId);
      },
    }),
  ]);
}

export async function executeIndexDepositQuote(
  wallet: PrivyEvmWallet,
  quote: LiFiStep,
  updateRouteHook?: UpdateRouteHook
) {
  const sdk = await ensureLifiConfig();
  await configureLifiWalletProvider(wallet);

  const route = sdk.convertQuoteToRoute(quote, { adjustZeroOutputFromPreviousStep: true });
  return sdk.executeRoute(route, {
    updateRouteHook,
    adjustZeroOutputFromPreviousStep: true,
    acceptExchangeRateUpdateHook: async () => true,
  });
}

export function getLifiRouteTxInfo(route?: RouteExtended | null): LifiRouteTxInfo {
  if (!route) return { txHash: null, txLink: null };

  const processes = route.steps.flatMap((step) => step.execution?.process ?? []);
  for (let i = processes.length - 1; i >= 0; i--) {
    const process = processes[i];
    if (process.txHash) {
      return {
        txHash: process.txHash,
        txLink: process.txLink ?? null,
      };
    }
  }

  return { txHash: null, txLink: null };
}
