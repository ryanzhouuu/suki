import { RouteSkeleton, SkeletonBlock } from "@/components/ui/route-skeleton";

export default function RecommendationsLoading() {
  return (
    <RouteSkeleton
      label="Loading recommendations"
      className="grid gap-8 lg:grid-cols-[19rem_minmax(0,1fr)]"
    >
      <div className="space-y-4">
        <SkeletonBlock className="h-8 w-52 rounded" />
        <SkeletonBlock className="h-72" />
      </div>
      <div className="space-y-5">
        {Array.from({ length: 4 }, (_, index) => (
          <SkeletonBlock key={index} className="h-40" />
        ))}
      </div>
    </RouteSkeleton>
  );
}
