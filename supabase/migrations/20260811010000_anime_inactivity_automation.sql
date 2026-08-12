CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
ALTER TABLE public.profiles
  ADD COLUMN auto_pause_days integer NOT NULL DEFAULT 30,
  ADD COLUMN drop_prompt_days integer NOT NULL DEFAULT 30,
  ADD CONSTRAINT profiles_auto_pause_days_range
    CHECK (auto_pause_days BETWEEN 7 AND 365),
  ADD CONSTRAINT profiles_drop_prompt_days_range
    CHECK (drop_prompt_days BETWEEN 7 AND 365);
GRANT UPDATE (auto_pause_days, drop_prompt_days)
  ON public.profiles TO authenticated;
ALTER TABLE public.user_anime_entries
  ADD COLUMN last_progress_at timestamptz,
  ADD COLUMN watching_since_at timestamptz,
  ADD COLUMN paused_at timestamptz,
  ADD COLUMN drop_prompt_snoozed_at timestamptz,
  ADD COLUMN drop_prompt_due_at timestamptz;
UPDATE public.user_anime_entries AS entry
SET
  last_progress_at = entry.updated_at,
  watching_since_at = CASE
    WHEN entry.status = 'watching' THEN entry.updated_at
    ELSE NULL
  END,
  paused_at = CASE
    WHEN entry.status = 'paused' THEN entry.updated_at
    ELSE NULL
  END,
  drop_prompt_due_at = CASE
    WHEN entry.status = 'paused'
      THEN entry.updated_at + make_interval(days => profile.drop_prompt_days)
    ELSE NULL
  END
FROM public.profiles AS profile
WHERE profile.user_id = entry.user_id;
UPDATE public.user_anime_entries
SET last_progress_at = updated_at
WHERE last_progress_at IS NULL;
ALTER TABLE public.user_anime_entries
  ALTER COLUMN last_progress_at SET NOT NULL,
  ALTER COLUMN last_progress_at SET DEFAULT now();
CREATE INDEX user_anime_entries_watching_inactivity_idx
  ON public.user_anime_entries (
    GREATEST(last_progress_at, watching_since_at)
  )
  WHERE status = 'watching';
CREATE INDEX user_anime_entries_drop_prompt_due_idx
  ON public.user_anime_entries (user_id, drop_prompt_due_at)
  WHERE status = 'paused' AND drop_prompt_due_at IS NOT NULL;
CREATE OR REPLACE FUNCTION public.maintain_anime_inactivity_state()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  reminder_days integer;
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.last_progress_at = COALESCE(NEW.created_at, now());
    NEW.drop_prompt_snoozed_at = NULL;
    IF NEW.status = 'watching' THEN
      NEW.watching_since_at = COALESCE(NEW.created_at, now());
      NEW.paused_at = NULL;
      NEW.drop_prompt_due_at = NULL;
    ELSIF NEW.status = 'paused' THEN
      SELECT profile.drop_prompt_days
      INTO reminder_days
      FROM public.profiles AS profile
      WHERE profile.user_id = NEW.user_id;
      NEW.watching_since_at = NULL;
      NEW.paused_at = COALESCE(NEW.created_at, now());
      NEW.drop_prompt_due_at = NEW.paused_at
        + make_interval(days => COALESCE(reminder_days, 30));
    ELSE
      NEW.watching_since_at = NULL;
      NEW.paused_at = NULL;
      NEW.drop_prompt_due_at = NULL;
    END IF;
    RETURN NEW;
  END IF;
  IF NEW.progress_episodes > OLD.progress_episodes THEN
    NEW.last_progress_at = now();
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.drop_prompt_snoozed_at = NULL;
    IF NEW.status = 'watching' THEN
      NEW.watching_since_at = now();
      NEW.paused_at = NULL;
      NEW.drop_prompt_due_at = NULL;
    ELSIF NEW.status = 'paused' THEN
      SELECT profile.drop_prompt_days
      INTO reminder_days
      FROM public.profiles AS profile
      WHERE profile.user_id = NEW.user_id;
      NEW.watching_since_at = NULL;
      NEW.paused_at = now();
      NEW.drop_prompt_due_at = now()
        + make_interval(days => COALESCE(reminder_days, 30));
    ELSE
      NEW.watching_since_at = NULL;
      NEW.paused_at = NULL;
      NEW.drop_prompt_due_at = NULL;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER user_anime_entries_inactivity_state
BEFORE INSERT OR UPDATE ON public.user_anime_entries
FOR EACH ROW
EXECUTE FUNCTION public.maintain_anime_inactivity_state();
REVOKE UPDATE ON public.user_anime_entries FROM authenticated;
GRANT UPDATE (
  status,
  progress_episodes,
  rewatch_count,
  priority,
  notes,
  personal_score,
  started_at,
  completed_at
) ON public.user_anime_entries TO authenticated;
CREATE OR REPLACE FUNCTION public.run_anime_inactivity_automation()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  paused_count integer;
BEGIN
  UPDATE public.user_anime_entries AS entry
  SET drop_prompt_due_at =
    COALESCE(entry.drop_prompt_snoozed_at, entry.paused_at)
    + make_interval(days => profile.drop_prompt_days)
  FROM public.profiles AS profile
  WHERE entry.user_id = profile.user_id
    AND entry.status = 'paused'
    AND entry.paused_at IS NOT NULL
    AND entry.drop_prompt_due_at IS DISTINCT FROM (
      COALESCE(entry.drop_prompt_snoozed_at, entry.paused_at)
      + make_interval(days => profile.drop_prompt_days)
    );
  WITH newly_paused AS (
    UPDATE public.user_anime_entries AS entry
    SET status = 'paused'
    FROM public.profiles AS profile
    WHERE entry.user_id = profile.user_id
      AND entry.status = 'watching'
      AND GREATEST(entry.last_progress_at, entry.watching_since_at)
        <= now() - make_interval(days => profile.auto_pause_days)
    RETURNING entry.user_id, entry.anime_id
  ), logged_events AS (
    INSERT INTO public.user_events (user_id, event_type, anime_id, metadata)
    SELECT
      newly_paused.user_id,
      'status_changed',
      newly_paused.anime_id,
      jsonb_build_object(
        'from', 'watching',
        'to', 'paused',
        'mutationSource', 'automation'
      )
    FROM newly_paused
  )
  SELECT count(*) INTO paused_count FROM newly_paused;
  RETURN paused_count;
END;
$$;
REVOKE ALL ON FUNCTION public.run_anime_inactivity_automation()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.run_anime_inactivity_automation()
  TO postgres, service_role;
CREATE OR REPLACE FUNCTION public.resolve_anime_inactivity_prompt(
  p_entry_id uuid,
  p_should_drop boolean
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  resolved_anime_id uuid;
BEGIN
  IF p_should_drop THEN
    UPDATE public.user_anime_entries AS entry
    SET status = 'dropped'
    WHERE entry.id = p_entry_id
      AND entry.user_id = (SELECT auth.uid())
      AND entry.status = 'paused'
      AND entry.drop_prompt_due_at <= now()
    RETURNING entry.anime_id INTO resolved_anime_id;
    IF resolved_anime_id IS NOT NULL THEN
      INSERT INTO public.user_events (user_id, event_type, anime_id, metadata)
      VALUES (
        (SELECT auth.uid()),
        'status_changed',
        resolved_anime_id,
        jsonb_build_object(
          'from', 'paused',
          'to', 'dropped',
          'mutationSource', 'inactivity_prompt'
        )
      );
    END IF;
  ELSE
    UPDATE public.user_anime_entries AS entry
    SET
      drop_prompt_snoozed_at = now(),
      drop_prompt_due_at = now()
        + make_interval(days => profile.drop_prompt_days)
    FROM public.profiles AS profile
    WHERE entry.id = p_entry_id
      AND entry.user_id = (SELECT auth.uid())
      AND profile.user_id = entry.user_id
      AND entry.status = 'paused'
      AND entry.drop_prompt_due_at <= now()
    RETURNING entry.anime_id INTO resolved_anime_id;
    IF resolved_anime_id IS NOT NULL THEN
      INSERT INTO public.user_events (user_id, event_type, anime_id, metadata)
      VALUES (
        (SELECT auth.uid()),
        'inactivity_prompt_snoozed',
        resolved_anime_id,
        jsonb_build_object('mutationSource', 'user')
      );
    END IF;
  END IF;
  RETURN resolved_anime_id IS NOT NULL;
END;
$$;
REVOKE ALL ON FUNCTION public.resolve_anime_inactivity_prompt(uuid, boolean)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_anime_inactivity_prompt(uuid, boolean)
  TO authenticated, service_role;
SELECT cron.schedule(
  'anime-inactivity-daily',
  '15 4 * * *',
  'SELECT public.run_anime_inactivity_automation();'
);
