export default function DigestLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-8" aria-hidden="true">
      <div className="h-64 animate-pulse rounded-card bg-surface-2" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-28 animate-pulse rounded-card bg-surface-2" />
        ))}
      </div>
      <div className="h-48 animate-pulse rounded-card bg-surface-2" />
    </div>
  );
}

