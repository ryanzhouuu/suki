-- Request-time recommendation metadata (ephemeral per run, not user profile)

ALTER TABLE public.recommendation_runs
  ADD COLUMN IF NOT EXISTS request_prefs jsonb,
  ADD COLUMN IF NOT EXISTS sampling_seed text;
