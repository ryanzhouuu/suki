-- One comparison row per user per unordered anime pair

-- Normalize existing rows to canonical order (left uuid < right uuid)
UPDATE public.pairwise_comparisons
SET
  left_anime_id = LEAST(left_anime_id, right_anime_id),
  right_anime_id = GREATEST(left_anime_id, right_anime_id)
WHERE left_anime_id > right_anime_id;

-- Remove duplicate pairs, keeping the most recent row
DELETE FROM public.pairwise_comparisons AS older
USING public.pairwise_comparisons AS newer
WHERE older.user_id = newer.user_id
  AND older.left_anime_id = newer.left_anime_id
  AND older.right_anime_id = newer.right_anime_id
  AND older.id <> newer.id
  AND (
    older.created_at < newer.created_at
    OR (older.created_at = newer.created_at AND older.id::text < newer.id::text)
  );

ALTER TABLE public.pairwise_comparisons
  ADD CONSTRAINT pairwise_comparisons_canonical_order
  CHECK (left_anime_id < right_anime_id);

CREATE UNIQUE INDEX pairwise_comparisons_user_pair_unique
  ON public.pairwise_comparisons (user_id, left_anime_id, right_anime_id);

CREATE POLICY pairwise_comparisons_update_own ON public.pairwise_comparisons
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
