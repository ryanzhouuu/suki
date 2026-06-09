-- Friend activity feed: per-user opt-out + an index to serve the feed query.

-- Lets a user hide their own activity from friends' feeds. Default true keeps
-- existing behaviour (activity visible to accepted friends).
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS show_activity_to_friends boolean NOT NULL DEFAULT true;

-- The feed reads recent events for a set of friend user_ids, newest first.
CREATE INDEX IF NOT EXISTS user_events_user_created_idx
ON public.user_events (user_id, created_at DESC);
