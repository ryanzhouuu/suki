import { BrandLockup } from "@/components/brand/brand-mark";
import { RouteSkeleton, SkeletonBlock } from "@/components/ui/route-skeleton";

export default function RootLoading() {
  return (
    <RouteSkeleton
      label="Loading Suki"
      className="flex min-h-svh flex-col"
    >
      <header className="border-b border-line bg-paper/80 pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:h-16">
          <BrandLockup
            markClassName="h-8 w-8 sm:h-9 sm:w-9"
            wordmarkClassName="text-xl sm:text-2xl"
          />
          <SkeletonBlock className="size-9 rounded-full" />
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 space-y-8 px-4 py-6 sm:py-10">
        <div className="space-y-3">
          <SkeletonBlock className="h-4 w-20 rounded" />
          <SkeletonBlock className="h-10 w-52 max-w-full rounded" />
        </div>
        <SkeletonBlock className="h-56 sm:h-72" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }, (_, index) => (
            <SkeletonBlock key={index} className="aspect-[2/3]" />
          ))}
        </div>
      </main>
    </RouteSkeleton>
  );
}
