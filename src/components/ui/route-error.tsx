"use client";

import Link from "next/link";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";

type RouteErrorLink = {
  href: string;
  label: string;
};

type RouteErrorProps = {
  description?: string;
  error: Error & { digest?: string };
  links?: RouteErrorLink[];
  title?: string;
  unstable_retry: () => void;
};

export function RouteError({
  description = "We couldn't load this page. Your data is safe, and you can try again.",
  error,
  links = [],
  title = "Something went wrong",
  unstable_retry,
}: RouteErrorProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <main
      className="mx-auto flex min-h-[50vh] max-w-2xl items-center px-4 py-16"
      role="alert"
    >
      <div className="w-full rounded-card border border-line bg-surface p-6 shadow-sm sm:p-8">
        <p className="eyebrow text-accent">Page unavailable</p>
        <h1 className="mt-2 text-3xl font-semibold text-ink">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-muted">{description}</p>
        {error.digest ? (
          <p className="mt-3 font-mono text-xs text-faint">
            Reference: {error.digest}
          </p>
        ) : null}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button
            disabled={isPending}
            onClick={() => startTransition(unstable_retry)}
            type="button"
          >
            {isPending ? "Retrying…" : "Try again"}
          </Button>
          {links.map((link) => (
            <Link
              className="inline-flex min-h-11 items-center rounded-full border border-line-strong bg-surface px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:border-accent hover:text-accent"
              href={link.href}
              key={`${link.href}-${link.label}`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
