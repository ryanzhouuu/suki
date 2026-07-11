import Link from "next/link";
import type { ReactNode } from "react";

import { WidePageFrame } from "@/components/layout/page-frame";
import { LIBRARY_SETUP_ENTRY_THRESHOLD } from "@/lib/setup/constants";

type LibrarySetupShellProps = {
  libraryCount: number;
  children: ReactNode;
};

export function LibrarySetupShell({
  libraryCount,
  children,
}: LibrarySetupShellProps) {
  const remaining = Math.max(0, LIBRARY_SETUP_ENTRY_THRESHOLD - libraryCount);
  const progress = Math.min(
    100,
    Math.round((libraryCount / LIBRARY_SETUP_ENTRY_THRESHOLD) * 100),
  );
  const isComplete = libraryCount >= LIBRARY_SETUP_ENTRY_THRESHOLD;

  return (
    <WidePageFrame className="max-w-3xl space-y-8">
      <div className="space-y-4">
        <div>
          <p className="eyebrow">Getting started</p>
          <h1 className="mt-1.5 text-3xl font-semibold sm:text-4xl">
            Build your library
          </h1>
          <p className="mt-2 text-sm text-muted">
            {isComplete
              ? "Your library is ready. Pick what to do next."
              : remaining === 1
                ? "Add one more anime to unlock the full app."
                : `Add at least ${remaining} more anime to unlock the full app.`}
          </p>
        </div>

        {!isComplete ? (
          <div className="space-y-2">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="font-medium text-ink">
                {libraryCount} of {LIBRARY_SETUP_ENTRY_THRESHOLD} added
              </span>
              <span className="text-muted">{progress}%</span>
            </div>
            <div
              className="h-2 overflow-hidden rounded-full bg-surface-2"
              role="progressbar"
              aria-valuenow={libraryCount}
              aria-valuemin={0}
              aria-valuemax={LIBRARY_SETUP_ENTRY_THRESHOLD}
              aria-label="Library setup progress"
            >
              <div
                className="h-full rounded-full bg-accent transition-[width]"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : null}
      </div>

      <div className="rounded-card border border-line-strong bg-surface p-6 shadow-[0_12px_40px_-28px_rgb(var(--shadow-color)/0.35)] sm:p-8">
        {children}
      </div>

      {!isComplete ? (
        <p className="text-center text-sm text-muted">
          Already have enough elsewhere?{" "}
          <Link
            href="/home"
            className="font-medium text-muted transition-colors hover:text-accent"
          >
            Skip for now
          </Link>
        </p>
      ) : null}
    </WidePageFrame>
  );
}
