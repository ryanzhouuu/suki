"use client";

import { RouteError } from "@/components/ui/route-error";

export default function HomeError({
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
      title="Home is temporarily unavailable"
      description="We couldn’t load your home page. Try again, or open your library instead."
      links={[{ href: "/library", label: "Go to library" }]}
    />
  );
}
