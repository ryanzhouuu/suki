import { RouteSkeleton, SkeletonBlock } from "@/components/ui/route-skeleton";

export default function RankingLoading() {
  return (
    <RouteSkeleton label="Loading rankings" className="space-y-10">
      <div className="space-y-3">
        <SkeletonBlock className="h-4 w-24 rounded" />
        <SkeletonBlock className="h-10 w-40 rounded" />
      </div>
      <div className="mx-auto grid max-w-3xl grid-cols-2 gap-5">
        {Array.from({ length: 2 }, (_, index) => (
          <SkeletonBlock key={index} className="aspect-[3/4]" />
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: 6 }, (_, index) => (
          <SkeletonBlock key={index} className="h-20" />
        ))}
      </div>
    </RouteSkeleton>
  );
}
