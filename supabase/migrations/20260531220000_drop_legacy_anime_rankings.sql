-- Remove season-level ranking tables (replaced by series-level rankings)

DROP TABLE IF EXISTS public.derived_rankings;
DROP TABLE IF EXISTS public.pairwise_comparisons;

-- Ensure API roles can access new series tables (created after grant migration)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.series TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.anime_series_map TO authenticated, service_role;
GRANT SELECT ON public.series TO anon;
GRANT SELECT ON public.anime_series_map TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pairwise_series_comparisons TO authenticated, service_role;
GRANT SELECT ON public.pairwise_series_comparisons TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.derived_series_rankings TO authenticated, service_role;
GRANT SELECT ON public.derived_series_rankings TO anon;
GRANT SELECT ON public.series_group_overrides TO authenticated, service_role;
