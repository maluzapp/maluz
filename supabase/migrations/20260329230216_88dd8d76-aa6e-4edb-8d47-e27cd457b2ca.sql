
CREATE TABLE public.challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_profile_id uuid NOT NULL,
  child_profile_id uuid NOT NULL,
  subject text NOT NULL,
  topic text NOT NULL,
  year text NOT NULL,
  exercises_data jsonb,
  answers_data jsonb,
  score integer,
  total integer DEFAULT 10,
  status text NOT NULL DEFAULT 'pending',
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  message text,
  CONSTRAINT fk_parent FOREIGN KEY (parent_profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT fk_child FOREIGN KEY (child_profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can insert challenges"
ON public.challenges FOR INSERT TO authenticated
WITH CHECK (owns_profile(parent_profile_id));

CREATE POLICY "Users can view own challenges"
ON public.challenges FOR SELECT TO authenticated
USING (owns_profile(parent_profile_id) OR owns_profile(child_profile_id));

CREATE POLICY "Children can update their challenges"
ON public.challenges FOR UPDATE TO authenticated
USING (owns_profile(child_profile_id));

ALTER PUBLICATION supabase_realtime ADD TABLE public.challenges;
