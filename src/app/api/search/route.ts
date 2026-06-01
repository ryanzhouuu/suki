import { NextResponse } from "next/server";

import { searchAniListAnime } from "@/lib/anilist/search";
import { parseSearchParams } from "@/lib/search/params";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const { query, genres, invalidGenre } = parseSearchParams(searchParams);

  if (invalidGenre) {
    return NextResponse.json(
      { error: `Invalid genre: ${invalidGenre}` },
      { status: 400 },
    );
  }

  if (!query.trim() && genres.length === 0) {
    return NextResponse.json({ media: [] });
  }

  try {
    const media = await searchAniListAnime(query, { genres });
    return NextResponse.json({ media });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Search failed" },
      { status: 502 },
    );
  }
}
