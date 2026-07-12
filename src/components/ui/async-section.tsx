import type { ReactNode } from "react";

import { ResilienceRetry } from "@/components/ui/resilience-retry";

type AsyncSectionStateProps = {
  action?: ReactNode;
  className?: string;
  description: string;
  title: string;
};

function stateClassName(className?: string) {
  return `rounded-card border border-dashed border-line-strong bg-surface/60 p-6 ${className ?? ""}`;
}

export function AsyncSectionEmpty({
  action,
  className,
  description,
  title,
}: AsyncSectionStateProps) {
  return (
    <div className={stateClassName(className)} role="status">
      <h3 className="text-lg font-semibold text-ink">{title}</h3>
      <p className="mt-1 text-sm text-muted">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

type AsyncSectionUnavailableProps = Omit<AsyncSectionStateProps, "action"> & {
  action?: ReactNode;
  referenceId?: string;
  retryable?: boolean;
  retryLabel?: string;
};

export function AsyncSectionUnavailable({
  action,
  className,
  description,
  referenceId,
  retryable = false,
  retryLabel,
  title,
}: AsyncSectionUnavailableProps) {
  return (
    <div className={stateClassName(className)} role="status">
      <h3 className="text-lg font-semibold text-ink">{title}</h3>
      <p className="mt-1 text-sm text-muted">{description}</p>
      {referenceId ? (
        <p className="mt-2 font-mono text-xs text-faint">
          Reference: {referenceId}
        </p>
      ) : null}
      {retryable || action ? (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {retryable ? <ResilienceRetry label={retryLabel} /> : null}
          {action}
        </div>
      ) : null}
    </div>
  );
}
