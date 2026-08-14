import { RouteSkeleton, SkeletonBlock } from "@/components/ui/route-skeleton";

export default function SeriesAdminLoading() {
  return (
    <RouteSkeleton
      label="Loading series overrides"
      className="mx-auto max-w-2xl space-y-8"
    >
      <div className="space-y-3">
        <SkeletonBlock className="h-4 w-16 rounded" />
        <SkeletonBlock className="h-10 w-64 max-w-full rounded" />
        <SkeletonBlock className="h-4 w-full rounded" />
      </div>
      <SkeletonBlock className="h-80" />
    </RouteSkeleton>
  );
}
