"use client";

import { RouteError } from "@/components/ui/route-error";

export default function LibraryError({
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
      title="Your library couldn’t be loaded"
      description="Your library data is still safe. Try loading it again, or import a list while you wait."
      links={[
        { href: "/home", label: "Go home" },
        { href: "/import", label: "Import a list" },
      ]}
    />
  );
}
