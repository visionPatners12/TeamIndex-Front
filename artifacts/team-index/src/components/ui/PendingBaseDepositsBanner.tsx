import React from "react";
import { Loader2, ExternalLink, AlertTriangle } from "lucide-react";
import { useUserPendingBaseDeposits, type PendingBaseDepositStatus } from "@/hooks/use-user-holdings";
import { BASE_CHAIN } from "@/lib/config";
import { cn } from "@/lib/utils";

interface Props {
  address: string | undefined | null;
  className?: string;
}

const STATUS_LABEL: Record<PendingBaseDepositStatus, string> = {
  RECEIVED: "Received on Base — bridging to Polygon…",
  BRIDGING: "Bridging USDC to Polygon…",
  DEPOSITING: "Depositing into the Polygon vault…",
  MINTING_SHARES: "Minting wrapped shares on Base…",
};

const STATUS_PROGRESS: Record<PendingBaseDepositStatus, number> = {
  RECEIVED: 25,
  BRIDGING: 50,
  DEPOSITING: 75,
  MINTING_SHARES: 90,
};

function humanizeUsdc(raw: string | null): string {
  if (!raw) return "—";
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return "—";
  return `${(n / 1_000_000).toFixed(2)} USDC`;
}

/** Shows the user a per-deposit progress strip while their Base→Polygon
 *  bridge is in flight. Disappears once everything is COMPLETED. */
export function PendingBaseDepositsBanner({ address, className }: Props) {
  const { data } = useUserPendingBaseDeposits(address);
  const deposits = data?.deposits ?? [];
  if (deposits.length === 0) return null;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-300/80">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        {deposits.length} Base deposit{deposits.length > 1 ? "s" : ""} in flight
      </div>

      {deposits.map((d) => {
        const status = (d.status as PendingBaseDepositStatus) ?? "RECEIVED";
        const label = STATUS_LABEL[status] ?? status;
        const progress = STATUS_PROGRESS[status] ?? 10;
        const hasError = !!d.lastError;

        return (
          <div
            key={d.id}
            className={cn(
              "rounded-xl border px-4 py-3 flex flex-col gap-2",
              hasError
                ? "bg-amber-500/10 border-amber-500/30"
                : "bg-blue-500/8 border-blue-500/25"
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white truncate">
                  {d.clubName ?? "Unknown pool"}{" "}
                  {d.symbol && <span className="text-blue-300/80 text-xs">· ${d.symbol}</span>}
                </p>
                <p className="text-xs text-white/70 mt-0.5">
                  {humanizeUsdc(d.sourceAmount)} → {label}
                </p>
              </div>
              {d.baseTxHash && (
                <a
                  href={`${BASE_CHAIN.blockExplorer}/tx/${d.baseTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-blue-300/80 hover:text-blue-200 text-[11px] flex items-center gap-1"
                >
                  Base tx <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  hasError ? "bg-amber-500/80" : "bg-blue-500/80"
                )}
                style={{ width: `${progress}%` }}
              />
            </div>

            {hasError && (
              <p className="text-[11px] text-amber-200/90 flex items-start gap-1.5">
                <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                <span className="line-clamp-2">{d.lastError}</span>
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
