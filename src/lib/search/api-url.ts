export function buildSearchApiUrl(query: string, genres: string[]): string {
  const params = new URLSearchParams();
  const trimmed = query.trim();
  if (trimmed) params.set("q", trimmed);
  for (const genre of genres) {
    params.append("genre", genre);
  }
  const qs = params.toString();
  return qs ? `/api/search?${qs}` : "/api/search";
}
