import { RouteSkeleton, SkeletonBlock } from "@/components/ui/route-skeleton";

export default function ImportLoading() {
  return (
    <RouteSkeleton label="Loading import" className="mx-auto max-w-3xl space-y-8">
      <div className="space-y-3">
        <SkeletonBlock className="h-4 w-28 rounded" />
        <SkeletonBlock className="h-10 w-32 rounded" />
        <SkeletonBlock className="h-4 w-80 max-w-full rounded" />
      </div>
      <div className="space-y-5 rounded-card border border-line-strong p-6">
        <SkeletonBlock className="h-7 w-56 rounded" />
        <SkeletonBlock className="h-36 rounded-xl" />
        <SkeletonBlock className="h-11 w-40 rounded-xl" />
      </div>
    </RouteSkeleton>
  );
}
