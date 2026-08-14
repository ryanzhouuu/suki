import { RouteSkeleton, SkeletonBlock } from "@/components/ui/route-skeleton";

export default function FriendsLoading() {
  return (
    <RouteSkeleton label="Loading friends" className="space-y-8">
      <div className="space-y-3">
        <SkeletonBlock className="h-4 w-16 rounded" />
        <SkeletonBlock className="h-10 w-36 rounded" />
      </div>
      <SkeletonBlock className="h-32" />
      <div className="grid gap-8 lg:grid-cols-[19rem_minmax(0,1fr)]">
        <SkeletonBlock className="h-72" />
        <div className="space-y-6">
          <SkeletonBlock className="h-56" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }, (_, index) => (
              <SkeletonBlock key={index} className="h-36" />
            ))}
          </div>
        </div>
      </div>
    </RouteSkeleton>
  );
}
