
-- Create reactions table for emoji reactions on activities
CREATE TABLE public.reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL,
  target_type text NOT NULL, -- 'session' or 'challenge'
  target_id uuid NOT NULL,
  emoji text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(profile_id, target_type, target_id, emoji)
);

-- Enable RLS
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view reactions on sessions/challenges they can see
CREATE POLICY "Users can view reactions"
  ON public.reactions FOR SELECT
  TO authenticated
  USING (true);

-- Users can insert their own reactions
CREATE POLICY "Users can insert own reactions"
  ON public.reactions FOR INSERT
  TO authenticated
  WITH CHECK (owns_profile(profile_id));

-- Users can delete their own reactions
CREATE POLICY "Users can delete own reactions"
  ON public.reactions FOR DELETE
  TO authenticated
  USING (owns_profile(profile_id));

-- Enable realtime for reactions
ALTER PUBLICATION supabase_realtime ADD TABLE public.reactions;
