"use client";

import { RouteError } from "@/components/ui/route-error";

export default function RecommendationsError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <RouteError
      error={error}
      unstable_retry={unstable_retry}
      title="Recommendations are temporarily unavailable"
      description="We couldn’t load your recommendations. Try again, or browse your library for now."
      links={[
        { href: "/library", label: "Go to library" },
        { href: "/home", label: "Go home" },
      ]}
    />
  );
}
