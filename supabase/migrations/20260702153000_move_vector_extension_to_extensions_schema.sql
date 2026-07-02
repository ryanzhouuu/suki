-- Move pgvector out of public (Supabase security advisor: extension_in_public).
-- Extensions in `public` increase exposed database surface. Column types on
-- anime_embeddings.embedding / user_taste_profiles.embedding are unaffected
-- (Postgres resolves column types by OID, not by schema-qualified name), but
-- match_anime_embeddings() resolves the `vector` type name and the `<=>`
-- operator at each call via its pinned search_path, so that path must gain
-- the extensions schema or it stops finding them after the move.

create schema if not exists extensions;
grant usage on schema extensions to postgres, anon, authenticated, service_role;

alter extension vector set schema extensions;

alter function public.match_anime_embeddings(vector, integer, uuid[], uuid[])
  set search_path = public, extensions;
