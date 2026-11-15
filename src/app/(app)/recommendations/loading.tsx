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
      <div className="space-y-6 sm:px-16">
        <SkeletonBlock className="h-[38rem] sm:h-[32rem] lg:h-[36rem]" />
        <div className="flex gap-2.5 overflow-hidden">
          {Array.from({ length: 5 }, (_, index) => (
            <SkeletonBlock key={index} className="aspect-video w-32 shrink-0 sm:w-40" />
          ))}
        </div>
      </div>
    </RouteSkeleton>
  );
}
