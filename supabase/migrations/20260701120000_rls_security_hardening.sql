-- Tighten RLS policies and function privileges where direct PostgREST access
-- (publishable/anon key) allowed more than the app intends.

-- replace_user_series_rankings is SECURITY DEFINER and takes an arbitrary
-- p_user_id with no internal auth.uid() check. Postgres grants EXECUTE to
-- PUBLIC by default, so the earlier `GRANT ... TO service_role` did NOT stop
-- anon/authenticated from calling it via /rest/v1/rpc and overwriting any
-- user's rankings. Restrict to service_role (the admin client) only.
REVOKE EXECUTE ON FUNCTION public.replace_user_series_rankings(uuid, text, jsonb)
  FROM public, anon, authenticated;

-- Friendships must be created as 'pending'; acceptance happens via the
-- recipient UPDATE policy. Without a status guard a user could INSERT
-- status='accepted' and unilaterally befriend anyone, bypassing friends-only
-- visibility on profiles / libraries / rankings.
DROP POLICY IF EXISTS friendships_insert_requester ON public.friendships;
CREATE POLICY friendships_insert_requester ON public.friendships
  FOR INSERT
  WITH CHECK (auth.uid() = requester_id AND status = 'pending');

-- Enforce the accepted-friendship rule at the DB instead of only in the
-- server action, so a direct PostgREST insert can't spam arbitrary inboxes.
DROP POLICY IF EXISTS anime_recommendations_insert_sender ON public.anime_recommendations;
CREATE POLICY anime_recommendations_insert_sender ON public.anime_recommendations
  FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND private.are_friends(sender_id, recipient_id)
  );

-- All series / anime_series_map writes go through the service-role admin
-- client (which bypasses RLS), so these authenticated write policies were
-- unused and let any signed-in user corrupt the shared catalog and franchise
-- grouping for every user. Drop them (service_role still bypasses RLS).
DROP POLICY IF EXISTS series_insert_authenticated ON public.series;
DROP POLICY IF EXISTS series_update_authenticated ON public.series;
DROP POLICY IF EXISTS anime_series_map_insert_authenticated ON public.anime_series_map;
DROP POLICY IF EXISTS anime_series_map_update_authenticated ON public.anime_series_map;

-- Public buckets serve images via public URL without RLS, so the broad
-- "publicly readable" SELECT policies only enabled listing/enumeration of every
-- user's files. Restrict SELECT to the owner's own folder. Rendering is
-- unaffected (getPublicUrl), and the owner-scoped .list() in the avatar/banner
-- server actions still works.
DROP POLICY IF EXISTS "Avatar images are publicly readable" ON storage.objects;
CREATE POLICY "Users can list own avatars"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
);

DROP POLICY IF EXISTS "Banner images are publicly readable" ON storage.objects;
CREATE POLICY "Users can list own banners"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'banners'
  AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
);

-- Pin the function's search_path (Supabase advisor 0011) and drop its accidental
-- PUBLIC EXECUTE; the original grant intended authenticated + service_role only.
ALTER FUNCTION public.match_anime_embeddings(vector, integer, uuid[], uuid[])
  SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.match_anime_embeddings(vector, integer, uuid[], uuid[])
  FROM public;
