"use client";

import { RouteError } from "@/components/ui/route-error";

export default function DigestError({
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
      title="Your weekly recap is temporarily unavailable"
      description="We couldn’t load the stable recap. Try again, or return home."
      links={[{ href: "/home", label: "Go home" }]}
    />
  );
}
