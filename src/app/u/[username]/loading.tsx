export default function PublicProfileLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 py-10" aria-hidden="true">
      <div className="flex items-center gap-5">
        <div className="size-24 shrink-0 animate-pulse rounded-full bg-surface-2" />
        <div className="flex-1 space-y-3">
          <div className="h-8 w-52 max-w-full animate-pulse rounded bg-surface-2" />
          <div className="h-4 w-32 animate-pulse rounded bg-surface-2" />
        </div>
      </div>
      <div className="h-11 animate-pulse rounded-card bg-surface-2" />
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="h-56 animate-pulse rounded-card bg-surface-2 lg:col-span-2" />
        <div className="h-56 animate-pulse rounded-card bg-surface-2" />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="aspect-[2/3] animate-pulse rounded-card bg-surface-2" />
        ))}
      </div>
    </div>
  );
}
