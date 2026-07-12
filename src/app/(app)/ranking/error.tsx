"use client";

import { RouteError } from "@/components/ui/route-error";

export default function RankingError({
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
      title="Rankings couldn’t be loaded"
      description="We couldn’t prepare your ranking right now. Try again, or return to your library."
      links={[
        { href: "/library", label: "Go to library" },
        { href: "/home", label: "Go home" },
      ]}
    />
  );
}
