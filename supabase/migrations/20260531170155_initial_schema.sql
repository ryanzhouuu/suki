-- Anime tracker core schema (see docs/design.md)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE anime_entry_status AS ENUM (
  'watching',
  'completed',
  'paused',
  'dropped',
  'plan_to_watch'
);

CREATE TYPE watchlist_priority AS ENUM ('low', 'medium', 'high');

CREATE TYPE profile_visibility AS ENUM ('public', 'friends_only', 'private');

CREATE TYPE friendship_status AS ENUM (
  'pending',
  'accepted',
  'declined',
  'blocked'
);

CREATE TYPE ranking_confidence AS ENUM ('low', 'medium', 'high');

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE public.profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  username text NOT NULL,
  display_name text,
  avatar_url text,
  bio text,
  profile_visibility profile_visibility NOT NULL DEFAULT 'public',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT profiles_username_length CHECK (char_length(username) BETWEEN 3 AND 30),
  CONSTRAINT profiles_username_format CHECK (username ~ '^[a-zA-Z0-9_]+$')
);

CREATE UNIQUE INDEX profiles_username_lower_idx ON public.profiles (lower(username));

CREATE TRIGGER profiles_set_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.anime (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  anilist_id integer NOT NULL UNIQUE,
  romaji_title text NOT NULL,
  english_title text,
  native_title text,
  description text,
  cover_image_url text,
  banner_image_url text,
  format text,
  episodes integer,
  duration_minutes integer,
  season text,
  season_year integer,
  status text,
  genres text[] NOT NULL DEFAULT '{}',
  average_score numeric(5, 2),
  popularity integer,
  source text,
  metadata_updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX anime_anilist_id_idx ON public.anime (anilist_id);
CREATE INDEX anime_romaji_title_idx ON public.anime (romaji_title);

CREATE TABLE public.user_anime_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  anime_id uuid NOT NULL REFERENCES public.anime (id) ON DELETE CASCADE,
  status anime_entry_status NOT NULL,
  progress_episodes integer NOT NULL DEFAULT 0,
  rewatch_count integer NOT NULL DEFAULT 0,
  priority watchlist_priority,
  notes text,
  personal_score numeric(4, 2),
  started_at date,
  completed_at date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_anime_entries_unique_user_anime UNIQUE (user_id, anime_id),
  CONSTRAINT user_anime_entries_progress_non_negative CHECK (progress_episodes >= 0),
  CONSTRAINT user_anime_entries_rewatch_non_negative CHECK (rewatch_count >= 0)
);

CREATE INDEX user_anime_entries_user_id_idx ON public.user_anime_entries (user_id);
CREATE INDEX user_anime_entries_user_status_idx ON public.user_anime_entries (user_id, status);
CREATE INDEX user_anime_entries_anime_id_idx ON public.user_anime_entries (anime_id);

CREATE TRIGGER user_anime_entries_set_updated_at
BEFORE UPDATE ON public.user_anime_entries
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.pairwise_comparisons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  left_anime_id uuid NOT NULL REFERENCES public.anime (id) ON DELETE CASCADE,
  right_anime_id uuid NOT NULL REFERENCES public.anime (id) ON DELETE CASCADE,
  winner_anime_id uuid REFERENCES public.anime (id) ON DELETE CASCADE,
  comparison_context jsonb,
  skipped_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pairwise_comparisons_distinct_anime CHECK (left_anime_id <> right_anime_id),
  CONSTRAINT pairwise_comparisons_valid_winner CHECK (
    winner_anime_id IS NULL
    OR winner_anime_id = left_anime_id
    OR winner_anime_id = right_anime_id
  )
);

CREATE INDEX pairwise_comparisons_user_id_idx ON public.pairwise_comparisons (user_id);
CREATE INDEX pairwise_comparisons_user_created_idx ON public.pairwise_comparisons (user_id, created_at DESC);

CREATE TABLE public.derived_rankings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  anime_id uuid NOT NULL REFERENCES public.anime (id) ON DELETE CASCADE,
  rank integer NOT NULL,
  score numeric(10, 4) NOT NULL,
  confidence ranking_confidence NOT NULL DEFAULT 'low',
  comparison_count integer NOT NULL DEFAULT 0,
  algorithm_version text NOT NULL DEFAULT 'elo_v1',
  computed_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT derived_rankings_unique_user_anime_version UNIQUE (user_id, anime_id, algorithm_version),
  CONSTRAINT derived_rankings_rank_positive CHECK (rank > 0)
);

CREATE INDEX derived_rankings_user_version_rank_idx ON public.derived_rankings (user_id, algorithm_version, rank);

CREATE TABLE public.friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  status friendship_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  CONSTRAINT friendships_no_self CHECK (requester_id <> recipient_id)
);

CREATE UNIQUE INDEX friendships_active_pair_idx ON public.friendships (
  LEAST(requester_id, recipient_id),
  GREATEST(requester_id, recipient_id)
)
WHERE status IN ('pending', 'accepted');

CREATE INDEX friendships_requester_idx ON public.friendships (requester_id);
CREATE INDEX friendships_recipient_idx ON public.friendships (recipient_id);

CREATE TABLE public.user_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  event_type text NOT NULL,
  anime_id uuid REFERENCES public.anime (id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX user_events_user_id_created_idx ON public.user_events (user_id, created_at DESC);
CREATE INDEX user_events_event_type_idx ON public.user_events (event_type);
