-- Tighten RLS so direct Supabase (publishable/anon key) reads of libraries and
-- rankings match the app's profile-visibility gating (see src/app/u/[username]/page.tsx
-- `canSeeFull`). Previously user_anime_entries and derived_series_rankings used
-- `USING (true)`, so anyone could read any user's library/rankings via PostgREST
-- regardless of profile_visibility. We gate reads on owner / public / friends.

-- Helpers live in a `private` schema that PostgREST does NOT expose, so they
-- can't be called as `/rest/v1/rpc/...` endpoints (Supabase advisors 0028/0029).
-- Policy evaluation still resolves them: anon/authenticated get schema USAGE and
-- inherit the default PUBLIC EXECUTE on the functions.
CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO anon, authenticated, service_role;

-- Accepted-friendship test. SECURITY DEFINER so it can read friendships without
-- being subject to that table's RLS (and to avoid policy recursion). Empty
-- search_path + fully-qualified names per Supabase function hardening guidance.
CREATE OR REPLACE FUNCTION private.are_friends(user_a uuid, user_b uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.friendships f
    WHERE f.status = 'accepted'
      AND (
        (f.requester_id = user_a AND f.recipient_id = user_b)
        OR (f.requester_id = user_b AND f.recipient_id = user_a)
      )
  );
$$;

-- Whether `viewer` may see `profile_user`'s data: own, public, or a friend of a
-- friends_only profile. A null viewer (anon) only sees public profiles.
CREATE OR REPLACE FUNCTION private.profile_is_visible_to(profile_user uuid, viewer uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.user_id = profile_user
      AND (
        p.profile_visibility = 'public'
        OR profile_user = viewer
        OR (
          p.profile_visibility = 'friends_only'
          AND private.are_friends(profile_user, viewer)
        )
      )
  );
$$;

-- profiles: allow friends to read friends_only profiles (public/own as before).
-- Without this the app can't even load a friends_only profile row for a friend,
-- so the entries/rankings policies below would never be reachable for them.
DROP POLICY IF EXISTS profiles_select_public ON public.profiles;
CREATE POLICY profiles_select_visible ON public.profiles
  FOR SELECT
  USING (
    profile_visibility = 'public'
    OR auth.uid() = user_id
    OR (profile_visibility = 'friends_only' AND private.are_friends(user_id, auth.uid()))
  );

-- user_anime_entries: was USING (true). Gate on the owner's profile visibility.
DROP POLICY IF EXISTS user_anime_entries_select_all ON public.user_anime_entries;
CREATE POLICY user_anime_entries_select_visible ON public.user_anime_entries
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR private.profile_is_visible_to(user_id, auth.uid())
  );

-- derived_series_rankings: was USING (true). Same visibility gating.
DROP POLICY IF EXISTS derived_series_rankings_select_all ON public.derived_series_rankings;
CREATE POLICY derived_series_rankings_select_visible ON public.derived_series_rankings
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR private.profile_is_visible_to(user_id, auth.uid())
  );
