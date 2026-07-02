-- Close three broken-access-control gaps that let any signed-in user bypass the
-- app UI by calling PostgREST directly with the publishable (anon/authenticated)
-- key: (1) writing the shared anime catalog, (2) renaming their username, and
-- (3) pointing avatar/banner URLs at arbitrary attacker-controlled locations.

-- `anime` is a shared, world-readable catalog. These policies let ANY
-- authenticated user INSERT bogus rows or UPDATE any existing row (titles,
-- cover/banner image URLs, description) that is then rendered to every user.
-- All legitimate catalog writes go through the service-role admin client
-- (which bypasses RLS), so drop the authenticated write policies. SELECT
-- (anime_select_all) is unaffected.
DROP POLICY IF EXISTS anime_insert_authenticated ON public.anime;
DROP POLICY IF EXISTS anime_update_authenticated ON public.anime;

-- Usernames are assigned once at onboarding (INSERT) and act as public
-- profile handles / URL slugs, with the reserved-name list enforced only in the
-- server action. The own-row update policy plus the table-wide UPDATE grant let
-- a user rename themselves freely via PostgREST — squatting reserved handles or
-- impersonating others. A column-level REVOKE cannot carve a single column out of
-- a table-wide grant, so instead drop the table-wide UPDATE grant and re-grant
-- UPDATE on only the columns users may change. This makes username (and user_id /
-- created_at / updated_at) immutable to clients while profile edits still work.
REVOKE UPDATE ON public.profiles FROM anon, authenticated;
GRANT UPDATE (display_name, bio, avatar_url, banner_url, profile_visibility, show_activity_to_friends)
  ON public.profiles TO authenticated;

-- avatar_url / banner_url are free-form text the client can set to any
-- value. They are rendered in raw <img src> to every viewer of a public profile
-- and fetched server-side by the OG / share-card image generator, so an attacker
-- can point them at arbitrary hosts (view tracking, offensive content, or SSRF
-- to internal endpoints). Sanitize any existing off-bucket values, then constrain
-- both columns to the owner's own public storage folder. The upload server
-- actions already write exactly this shape (`<publicUrl>/<bucket>/<uid>/...`).
UPDATE public.profiles
SET avatar_url = NULL
WHERE avatar_url IS NOT NULL
  AND avatar_url !~ ('^https://[a-z0-9-]+\.supabase\.co/storage/v1/object/public/avatars/' || user_id::text || '/');

UPDATE public.profiles
SET banner_url = NULL
WHERE banner_url IS NOT NULL
  AND banner_url !~ ('^https://[a-z0-9-]+\.supabase\.co/storage/v1/object/public/banners/' || user_id::text || '/');

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_avatar_url_own_bucket CHECK (
    avatar_url IS NULL
    OR avatar_url ~ ('^https://[a-z0-9-]+\.supabase\.co/storage/v1/object/public/avatars/' || user_id::text || '/')
  );

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_banner_url_own_bucket CHECK (
    banner_url IS NULL
    OR banner_url ~ ('^https://[a-z0-9-]+\.supabase\.co/storage/v1/object/public/banners/' || user_id::text || '/')
  );
