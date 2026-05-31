import type { Tables } from "@/types/database";

import type { TasteProfileSignals } from "./types";

function stripHtml(text: string | null): string {
  if (!text) return "";
  return text.replace(/<[^>]*>/g, "").trim();
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}…`;
}

export function buildAnimeEmbeddingText(
  anime: Tables<"anime">,
  seriesTitle?: string | null,
): string {
  const title =
    anime.english_title || anime.romaji_title || anime.native_title || "Unknown";

  const lines = [
    `Title: ${title}`,
    seriesTitle ? `Series: ${seriesTitle}` : null,
    anime.format ? `Format: ${anime.format}` : null,
    anime.genres.length > 0 ? `Genres: ${anime.genres.join(", ")}` : null,
    anime.source ? `Source: ${anime.source}` : null,
    anime.season && anime.season_year
      ? `Season: ${anime.season} ${anime.season_year}`
      : anime.season_year
        ? `Year: ${anime.season_year}`
        : null,
    anime.status ? `Status: ${anime.status}` : null,
    anime.average_score ? `Average score: ${anime.average_score}` : null,
    anime.popularity ? `Popularity: ${anime.popularity}` : null,
    anime.description
      ? `Description: ${truncate(stripHtml(anime.description), 600)}`
      : null,
  ].filter((line): line is string => Boolean(line));

  return lines.join("\n");
}

export function buildTasteProfileText(signals: TasteProfileSignals): string {
  const lines: string[] = [];

  if (signals.topRankedSeries.length > 0) {
    lines.push(
      `Top ranked series: ${signals.topRankedSeries.map((s) => s.title).join(", ")}.`,
    );
  }

  if (signals.topGenres.length > 0) {
    lines.push(`Strong genre preferences: ${signals.topGenres.join(", ")}.`);
  }

  if (signals.topFormats.length > 0) {
    lines.push(`Preferred formats: ${signals.topFormats.join(", ")}.`);
  }

  if (signals.topSources.length > 0) {
    lines.push(`Preferred sources: ${signals.topSources.join(", ")}.`);
  }

  if (signals.completedTitles.length > 0) {
    lines.push(
      `Completed anime includes: ${signals.completedTitles.slice(0, 12).join(", ")}.`,
    );
  }

  if (signals.watchingTitles.length > 0) {
    lines.push(
      `Currently watching: ${signals.watchingTitles.slice(0, 8).join(", ")}.`,
    );
  }

  if (signals.avoidGenres.length > 0) {
    lines.push(
      `Avoid recommending themes similar to dropped genres: ${signals.avoidGenres.join(", ")}.`,
    );
  }

  if (signals.droppedTitles.length > 0) {
    lines.push(
      `Dropped titles include: ${signals.droppedTitles.slice(0, 8).join(", ")}.`,
    );
  }

  if (lines.length === 0) {
    lines.push(
      "The user is new. Recommend acclaimed, accessible anime with broad appeal.",
    );
  }

  return lines.join("\n");
}
