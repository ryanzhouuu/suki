import { RouteSkeleton, SkeletonBlock } from "@/components/ui/route-skeleton";

export default function PublicProfileLoading() {
  return (
    <RouteSkeleton
      label="Loading profile"
      className="mx-auto max-w-7xl space-y-8 py-10"
    >
      <div className="flex items-center gap-5">
        <SkeletonBlock className="size-24 shrink-0 rounded-full" />
        <div className="flex-1 space-y-3">
          <SkeletonBlock className="h-8 w-52 max-w-full rounded" />
          <SkeletonBlock className="h-4 w-32 rounded" />
        </div>
      </div>
      <SkeletonBlock className="h-11" />
      <div className="grid gap-5 lg:grid-cols-3">
        <SkeletonBlock className="h-56 lg:col-span-2" />
        <SkeletonBlock className="h-56" />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
        {Array.from({ length: 6 }, (_, index) => (
          <SkeletonBlock key={index} className="aspect-[2/3]" />
        ))}
      </div>
    </RouteSkeleton>
  );
}
