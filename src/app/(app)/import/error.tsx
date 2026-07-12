"use client";

import { RouteError } from "@/components/ui/route-error";

export default function ImportError({
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
      title="Import status couldn’t be loaded"
      description="We couldn’t safely check your current import. Try again before starting another import."
      links={[
        { href: "/library", label: "Go to library" },
        { href: "/home", label: "Go home" },
      ]}
    />
  );
}
