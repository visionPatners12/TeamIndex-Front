import { useCallback, useState } from 'react';
import { useWallets } from '@privy-io/react-auth';
import type { LiFiStep, Process, RouteExtended } from '@lifi/sdk';
import {
  executeIndexDepositQuote,
  getIndexDepositContractCallQuote,
  getLifiRouteTxInfo,
  type IndexDepositQuoteParams,
} from '@/lib/lifi';

export type LifiDepositStatus =
  | 'idle'
  | 'quoting'
  | 'approving'
  | 'sending'
  | 'bridging'
  | 'confirming'
  | 'success'
  | 'error';

function statusFromProcess(process?: Process): LifiDepositStatus {
  if (!process) return 'sending';

  if (process.status === 'FAILED' || process.status === 'CANCELLED') return 'error';
  if (process.type === 'TOKEN_ALLOWANCE') return 'approving';
  if (process.type === 'CROSS_CHAIN') return 'bridging';
  if (process.type === 'RECEIVING_CHAIN') return 'confirming';
  return 'sending';
}

function statusFromRoute(route: RouteExtended): LifiDepositStatus {
  const processes = route.steps.flatMap((step) => step.execution?.process ?? []);
  const activeProcess =
    [...processes].reverse().find((process) => process.status !== 'DONE') ??
    processes[processes.length - 1];

  return statusFromProcess(activeProcess);
}

export function useLifiIndexDeposit() {
  const { wallets } = useWallets();
  const [status, setStatus] = useState<LifiDepositStatus>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txLink, setTxLink] = useState<string | null>(null);
  const [route, setRoute] = useState<RouteExtended | null>(null);
  const [error, setError] = useState<string | null>(null);

  const quoteDeposit = useCallback(async (params: IndexDepositQuoteParams) => {
    setStatus('quoting');
    setError(null);
    setRoute(null);
    setTxHash(null);
    setTxLink(null);

    try {
      const quote = await getIndexDepositContractCallQuote(params);
      setStatus('idle');
      return quote;
    } catch (err: any) {
      setStatus('error');
      setError(err?.message || 'LI.FI quote failed');
      throw err;
    }
  }, []);

  const executeQuote = useCallback(
    async (quote: LiFiStep) => {
      const wallet = wallets[0];
      if (!wallet) throw new Error('No wallet connected');

      setStatus('sending');
      setError(null);
      setRoute(null);

      try {
        const executedRoute = await executeIndexDepositQuote(wallet, quote, (updatedRoute) => {
          setRoute(updatedRoute);
          setStatus(statusFromRoute(updatedRoute));

          const info = getLifiRouteTxInfo(updatedRoute);
          setTxHash(info.txHash);
          setTxLink(info.txLink);
        });

        const info = getLifiRouteTxInfo(executedRoute);
        setRoute(executedRoute);
        setTxHash(info.txHash);
        setTxLink(info.txLink);
        setStatus('success');

        return { route: executedRoute, txHash: info.txHash, txLink: info.txLink };
      } catch (err: any) {
        setStatus('error');
        setError(err?.message || 'LI.FI transaction failed');
        throw err;
      }
    },
    [wallets]
  );

  const reset = useCallback(() => {
    setStatus('idle');
    setTxHash(null);
    setTxLink(null);
    setRoute(null);
    setError(null);
  }, []);

  return {
    quoteDeposit,
    executeQuote,
    status,
    txHash,
    txLink,
    route,
    error,
    reset,
  };
}
