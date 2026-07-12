"use client";

import { RouteError } from "@/components/ui/route-error";

export default function FriendsError({
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
      title="Friends couldn’t be loaded"
      description="We couldn’t load your social activity right now. Try again, or return home."
      links={[{ href: "/home", label: "Go home" }]}
    />
  );
}
