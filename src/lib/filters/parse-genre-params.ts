import { normalizeGenreParams } from "@/lib/anilist/genres";

export function parseGenreParams(values: string[]): string[] {
  return normalizeGenreParams(values);
}
