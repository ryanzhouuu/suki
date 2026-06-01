-- Tighten friendship UPDATE policies (replace broad participant update).

DROP POLICY IF EXISTS friendships_update_participant ON public.friendships;

-- Recipients accept or decline pending incoming requests.
CREATE POLICY friendships_update_recipient_respond ON public.friendships
  FOR UPDATE
  USING (auth.uid() = recipient_id AND status = 'pending')
  WITH CHECK (
    auth.uid() = recipient_id
    AND status IN ('accepted', 'declined')
  );

-- Either party may re-open a declined row as a new outgoing pending request.
CREATE POLICY friendships_update_declined_reopen ON public.friendships
  FOR UPDATE
  USING (
    (auth.uid() = requester_id OR auth.uid() = recipient_id)
    AND status = 'declined'
  )
  WITH CHECK (
    auth.uid() = requester_id
    AND status = 'pending'
    AND requester_id <> recipient_id
  );
