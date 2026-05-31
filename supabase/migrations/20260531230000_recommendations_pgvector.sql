-- ML recommendations: pgvector embeddings, taste profiles, cached recommendations

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE public.anime_embeddings (
  anime_id uuid PRIMARY KEY REFERENCES public.anime (id) ON DELETE CASCADE,
  embedding_model text NOT NULL,
  embedding vector(1536) NOT NULL,
  metadata_text text NOT NULL,
  metadata_hash text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX anime_embeddings_embedding_idx ON public.anime_embeddings
  USING hnsw (embedding vector_cosine_ops);

CREATE TABLE public.user_taste_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  embedding_model text NOT NULL,
  embedding vector(1536) NOT NULL,
  profile_text text NOT NULL,
  input_hash text NOT NULL,
  algorithm_version text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.recommendation_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  algorithm_version text NOT NULL,
  embedding_model text NOT NULL,
  input_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX recommendation_runs_user_created_idx
  ON public.recommendation_runs (user_id, created_at DESC);

CREATE TABLE public.recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES public.recommendation_runs (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  anime_id uuid NOT NULL REFERENCES public.anime (id) ON DELETE CASCADE,
  series_id uuid REFERENCES public.series (id) ON DELETE SET NULL,
  similarity_score numeric(10, 6) NOT NULL,
  rerank_score numeric(10, 6) NOT NULL,
  final_score numeric(10, 6) NOT NULL,
  reason_codes text[] NOT NULL DEFAULT '{}',
  explanation text NOT NULL,
  algorithm_version text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX recommendations_user_score_idx
  ON public.recommendations (user_id, final_score DESC);

CREATE INDEX recommendations_run_id_idx ON public.recommendations (run_id);

-- Cosine similarity search over anime embeddings with exclusions
CREATE OR REPLACE FUNCTION public.match_anime_embeddings(
  query_embedding vector(1536),
  match_count integer DEFAULT 50,
  excluded_anime_ids uuid[] DEFAULT '{}',
  excluded_series_ids uuid[] DEFAULT '{}'
)
RETURNS TABLE (
  anime_id uuid,
  similarity double precision
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    ae.anime_id,
    (1 - (ae.embedding <=> query_embedding))::double precision AS similarity
  FROM public.anime_embeddings ae
  LEFT JOIN public.anime_series_map asm ON asm.anime_id = ae.anime_id
  WHERE
    NOT (ae.anime_id = ANY (COALESCE(excluded_anime_ids, '{}'::uuid[])))
    AND (
      asm.series_id IS NULL
      OR NOT (asm.series_id = ANY (COALESCE(excluded_series_ids, '{}'::uuid[])))
    )
  ORDER BY ae.embedding <=> query_embedding
  LIMIT GREATEST(match_count, 1);
$$;

ALTER TABLE public.anime_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_taste_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY anime_embeddings_select_all ON public.anime_embeddings
  FOR SELECT
  USING (true);

CREATE POLICY user_taste_profiles_select_own ON public.user_taste_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY recommendation_runs_select_own ON public.recommendation_runs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY recommendations_select_own ON public.recommendations
  FOR SELECT
  USING (auth.uid() = user_id);

GRANT SELECT ON public.anime_embeddings TO anon, authenticated;
GRANT SELECT ON public.user_taste_profiles TO authenticated;
GRANT SELECT ON public.recommendation_runs TO authenticated;
GRANT SELECT ON public.recommendations TO authenticated;

GRANT ALL ON public.anime_embeddings TO service_role;
GRANT ALL ON public.user_taste_profiles TO service_role;
GRANT ALL ON public.recommendation_runs TO service_role;
GRANT ALL ON public.recommendations TO service_role;

GRANT EXECUTE ON FUNCTION public.match_anime_embeddings TO authenticated, service_role;
