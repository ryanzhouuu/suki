-- Directed friend-to-friend anime recommendations.

CREATE TYPE public.friend_recommendation_status AS ENUM (
  'pending',
  'added',
  'dismissed'
);

CREATE TABLE public.anime_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  anime_id uuid NOT NULL REFERENCES public.anime (id) ON DELETE CASCADE,
  note text,
  status public.friend_recommendation_status NOT NULL DEFAULT 'pending',
  seen_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  CONSTRAINT anime_recommendations_no_self CHECK (sender_id <> recipient_id)
);

-- One pending recommendation of a given title per sender→recipient pair.
CREATE UNIQUE INDEX anime_recommendations_unique_pending
ON public.anime_recommendations (sender_id, recipient_id, anime_id)
WHERE status = 'pending';

-- Serves the recipient inbox query (status filter, newest first).
CREATE INDEX anime_recommendations_recipient_idx
ON public.anime_recommendations (recipient_id, status, created_at DESC);

ALTER TABLE public.anime_recommendations ENABLE ROW LEVEL SECURITY;

-- Sender and recipient can both read the row.
CREATE POLICY anime_recommendations_select_participant
ON public.anime_recommendations
FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- Sender creates the row; accepted-friendship is enforced in the server action.
CREATE POLICY anime_recommendations_insert_sender
ON public.anime_recommendations
FOR INSERT
WITH CHECK (auth.uid() = sender_id);

-- Recipient updates status (add/dismiss) and seen_at.
CREATE POLICY anime_recommendations_update_recipient
ON public.anime_recommendations
FOR UPDATE
USING (auth.uid() = recipient_id)
WITH CHECK (auth.uid() = recipient_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.anime_recommendations
TO authenticated;
GRANT ALL ON public.anime_recommendations TO postgres, service_role;
