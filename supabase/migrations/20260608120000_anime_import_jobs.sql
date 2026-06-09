-- Imports feature: per-user import jobs (staging + progress tracking).

CREATE TYPE public.import_source AS ENUM ('anilist', 'mal_xml', 'plain_text');

CREATE TYPE public.import_status AS ENUM (
  'pending',
  'parsing',
  'needs_review',
  'importing',
  'series_backfill',
  'done',
  'failed',
  'canceled'
);

CREATE TABLE public.anime_import_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  source public.import_source NOT NULL,
  status public.import_status NOT NULL DEFAULT 'pending',
  total integer NOT NULL DEFAULT 0,
  processed integer NOT NULL DEFAULT 0,
  matched integer NOT NULL DEFAULT 0,
  needs_review_count integer NOT NULL DEFAULT 0,
  unmatched integer NOT NULL DEFAULT 0,
  imported integer NOT NULL DEFAULT 0,
  skipped integer NOT NULL DEFAULT 0,
  source_input jsonb NOT NULL DEFAULT '{}',
  staged_rows jsonb NOT NULL DEFAULT '[]',
  backfill_anime_ids uuid[] NOT NULL DEFAULT '{}',
  retry_count integer NOT NULL DEFAULT 0,
  error text,
  heartbeat_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- One active import per user (avoids two backfills racing the same anime rows).
CREATE UNIQUE INDEX anime_import_jobs_one_active_per_user
  ON public.anime_import_jobs (user_id)
  WHERE status IN ('pending', 'parsing', 'needs_review', 'importing', 'series_backfill');

-- Cron/sweeper lookup for resuming stalled jobs.
CREATE INDEX anime_import_jobs_status_heartbeat_idx
  ON public.anime_import_jobs (status, heartbeat_at);

ALTER TABLE public.anime_import_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY anime_import_jobs_select_own ON public.anime_import_jobs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY anime_import_jobs_insert_own ON public.anime_import_jobs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY anime_import_jobs_update_own ON public.anime_import_jobs
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY anime_import_jobs_delete_own ON public.anime_import_jobs
  FOR DELETE
  USING (auth.uid() = user_id);
