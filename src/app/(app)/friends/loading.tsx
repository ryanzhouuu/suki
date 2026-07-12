export default function FriendsLoading() {
  return (
    <div className="space-y-8" aria-hidden="true">
      <div className="space-y-3">
        <div className="h-4 w-16 animate-pulse rounded bg-surface-2" />
        <div className="h-10 w-36 animate-pulse rounded bg-surface-2" />
      </div>
      <div className="h-32 animate-pulse rounded-card bg-surface-2" />
      <div className="grid gap-8 lg:grid-cols-[19rem_minmax(0,1fr)]">
        <div className="h-72 animate-pulse rounded-card bg-surface-2" />
        <div className="space-y-6">
          <div className="h-56 animate-pulse rounded-card bg-surface-2" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="h-36 animate-pulse rounded-card bg-surface-2" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
