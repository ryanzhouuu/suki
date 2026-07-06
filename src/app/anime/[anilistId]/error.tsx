"use client";

import Link from "next/link";

/**
 * Route error boundary for the anime detail page. A genuine "not found" is
 * rendered by `notFound()` (Next's not-found boundary) and never reaches here;
 * this handles transient failures (rate limit / network / DB), offering a
 * retry that re-renders the segment without a full reload.
 */
export default function AnimeDetailError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[60svh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="font-display text-2xl font-semibold text-ink">
        Couldn&apos;t load this anime
      </h1>
      <p className="text-sm text-muted">
        Something went wrong reaching the catalog. This is usually temporary —
        give it another try.
      </p>
      <div className="mt-2 flex items-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-full border border-line-strong px-4 py-2 text-sm font-medium text-muted transition-colors hover:border-accent hover:text-accent"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
