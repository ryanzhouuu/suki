-- RLS for series layer

ALTER TABLE public.series ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anime_series_map ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.series_group_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pairwise_series_comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.derived_series_rankings ENABLE ROW LEVEL SECURITY;

CREATE POLICY series_select_all ON public.series
  FOR SELECT
  USING (true);

CREATE POLICY series_insert_authenticated ON public.series
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY series_update_authenticated ON public.series
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY anime_series_map_select_all ON public.anime_series_map
  FOR SELECT
  USING (true);

CREATE POLICY anime_series_map_insert_authenticated ON public.anime_series_map
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY anime_series_map_update_authenticated ON public.anime_series_map
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Overrides: read for authenticated; writes via service role / admin only in MVP
CREATE POLICY series_group_overrides_select_authenticated ON public.series_group_overrides
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY pairwise_series_comparisons_select_own ON public.pairwise_series_comparisons
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY pairwise_series_comparisons_insert_own ON public.pairwise_series_comparisons
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY pairwise_series_comparisons_update_own ON public.pairwise_series_comparisons
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY pairwise_series_comparisons_delete_own ON public.pairwise_series_comparisons
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY derived_series_rankings_select_all ON public.derived_series_rankings
  FOR SELECT
  USING (true);
