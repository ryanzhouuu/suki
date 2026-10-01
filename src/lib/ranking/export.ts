/** Formats the complete series ranking for clipboard and plain-text downloads. */

type RankingExportRow = {
  rank: number;
  series: { canonical_title: string } | null;
};

export type RankingTextExport = {
  text: string;
  filename: string;
  count: number;
};

/** Preserves stored ranks, includes every row, and leaves the input order untouched. */
export function buildRankingTextExport({
  rankings,
  username,
  url,
}: {
  rankings: readonly RankingExportRow[];
  username: string;
  url: string;
}): RankingTextExport {
  const lines = [...rankings]
    .sort((left, right) => left.rank - right.rank)
    .map((row) => {
      const title = row.series?.canonical_title.replace(/\s+/g, " ").trim();
      return `${row.rank}. ${title || "Unknown series"}`;
    });

  return {
    text: [`${username}'s anime ranking on Suki`, "", ...lines, "", url, ""].join("\n"),
    filename: `suki-${username}-ranking.txt`,
    count: rankings.length,
  };
}
