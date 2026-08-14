import { RouteSkeleton, SkeletonBlock } from "@/components/ui/route-skeleton";

export default function LibraryLoading() {
  return (
    <RouteSkeleton label="Loading library" className="space-y-6">
      <div className="space-y-3">
        <SkeletonBlock className="h-4 w-20 rounded" />
        <SkeletonBlock className="h-10 w-40 rounded" />
      </div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
        {Array.from({ length: 5 }, (_, index) => (
          <SkeletonBlock key={index} className="h-16" />
        ))}
      </div>
      <SkeletonBlock className="h-11" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 10 }, (_, index) => (
          <SkeletonBlock key={index} className="aspect-[2/3]" />
        ))}
      </div>
    </RouteSkeleton>
  );
}
