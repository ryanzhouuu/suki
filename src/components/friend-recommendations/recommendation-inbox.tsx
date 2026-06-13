"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import {
  markRecommendationsSeen,
  respondToAnimeRecommendation,
} from "@/actions/friend-recommendations";
import { AnimePoster } from "@/components/anime/anime-poster";
import { Button } from "@/components/ui/button";
import type { ReceivedRecommendation } from "@/lib/friend-recommendations/view-model";
import { formatRelativeTime } from "@/lib/friends/relative-time";

type RecommendationInboxProps = {
  recommendations: ReceivedRecommendation[];
};

function SenderAvatar({ rec }: { rec: ReceivedRecommendation }) {
  const name = rec.sender.display_name || rec.sender.username;
  if (rec.sender.avatar_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={rec.sender.avatar_url}
        alt=""
        className="h-7 w-7 shrink-0 rounded-full object-cover"
      />
    );
  }
  return (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-on-accent">
      {name[0]?.toUpperCase()}
    </div>
  );
}

function InboxItem({
  rec,
  onResolved,
}: {
  rec: ReceivedRecommendation;
  onResolved: (id: string) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const title = rec.anime.english_title || rec.anime.romaji_title;
  const senderName = rec.sender.display_name || rec.sender.username;

  function respond(response: "add" | "dismiss") {
    setError(null);
    startTransition(async () => {
      const result = await respondToAnimeRecommendation(rec.id, response);
      if (result.error) {
        setError(result.error);
        return;
      }
      onResolved(rec.id);
      router.refresh();
    });
  }

  return (
    <li className="flex gap-3 rounded-card border border-line bg-surface p-3 sm:p-4">
      <Link
        href={`/anime/${rec.anime.anilist_id}`}
        className="shrink-0 transition-transform hover:-translate-y-0.5"
        title={title}
      >
        <AnimePoster src={rec.anime.cover_image_url} alt={title} size="md" />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2">
          <Link href={`/u/${rec.sender.username}`} className="shrink-0">
            <SenderAvatar rec={rec} />
          </Link>
          <p className="min-w-0 text-xs text-muted">
            <Link
              href={`/u/${rec.sender.username}`}
              className="font-semibold text-ink hover:text-accent"
            >
              {senderName}
            </Link>{" "}
            recommends · {formatRelativeTime(rec.createdAt)}
          </p>
        </div>

        <Link
          href={`/anime/${rec.anime.anilist_id}`}
          className="mt-1.5 line-clamp-2 font-display text-base font-semibold text-ink hover:text-accent"
        >
          {title}
        </Link>

        {rec.note ? (
          <p className="mt-1 border-l-2 border-line-strong pl-2.5 text-sm italic text-ink/80">
            “{rec.note}”
          </p>
        ) : null}

        {rec.alreadyInLibrary ? (
          <p className="mt-1.5 inline-flex w-fit items-center gap-1 rounded-full bg-surface-2 px-2 py-0.5 text-xs font-medium text-muted">
            Already in your library
          </p>
        ) : null}

        {error ? (
          <p className="mt-1.5 text-xs text-danger" role="alert">
            {error}
          </p>
        ) : null}

        <div className="mt-2.5 flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            disabled={pending}
            onClick={() => respond("add")}
          >
            {rec.alreadyInLibrary ? "Keep & clear" : "Add to plan-to-watch"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={pending}
            onClick={() => respond("dismiss")}
          >
            Dismiss
          </Button>
        </div>
      </div>
    </li>
  );
}

export function RecommendationInbox({
  recommendations,
}: RecommendationInboxProps) {
  const router = useRouter();
  const [items, setItems] = useState(recommendations);
  const seenRef = useRef(false);

  // Clear the unread nav badge once the inbox has been rendered. Resolved items
  // are removed optimistically in `resolve`, so we don't re-sync from props.
  useEffect(() => {
    if (seenRef.current) return;
    seenRef.current = true;
    void (async () => {
      await markRecommendationsSeen();
      router.refresh();
    })();
  }, [router]);

  if (items.length === 0) return null;

  function resolve(id: string) {
    setItems((current) => current.filter((rec) => rec.id !== id));
  }

  return (
    <section className="space-y-3">
      <div className="flex items-baseline gap-2">
        <h2 className="text-lg font-semibold">Recommended to you</h2>
        <span className="font-normal text-muted">({items.length})</span>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {items.map((rec) => (
          <InboxItem key={rec.id} rec={rec} onResolved={resolve} />
        ))}
      </ul>
    </section>
  );
}
