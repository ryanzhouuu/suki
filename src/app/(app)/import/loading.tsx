export default function ImportLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-8" aria-hidden="true">
      <div className="space-y-3">
        <div className="h-4 w-28 animate-pulse rounded bg-surface-2" />
        <div className="h-10 w-32 animate-pulse rounded bg-surface-2" />
        <div className="h-4 w-80 max-w-full animate-pulse rounded bg-surface-2" />
      </div>
      <div className="space-y-5 rounded-card border border-line-strong p-6">
        <div className="h-7 w-56 animate-pulse rounded bg-surface-2" />
        <div className="h-36 animate-pulse rounded-xl bg-surface-2" />
        <div className="h-11 w-40 animate-pulse rounded-xl bg-surface-2" />
      </div>
    </div>
  );
}
