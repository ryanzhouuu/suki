import { RouteSkeleton, SkeletonBlock } from "@/components/ui/route-skeleton";

export default function AnimeDetailLoading() {
  return (
    <RouteSkeleton label="Loading anime details" className="space-y-8 pb-12">
      <SkeletonBlock className="h-[44svh] min-h-80 rounded-none sm:h-[50svh]" />
      <div className="mx-auto grid w-full max-w-5xl gap-8 px-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="space-y-5">
          <SkeletonBlock className="h-8 w-52 max-w-full rounded" />
          <SkeletonBlock className="h-32" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <SkeletonBlock key={index} className="h-20" />
            ))}
          </div>
        </div>
        <SkeletonBlock className="h-72" />
      </div>
    </RouteSkeleton>
  );
}
