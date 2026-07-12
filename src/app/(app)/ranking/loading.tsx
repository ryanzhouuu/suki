export default function RankingLoading() {
  return (
    <div className="space-y-10" aria-hidden="true">
      <div className="space-y-3">
        <div className="h-4 w-24 animate-pulse rounded bg-surface-2" />
        <div className="h-10 w-40 animate-pulse rounded bg-surface-2" />
      </div>
      <div className="mx-auto grid max-w-3xl grid-cols-2 gap-5">
        {Array.from({ length: 2 }, (_, index) => (
          <div key={index} className="aspect-[3/4] animate-pulse rounded-card bg-surface-2" />
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="h-20 animate-pulse rounded-card bg-surface-2" />
        ))}
      </div>
    </div>
  );
}
