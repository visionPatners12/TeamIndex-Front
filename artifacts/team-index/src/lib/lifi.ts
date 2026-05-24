import type {
  ContractCall,
  ContractCallsQuoteRequest,
  ExtendedChain,
  LiFiStep,
  QuoteRequest,
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
const INDEX_DEPOSIT_USDC_AMOUNT_KEY = '__teamIndexDepositUsdcAmountRaw';

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
  fromAmountRaw: string;
}

export interface IndexDepositExecutionParams {
  vaultAddress: string;
  receiverAddress: string;
}

export interface LifiRouteTxInfo {
  txHash: string | null;
  txLink: string | null;
}

type ContractCallContext = {
  toAmount: bigint;
  toChainId: number;
  toTokenAddress: string;
};

type IndexDepositLiFiStep = LiFiStep & {
  [INDEX_DEPOSIT_USDC_AMOUNT_KEY]?: string;
};

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

function assertLifiApiKey() {
  if (!LIFI_API_KEY?.trim()) {
    throw new Error('Missing VITE_LIFI_API_KEY. Add a LI.FI API key to request routes.');
  }
}

export function parsePolygonUsdcAmount(amount: string): string {
  return parseUnits(amount || '0', 6).toString();
}

export function parseTokenAmount(amount: string, decimals: number): string {
  return parseUnits(amount || '0', decimals).toString();
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

function buildIndexDepositContractCalls(
  vaultAddress: string,
  receiverAddress: string,
  usdcAmountRaw: string
): ContractCall[] {
  return [
    {
      fromAmount: usdcAmountRaw,
      fromTokenAddress: LIFI_DESTINATION_TOKEN_ADDRESS,
      toContractAddress: vaultAddress,
      toContractCallData: encodeIndexDepositCalldata(usdcAmountRaw, receiverAddress),
      toContractGasLimit: DEFAULT_CONTRACT_GAS_LIMIT,
      toApprovalAddress: vaultAddress,
      toTokenAddress: LIFI_DESTINATION_TOKEN_ADDRESS,
    },
  ];
}

function isPolygonUsdcOutput(chainId?: number | null, tokenAddress?: string | null) {
  return (
    chainId === LIFI_DESTINATION_CHAIN_ID &&
    !!tokenAddress &&
    tokenAddress.toLowerCase() === LIFI_DESTINATION_TOKEN_ADDRESS.toLowerCase()
  );
}

function positiveAmount(amount?: string | null) {
  if (!amount) return null;
  try {
    return BigInt(amount) > 0n ? amount : null;
  } catch {
    return null;
  }
}

function getQuotePolygonUsdcAmount(quote: LiFiStep) {
  const storedAmount = positiveAmount(
    (quote as IndexDepositLiFiStep)[INDEX_DEPOSIT_USDC_AMOUNT_KEY]
  );
  if (storedAmount) return storedAmount;

  const directAmount = isPolygonUsdcOutput(
    quote.action?.toChainId,
    quote.action?.toToken?.address
  )
    ? positiveAmount(quote.estimate?.toAmount)
    : null;

  if (directAmount) return directAmount;

  const usdcStep = [...(quote.includedSteps ?? [])]
    .reverse()
    .find((step) =>
      isPolygonUsdcOutput(step.action?.toChainId, step.action?.toToken?.address)
    );

  return positiveAmount(usdcStep?.estimate?.toAmount) ?? positiveAmount(usdcStep?.estimate?.toAmountMin);
}

function withIndexDepositUsdcAmount(quote: LiFiStep, usdcAmountRaw: string): LiFiStep {
  return Object.assign(quote, {
    [INDEX_DEPOSIT_USDC_AMOUNT_KEY]: usdcAmountRaw,
  });
}

export function getIndexDepositUsdcAmountFromQuote(quote?: LiFiStep | null) {
  return quote ? getQuotePolygonUsdcAmount(quote) : null;
}

function getExecutionPolygonUsdcAmount(
  context: ContractCallContext,
  fallbackUsdcAmountRaw: string | null
) {
  if (isPolygonUsdcOutput(context.toChainId, context.toTokenAddress) && context.toAmount > 0n) {
    return context.toAmount.toString();
  }

  if (fallbackUsdcAmountRaw) {
    return fallbackUsdcAmountRaw;
  }

  throw new Error(
    `LI.FI could not prepare the Polygon USDC index deposit call. Expected Polygon USDC on chain ${LIFI_DESTINATION_CHAIN_ID}, received chain ${context.toChainId}, token ${context.toTokenAddress}, amount ${context.toAmount.toString()}. Refresh the quote and try again.`
  );
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
  fromAmountRaw,
}: IndexDepositQuoteParams): Promise<LiFiStep> {
  const sdk = await ensureLifiConfig();
  assertLifiApiKey();

  if (!vaultAddress) throw new Error('Vault contract is not configured for this index.');
  if (BigInt(fromAmountRaw) <= 0n) throw new Error('Enter a source token amount.');

  const baseQuoteRequest: QuoteRequest = {
    fromAddress,
    fromChain: fromChainId,
    fromToken: fromTokenAddress,
    fromAmount: fromAmountRaw,
    toChain: LIFI_DESTINATION_CHAIN_ID,
    toToken: LIFI_DESTINATION_TOKEN_ADDRESS,
    toAddress: receiverAddress,
    allowDestinationCall: true,
  };

  const baseQuote = await sdk.getQuote(baseQuoteRequest);
  const estimatedUsdcRaw = baseQuote.estimate?.toAmount;

  if (!estimatedUsdcRaw || BigInt(estimatedUsdcRaw) <= 0n) {
    throw new Error('LI.FI did not return a Polygon USDC output for this source amount.');
  }

  const request: ContractCallsQuoteRequest = {
    fromAddress,
    fromChain: fromChainId,
    fromToken: fromTokenAddress,
    fromAmount: fromAmountRaw,
    toChain: LIFI_DESTINATION_CHAIN_ID,
    toToken: LIFI_DESTINATION_TOKEN_ADDRESS,
    toFallbackAddress: receiverAddress,
    allowDestinationCall: true,
    contractCalls: buildIndexDepositContractCalls(
      vaultAddress,
      receiverAddress,
      estimatedUsdcRaw
    ),
  };

  const quote = await sdk.getContractCallsQuote(request);

  const hasDestinationCall = quote.includedSteps?.some((step) => step.type === 'custom');
  if (!hasDestinationCall) {
    throw new Error('LI.FI route did not include the required index contract call.');
  }

  return withIndexDepositUsdcAmount(quote, estimatedUsdcRaw);
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
  params: IndexDepositExecutionParams,
  updateRouteHook?: UpdateRouteHook
) {
  const sdk = await ensureLifiConfig();
  assertLifiApiKey();
  await configureLifiWalletProvider(wallet);

  const fallbackUsdcAmountRaw = getIndexDepositUsdcAmountFromQuote(quote);
  const route = sdk.convertQuoteToRoute(quote, { adjustZeroOutputFromPreviousStep: true });
  return sdk.executeRoute(route, {
    updateRouteHook,
    adjustZeroOutputFromPreviousStep: true,
    acceptExchangeRateUpdateHook: async () => true,
    getContractCalls: async ({ toAmount, toChainId, toTokenAddress }) => {
      const amount = getExecutionPolygonUsdcAmount(
        { toAmount, toChainId, toTokenAddress },
        fallbackUsdcAmountRaw
      );

      return {
        contractCalls: buildIndexDepositContractCalls(
          params.vaultAddress,
          params.receiverAddress,
          amount
        ),
      };
    },
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
