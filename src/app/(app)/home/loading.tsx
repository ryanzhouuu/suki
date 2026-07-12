export default function HomeLoading() {
  return (
    <div className="space-y-10" aria-hidden="true">
      <div className="h-72 animate-pulse rounded-card bg-surface-2 sm:h-80" />
      <div className="space-y-4">
        <div className="h-6 w-44 animate-pulse rounded bg-surface-2" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="aspect-[2/3] animate-pulse rounded-card bg-surface-2" />
          ))}
        </div>
      </div>
      <div className="space-y-4">
        <div className="h-6 w-32 animate-pulse rounded bg-surface-2" />
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} className="h-64 w-40 shrink-0 animate-pulse rounded-card bg-surface-2" />
          ))}
        </div>
      </div>
    </div>
  );
}
