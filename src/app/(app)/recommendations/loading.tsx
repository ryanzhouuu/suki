export default function RecommendationsLoading() {
  return (
    <div className="grid gap-8 lg:grid-cols-[19rem_minmax(0,1fr)]" aria-hidden="true">
      <div className="space-y-4">
        <div className="h-8 w-52 animate-pulse rounded bg-surface-2" />
        <div className="h-72 animate-pulse rounded-card bg-surface-2" />
      </div>
      <div className="space-y-5">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-40 animate-pulse rounded-card bg-surface-2" />
        ))}
      </div>
    </div>
  );
}
