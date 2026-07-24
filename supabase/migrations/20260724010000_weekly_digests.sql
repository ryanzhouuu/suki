ALTER TABLE public.profiles
  ADD COLUMN timezone text;

REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (
  display_name,
  bio,
  avatar_url,
  banner_url,
  profile_visibility,
  show_activity_to_friends,
  timezone
) ON public.profiles TO authenticated;

CREATE TABLE public.weekly_digests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  week_end date NOT NULL,
  timezone text NOT NULL,
  content_version integer NOT NULL,
  summary jsonb NOT NULL,
  generated_at timestamptz NOT NULL DEFAULT now(),
  viewed_at timestamptz,
  dismissed_at timestamptz,
  CONSTRAINT weekly_digests_week_order CHECK (week_end > week_start),
  CONSTRAINT weekly_digests_user_week_unique UNIQUE (user_id, week_start)
);

CREATE INDEX weekly_digests_user_week_idx
  ON public.weekly_digests (user_id, week_start DESC);

ALTER TABLE public.weekly_digests ENABLE ROW LEVEL SECURITY;

CREATE POLICY weekly_digests_select_own ON public.weekly_digests
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY weekly_digests_insert_own ON public.weekly_digests
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY weekly_digests_update_own ON public.weekly_digests
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

GRANT SELECT, INSERT, UPDATE ON public.weekly_digests TO authenticated;
