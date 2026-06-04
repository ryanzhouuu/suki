-- Phase 3: rich library sorting indexes + structured recommendation explanation details

ALTER TABLE public.recommendations
  ADD COLUMN IF NOT EXISTS explanation_details jsonb NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS user_anime_entries_user_priority_idx
  ON public.user_anime_entries (user_id, priority, created_at DESC)
  WHERE status = 'plan_to_watch';

CREATE INDEX IF NOT EXISTS user_anime_entries_user_completed_at_idx
  ON public.user_anime_entries (user_id, completed_at DESC)
  WHERE status = 'completed';

CREATE INDEX IF NOT EXISTS user_anime_entries_user_personal_score_idx
  ON public.user_anime_entries (user_id, personal_score DESC)
  WHERE personal_score IS NOT NULL;
