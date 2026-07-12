"use client";

import { RouteError } from "@/components/ui/route-error";

export default function LibrarySetupError({
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
      title="Library setup couldn’t be loaded"
      description="We couldn’t check your setup progress. Try again, or return home."
      links={[{ href: "/home", label: "Go home" }]}
    />
  );
}
