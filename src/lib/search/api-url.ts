export type SearchApiUrlOptions = {
  format?: string | null;
  /** UI sort key; omitted/`relevance` keeps the param out of the URL. */
  sort?: string | null;
};

export function buildSearchApiUrl(
  query: string,
  genres: string[],
  options?: SearchApiUrlOptions,
): string {
  const params = new URLSearchParams();
  const trimmed = query.trim();
  if (trimmed) params.set("q", trimmed);
  for (const genre of genres) {
    params.append("genre", genre);
  }
  if (options?.format) params.set("format", options.format);
  if (options?.sort && options.sort !== "relevance") {
    params.set("sort", options.sort);
  }
  const qs = params.toString();
  return qs ? `/api/search?${qs}` : "/api/search";
}
