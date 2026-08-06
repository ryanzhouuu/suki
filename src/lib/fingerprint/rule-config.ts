export const FINGERPRINT_RULEBOOK_VERSION = "rulebook_v1" as const;

export const POPULARITY_BANDS = {
  deepCutMaximum: 10_000,
  crowdPleaserMinimum: 100_000,
} as const;

export const RULE_THRESHOLDS = {
  genreMinimumPositive: 8,
  genreMinimumShare: 0.5,
  genreMinimumConfidentSupport: 2,
  themeMinimumPositive: 6,
  themeMinimumShare: 0.4,
  themeMinimumConfidentSupport: 2,
  eclecticMinimumPositive: 10,
  eclecticMaximumTopShare: 0.4,
  eclecticMinimumSignals: 4,
  focusedMinimumPositive: 10,
  focusedMinimumShare: 0.5,
  focusedMinimumMargin: 0.15,
  popularityMinimumFavorites: 5,
  popularityMinimumBandShare: 0.6,
  shortMinimumFranchises: 6,
  shortMaximumEpisodes: 13,
  shortMinimumShare: 0.65,
  longMinimumFranchises: 3,
  longMinimumEpisodeShare: 0.45,
  movieMinimumFranchises: 3,
  movieMinimumKnownFormats: 4,
  movieMinimumShare: 0.4,
  completionMinimumStarted: 10,
  completionMinimumSettled: 8,
  completionMinimumRate: 0.8,
  completionMaximumDropShare: 0.1,
  samplerMinimumStarted: 12,
  samplerMinimumPausedOrDropped: 4,
  samplerMinimumShare: 0.35,
  rewatchMinimumTotal: 4,
  rewatchMinimumFranchises: 2,
  ratingMinimumScored: 8,
  reservedMaximumMean: 6.5,
  heartMinimumMean: 8.5,
  battleMinimumRanked: 10,
  battleMinimumConfidentShare: 0.6,
} as const;

export const CURATED_GENRES: Record<
  string,
  { label: string; summary: string }
> = {
  action: {
    label: "Action Loyalist",
    summary: "You keep coming back to stories that make every episode feel kinetic.",
  },
  adventure: {
    label: "Adventure Loyalist",
    summary: "You like a watchlist that keeps moving toward the next horizon.",
  },
  comedy: {
    label: "Laugh-Track Loyalist",
    summary: "You reliably make room for anime that knows how to keep things light.",
  },
  drama: {
    label: "Drama Devotee",
    summary: "You have a soft spot for stories that let their emotional stakes breathe.",
  },
  fantasy: {
    label: "Fantasy Devotee",
    summary: "You keep choosing worlds with a little more wonder in them.",
  },
  horror: {
    label: "Horror Devotee",
    summary: "You are willing to let your watchlist get genuinely unsettling.",
  },
  mystery: {
    label: "Mystery Devotee",
    summary: "You like stories that make you earn the next answer.",
  },
  romance: {
    label: "Romance Devotee",
    summary: "You keep finding time for stories built around emotional chemistry.",
  },
  "sci-fi": {
    label: "Future-Seeker",
    summary: "You are drawn to anime that uses strange futures to ask familiar questions.",
  },
  "slice of life": {
    label: "Everyday-Life Devotee",
    summary: "You notice how much story can fit inside ordinary days.",
  },
  sports: {
    label: "Sports Anime Loyalist",
    summary: "You enjoy the long build toward a moment worth cheering for.",
  },
  supernatural: {
    label: "Supernatural Devotee",
    summary: "You like the everyday world best when something uncanny slips through it.",
  },
  psychological: {
    label: "Mind-Game Devotee",
    summary: "You are happy to follow a story into complicated corners of the mind.",
  },
  thriller: {
    label: "Thriller Devotee",
    summary: "You keep choosing stories that make the next episode feel urgent.",
  },
  mecha: {
    label: "Mecha Devotee",
    summary: "You have a reliable weakness for giant machines and the people inside them.",
  },
  music: {
    label: "Music Anime Devotee",
    summary: "You make space for stories where performance is part of the plot.",
  },
  historical: {
    label: "History Wanderer",
    summary: "You like fiction with a strong sense of the world that came before.",
  },
};

export type ThemeCluster = {
  id: string;
  tags: readonly string[];
  label: string;
  summary: string;
};

export const CURATED_THEME_CLUSTERS: readonly ThemeCluster[] = [
  {
    id: "coming-of-age",
    tags: ["coming of age", "school", "school life", "青春"],
    label: "Growing-Up Magnet",
    summary: "You keep gravitating toward stories about becoming someone new.",
  },
  {
    id: "time-travel",
    tags: ["time travel", "time manipulation", "time loop"],
    label: "Timeline Tinkerer",
    summary: "You are unusually willing to trust a story with the clock.",
  },
  {
    id: "isekai",
    tags: ["isekai", "another world", "transported to another world"],
    label: "World-Hopper",
    summary: "You keep saying yes when a story offers a one-way ticket somewhere else.",
  },
  {
    id: "survival",
    tags: ["survival", "survival game", "battle royale"],
    label: "High-Stakes Survivor",
    summary: "You have a taste for stories that make every decision matter.",
  },
  {
    id: "found-family",
    tags: ["family", "found family", "friendship"],
    label: "Found-Family Magnet",
    summary: "You notice the teams and bonds that make a story feel lived in.",
  },
];
