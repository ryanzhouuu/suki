import { NextResponse } from "next/server";

import {
  isValidAniListGenre,
  MAX_SEARCH_GENRES,
  normalizeGenreParams,
} from "@/lib/anilist/genres";
import { searchAniListAnime } from "@/lib/anilist/search";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const rawGenres = searchParams.getAll("genre");

  const invalid = rawGenres.filter(
    (g) => g.trim() && !isValidAniListGenre(g.trim()),
  );
  if (invalid.length > 0) {
    return NextResponse.json(
      { error: `Invalid genre: ${invalid[0]}` },
      { status: 400 },
    );
  }

  const genres = normalizeGenreParams(rawGenres).slice(0, MAX_SEARCH_GENRES);

  if (!q.trim() && genres.length === 0) {
    return NextResponse.json({ media: [] });
  }

  try {
    const media = await searchAniListAnime(q, { genres });
    return NextResponse.json({ media });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Search failed" },
      { status: 502 },
    );
  }
}
