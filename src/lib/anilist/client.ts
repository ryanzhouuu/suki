const ANILIST_GRAPHQL_URL = "https://graphql.anilist.co";

type GraphQLResponse<T> = {
  data?: T;
  errors?: Array<{ message: string }>;
};

export async function anilistQuery<T>(
  query: string,
  variables?: Record<string, unknown>,
  options?: { cache?: RequestCache; revalidate?: number },
): Promise<T> {
  const response = await fetch(ANILIST_GRAPHQL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
    cache: options?.cache ?? "default",
    next:
      options?.revalidate !== undefined
        ? { revalidate: options.revalidate }
        : undefined,
  });

  if (!response.ok) {
    throw new Error(`AniList request failed: ${response.status}`);
  }

  const json = (await response.json()) as GraphQLResponse<T>;

  if (json.errors?.length) {
    throw new Error(json.errors.map((e) => e.message).join(", "));
  }

  if (!json.data) {
    throw new Error("AniList returned no data");
  }

  return json.data;
}
