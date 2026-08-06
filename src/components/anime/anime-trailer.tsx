"use client";

import { useState } from "react";

type AnimeTrailerProps = {
  id: string;
  thumbnail: string | null;
};

export function AnimeTrailer({ id, thumbnail }: AnimeTrailerProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  if (isLoaded) {
    return (
      <div className="aspect-video w-full max-w-[500px] overflow-hidden rounded-card bg-surface-2">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1`}
          title="Anime trailer"
          className="h-full w-full border-0"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setIsLoaded(true)}
      aria-label="Play trailer"
      className="group relative block w-full max-w-[500px] overflow-hidden rounded-card bg-surface-2 p-0 text-left"
    >
      {thumbnail ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={thumbnail}
          alt="Trailer thumbnail"
          className="aspect-video w-full object-cover transition-opacity duration-200 group-hover:opacity-80"
        />
      ) : (
        <div className="aspect-video w-full" />
      )}
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-paper/85 shadow-lg backdrop-blur-sm transition-transform duration-200 group-hover:scale-110">
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
            className="h-6 w-6 translate-x-0.5 text-ink"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
      </span>
    </button>
  );
}
