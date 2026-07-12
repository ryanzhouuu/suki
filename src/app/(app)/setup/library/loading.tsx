export default function LibrarySetupLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-8" aria-hidden="true">
      <div className="space-y-4">
        <div className="h-4 w-28 animate-pulse rounded bg-surface-2" />
        <div className="h-10 w-64 animate-pulse rounded bg-surface-2" />
        <div className="h-4 w-80 max-w-full animate-pulse rounded bg-surface-2" />
        <div className="h-2 animate-pulse rounded-full bg-surface-2" />
      </div>
      <div className="space-y-5 rounded-card border border-line-strong bg-surface p-6 sm:p-8">
        <div className="h-7 w-52 animate-pulse rounded bg-surface-2" />
        <div className="h-32 animate-pulse rounded-xl bg-surface-2" />
        <div className="h-11 w-44 animate-pulse rounded-xl bg-surface-2" />
      </div>
    </div>
  );
}
