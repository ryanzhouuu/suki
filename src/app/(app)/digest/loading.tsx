import { RouteSkeleton, SkeletonBlock } from "@/components/ui/route-skeleton";

export default function DigestLoading() {
  return (
    <RouteSkeleton label="Loading digest" className="mx-auto max-w-4xl space-y-8">
      <SkeletonBlock className="h-64" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <SkeletonBlock key={index} className="h-28" />
        ))}
      </div>
      <SkeletonBlock className="h-48" />
    </RouteSkeleton>
  );
}
