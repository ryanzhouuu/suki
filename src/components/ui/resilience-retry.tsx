"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

type ResilienceRetryProps = {
  className?: string;
  label?: string;
};

export function ResilienceRetry({
  className,
  label = "Try again",
}: ResilienceRetryProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      className={className}
      disabled={isPending}
      onClick={() => startTransition(() => router.refresh())}
      size="sm"
      type="button"
      variant="secondary"
    >
      {isPending ? "Retrying…" : label}
    </Button>
  );
}
