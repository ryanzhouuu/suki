export default function LibraryLoading() {
  return (
    <div className="space-y-6" aria-hidden="true">
      <div className="space-y-3">
        <div className="h-4 w-20 animate-pulse rounded bg-surface-2" />
        <div className="h-10 w-40 animate-pulse rounded bg-surface-2" />
      </div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="h-16 animate-pulse rounded-card bg-surface-2" />
        ))}
      </div>
      <div className="h-11 animate-pulse rounded-card bg-surface-2" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 10 }, (_, index) => (
          <div key={index} className="aspect-[2/3] animate-pulse rounded-card bg-surface-2" />
        ))}
      </div>
    </div>
  );
}
