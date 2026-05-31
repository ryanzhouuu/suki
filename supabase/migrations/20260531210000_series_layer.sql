-- Canonical series grouping and series-level ranking tables

CREATE TYPE series_map_source AS ENUM (
  'anilist_auto',
  'manual_override',
  'singleton'
);

CREATE TYPE series_override_action AS ENUM (
  'force_series',
  'force_singleton',
  'exclude_from_auto_group'
);

CREATE TABLE public.series (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_title text NOT NULL,
  slug text NOT NULL UNIQUE,
  anilist_primary_id integer NOT NULL UNIQUE,
  cover_image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX series_slug_idx ON public.series (slug);
CREATE INDEX series_anilist_primary_id_idx ON public.series (anilist_primary_id);

CREATE TRIGGER series_set_updated_at
BEFORE UPDATE ON public.series
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.anime_series_map (
  anime_id uuid PRIMARY KEY REFERENCES public.anime (id) ON DELETE CASCADE,
  series_id uuid NOT NULL REFERENCES public.series (id) ON DELETE CASCADE,
  source series_map_source NOT NULL DEFAULT 'anilist_auto',
  confidence numeric(4, 3) NOT NULL DEFAULT 1.0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX anime_series_map_series_id_idx ON public.anime_series_map (series_id);

CREATE TABLE public.series_group_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  anilist_id integer NOT NULL UNIQUE,
  action series_override_action NOT NULL,
  target_series_id uuid REFERENCES public.series (id) ON DELETE SET NULL,
  target_anilist_primary_id integer,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT series_group_overrides_force_series_target CHECK (
    action <> 'force_series'
    OR target_series_id IS NOT NULL
    OR target_anilist_primary_id IS NOT NULL
  )
);

CREATE TABLE public.pairwise_series_comparisons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  left_series_id uuid NOT NULL REFERENCES public.series (id) ON DELETE CASCADE,
  right_series_id uuid NOT NULL REFERENCES public.series (id) ON DELETE CASCADE,
  winner_series_id uuid REFERENCES public.series (id) ON DELETE CASCADE,
  comparison_context jsonb,
  skipped_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pairwise_series_comparisons_distinct_series CHECK (left_series_id <> right_series_id),
  CONSTRAINT pairwise_series_comparisons_canonical_order CHECK (left_series_id < right_series_id),
  CONSTRAINT pairwise_series_comparisons_valid_winner CHECK (
    winner_series_id IS NULL
    OR winner_series_id = left_series_id
    OR winner_series_id = right_series_id
  )
);

CREATE UNIQUE INDEX pairwise_series_comparisons_user_pair_unique
  ON public.pairwise_series_comparisons (user_id, left_series_id, right_series_id);

CREATE INDEX pairwise_series_comparisons_user_id_idx
  ON public.pairwise_series_comparisons (user_id);

CREATE INDEX pairwise_series_comparisons_user_created_idx
  ON public.pairwise_series_comparisons (user_id, created_at DESC);

CREATE TABLE public.derived_series_rankings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  series_id uuid NOT NULL REFERENCES public.series (id) ON DELETE CASCADE,
  rank integer NOT NULL,
  score numeric(10, 4) NOT NULL,
  confidence ranking_confidence NOT NULL DEFAULT 'low',
  comparison_count integer NOT NULL DEFAULT 0,
  algorithm_version text NOT NULL DEFAULT 'elo_series_v1',
  computed_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT derived_series_rankings_unique_user_series_version UNIQUE (
    user_id,
    series_id,
    algorithm_version
  ),
  CONSTRAINT derived_series_rankings_rank_positive CHECK (rank > 0)
);

CREATE INDEX derived_series_rankings_user_version_rank_idx
  ON public.derived_series_rankings (user_id, algorithm_version, rank);
