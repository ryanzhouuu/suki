export type SeriesMemberArt = {
  anilistId: number;
  bannerUrl: string | null;
};

/**
 * Banner art for a series: the primary entry's banner when it has one,
 * otherwise any member's banner, otherwise the series cover.
 */
export function pickSeriesBanner(
  primaryAnilistId: number,
  members: SeriesMemberArt[],
  coverUrl: string | null,
): string | null {
  const primary = members.find(
    (member) => member.anilistId === primaryAnilistId && member.bannerUrl,
  );
  return (
    primary?.bannerUrl ??
    members.find((member) => member.bannerUrl)?.bannerUrl ??
    coverUrl
  );
}
