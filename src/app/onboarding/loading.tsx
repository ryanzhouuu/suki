import { BrandMark } from "@/components/brand/brand-mark";
import { RouteSkeleton, SkeletonBlock } from "@/components/ui/route-skeleton";

export default function OnboardingLoading() {
  return (
    <RouteSkeleton
      label="Loading onboarding"
      className="mx-auto flex min-h-svh w-full max-w-md flex-col justify-center px-4 py-16"
    >
      <BrandMark className="mb-6 h-12 w-12 text-accent" />
      <div className="space-y-3">
        <SkeletonBlock className="h-4 w-24 rounded" />
        <SkeletonBlock className="h-9 w-64 max-w-full rounded" />
        <SkeletonBlock className="h-4 w-full rounded" />
      </div>
      <SkeletonBlock className="mt-8 h-64" />
    </RouteSkeleton>
  );
}
