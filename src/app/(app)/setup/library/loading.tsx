import { RouteSkeleton, SkeletonBlock } from "@/components/ui/route-skeleton";

export default function LibrarySetupLoading() {
  return (
    <RouteSkeleton
      label="Loading library setup"
      className="mx-auto max-w-3xl space-y-8"
    >
      <div className="space-y-4">
        <SkeletonBlock className="h-4 w-28 rounded" />
        <SkeletonBlock className="h-10 w-64 rounded" />
        <SkeletonBlock className="h-4 w-80 max-w-full rounded" />
        <SkeletonBlock className="h-2 rounded-full" />
      </div>
      <div className="space-y-5 rounded-card border border-line-strong bg-surface p-6 sm:p-8">
        <SkeletonBlock className="h-7 w-52 rounded" />
        <SkeletonBlock className="h-32 rounded-xl" />
        <SkeletonBlock className="h-11 w-44 rounded-xl" />
      </div>
    </RouteSkeleton>
  );
}
