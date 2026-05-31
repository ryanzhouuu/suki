import Link from "next/link";

import { PlaceholderPage } from "@/components/ui/placeholder-page";

export default function HomePage() {
  return (
    <div className="space-y-8 pb-20 sm:pb-8">
      <PlaceholderPage
        title="Home"
        description="Continue watching, ranking prompts, and friend highlights will live here."
        milestone="Milestone 1–2"
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/search"
          className="rounded-xl border border-zinc-200 p-4 transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
        >
          <h2 className="font-medium text-zinc-900 dark:text-zinc-50">
            Search anime
          </h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Find shows via AniList and add them to your library.
          </p>
        </Link>
        <Link
          href="/ranking"
          className="rounded-xl border border-zinc-200 p-4 transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
        >
          <h2 className="font-medium text-zinc-900 dark:text-zinc-50">
            Build your ranking
          </h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Compare completed anime with pairwise choices.
          </p>
        </Link>
      </div>
    </div>
  );
}
