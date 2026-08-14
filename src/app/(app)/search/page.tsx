import { Suspense } from "react";

import { SearchPanel } from "@/components/search/search-panel";
import { RouteSkeleton, SkeletonBlock } from "@/components/ui/route-skeleton";

function SearchLoading() {
  return (
    <RouteSkeleton label="Loading search" className="space-y-6">
      <div className="space-y-3">
        <SkeletonBlock className="h-4 w-16 rounded" />
        <SkeletonBlock className="h-10 w-40 rounded" />
      </div>
      <SkeletonBlock className="h-14 rounded-2xl" />
      <div className="space-y-4">
        {Array.from({ length: 4 }, (_, index) => (
          <SkeletonBlock key={index} className="h-32" />
        ))}
      </div>
    </RouteSkeleton>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchLoading />}>
      <SearchPanel />
    </Suspense>
  );
}
