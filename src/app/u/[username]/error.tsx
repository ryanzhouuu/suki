"use client";

import { RouteError } from "@/components/ui/route-error";

export default function PublicProfileError({
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
      title="This profile couldn’t be loaded"
      description="The profile is temporarily unavailable. Try again, or return to Suki."
      links={[{ href: "/", label: "Back to Suki" }]}
    />
  );
}
