import { RouteSkeleton, SkeletonBlock } from "@/components/ui/route-skeleton";

export default function HomeLoading() {
  return (
    <RouteSkeleton label="Loading home" className="space-y-10">
      <SkeletonBlock className="h-72 sm:h-80" />
      <div className="space-y-4">
        <SkeletonBlock className="h-6 w-44 rounded" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 6 }, (_, index) => (
            <SkeletonBlock key={index} className="aspect-[2/3]" />
          ))}
        </div>
      </div>
      <div className="space-y-4">
        <SkeletonBlock className="h-6 w-32 rounded" />
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 5 }, (_, index) => (
            <SkeletonBlock key={index} className="h-64 w-40 shrink-0" />
          ))}
        </div>
      </div>
    </RouteSkeleton>
  );
}
