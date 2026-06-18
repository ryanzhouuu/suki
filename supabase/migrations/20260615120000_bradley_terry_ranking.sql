-- Bradley-Terry ranking engine: per-series uncertainty + an atomic, race-free
-- write path for recomputed rankings.

-- Per-series uncertainty (variance proxy 1/H_ii from the BT Hessian diagonal).
-- Nullable: legacy elo_series_v1 rows carry no uncertainty.
ALTER TABLE public.derived_series_rankings
ADD COLUMN IF NOT EXISTS uncertainty numeric(12, 6);

-- Replace a user's rankings for one algorithm version atomically. A per-user
-- advisory lock serializes concurrent recomputes (import backfill + a manual
-- comparison + a +1 auto-complete can otherwise interleave the delete/insert),
-- and running both statements inside the function's transaction prevents the
-- window where the table is empty between delete and insert.
CREATE OR REPLACE FUNCTION public.replace_user_series_rankings(
  p_user_id uuid,
  p_algorithm_version text,
  p_rows jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext(p_user_id::text));

  DELETE FROM public.derived_series_rankings
  WHERE user_id = p_user_id
    AND algorithm_version = p_algorithm_version;

  INSERT INTO public.derived_series_rankings (
    user_id,
    series_id,
    rank,
    score,
    confidence,
    comparison_count,
    uncertainty,
    algorithm_version,
    computed_at
  )
  SELECT
    p_user_id,
    r.series_id,
    r.rank,
    r.score,
    r.confidence,
    r.comparison_count,
    r.uncertainty,
    p_algorithm_version,
    now()
  FROM jsonb_to_recordset(p_rows) AS r(
    series_id uuid,
    rank integer,
    score numeric,
    confidence ranking_confidence,
    comparison_count integer,
    uncertainty numeric
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.replace_user_series_rankings TO service_role;
