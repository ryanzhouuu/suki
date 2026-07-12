import type { ReactNode } from "react";

type SkeletonBlockProps = {
  className?: string;
};

export function SkeletonBlock({ className = "h-20" }: SkeletonBlockProps) {
  return (
    <div
      className={`animate-pulse rounded-card bg-surface-2 ${className}`}
      aria-hidden="true"
    />
  );
}

type RouteSkeletonProps = {
  children?: ReactNode;
  className?: string;
  label?: string;
};

export function RouteSkeleton({
  children,
  className,
  label = "Loading page",
}: RouteSkeletonProps) {
  return (
    <div className={className} role="status">
      <span className="sr-only">{label}</span>
      <div aria-hidden="true">
        {children ?? (
          <div className="space-y-5">
            <SkeletonBlock className="h-8 w-40" />
            <SkeletonBlock className="h-28 w-full" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((index) => (
                <SkeletonBlock className="h-48" key={index} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
