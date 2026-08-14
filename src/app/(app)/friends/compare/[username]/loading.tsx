import { RouteSkeleton, SkeletonBlock } from "@/components/ui/route-skeleton";

export default function FriendComparisonLoading() {
  return (
    <RouteSkeleton label="Loading taste comparison" className="space-y-8">
      <div className="space-y-3">
        <SkeletonBlock className="h-4 w-20 rounded" />
        <SkeletonBlock className="h-10 w-48 rounded" />
        <SkeletonBlock className="h-4 w-36 rounded" />
      </div>
      <SkeletonBlock className="h-64" />
      <div className="grid gap-5 lg:grid-cols-2">
        {Array.from({ length: 4 }, (_, index) => (
          <SkeletonBlock key={index} className="h-44" />
        ))}
      </div>
    </RouteSkeleton>
  );
}
