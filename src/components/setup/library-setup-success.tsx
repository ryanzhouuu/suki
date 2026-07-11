import Link from "next/link";

import { Button } from "@/components/ui/button";

type LibrarySetupSuccessProps = {
  libraryCount: number;
  rankingReady: boolean;
};

export function LibrarySetupSuccess({
  libraryCount,
  rankingReady,
}: LibrarySetupSuccessProps) {
  return (
    <div className="space-y-6 text-center">
      <div>
        <p className="font-display text-2xl font-semibold text-ink">
          You&apos;re all set
        </p>
        <p className="mt-2 text-sm text-muted">
          {libraryCount} anime in your library. Suki is ready when you are.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link href="/library">
          <Button size="lg" className="w-full sm:w-auto">
            Go to library
          </Button>
        </Link>
        {rankingReady ? (
          <Link href="/ranking">
            <Button variant="secondary" size="lg" className="w-full sm:w-auto">
              Start ranking
            </Button>
          </Link>
        ) : null}
        <Link href="/search">
          <Button variant="ghost" size="lg" className="w-full sm:w-auto">
            Add more anime
          </Button>
        </Link>
      </div>
    </div>
  );
}
