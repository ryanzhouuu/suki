-- Row Level Security (see docs/design.md §14, §19)

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anime ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_anime_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pairwise_comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.derived_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_select_public ON public.profiles
  FOR SELECT
  USING (
    profile_visibility = 'public'
    OR auth.uid() = user_id
  );

CREATE POLICY profiles_insert_own ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY profiles_delete_own ON public.profiles
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY anime_select_all ON public.anime
  FOR SELECT
  USING (true);

CREATE POLICY anime_insert_authenticated ON public.anime
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY anime_update_authenticated ON public.anime
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY user_anime_entries_select_all ON public.user_anime_entries
  FOR SELECT
  USING (true);

CREATE POLICY user_anime_entries_insert_own ON public.user_anime_entries
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_anime_entries_update_own ON public.user_anime_entries
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_anime_entries_delete_own ON public.user_anime_entries
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY pairwise_comparisons_select_own ON public.pairwise_comparisons
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY pairwise_comparisons_insert_own ON public.pairwise_comparisons
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY pairwise_comparisons_delete_own ON public.pairwise_comparisons
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY derived_rankings_select_all ON public.derived_rankings
  FOR SELECT
  USING (true);

CREATE POLICY friendships_select_participant ON public.friendships
  FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

CREATE POLICY friendships_insert_requester ON public.friendships
  FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY friendships_update_participant ON public.friendships
  FOR UPDATE
  USING (auth.uid() = requester_id OR auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = requester_id OR auth.uid() = recipient_id);

CREATE POLICY friendships_delete_participant ON public.friendships
  FOR DELETE
  USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

CREATE POLICY user_events_select_own ON public.user_events
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY user_events_insert_own ON public.user_events
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_events_delete_own ON public.user_events
  FOR DELETE
  USING (auth.uid() = user_id);
