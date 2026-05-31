import { NextResponse } from "next/server";

import { searchAniListAnime } from "@/lib/anilist/search";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";

  if (!q.trim()) {
    return NextResponse.json({ media: [] });
  }

  try {
    const media = await searchAniListAnime(q, 20);
    return NextResponse.json({ media });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Search failed" },
      { status: 502 },
    );
  }
}
