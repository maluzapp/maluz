
-- Add friend_code to profiles for friend discovery
ALTER TABLE public.profiles ADD COLUMN friend_code text UNIQUE;

-- Create friendships table
CREATE TABLE public.friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (requester_profile_id, target_profile_id)
);

-- Enable RLS
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- Users can see friendships they're part of
CREATE POLICY "Users can view own friendships" ON public.friendships
  FOR SELECT TO authenticated
  USING (owns_profile(requester_profile_id) OR owns_profile(target_profile_id));

-- Users can send friend requests from their own profiles
CREATE POLICY "Users can insert friend requests" ON public.friendships
  FOR INSERT TO authenticated
  WITH CHECK (owns_profile(requester_profile_id));

-- Users can update friendships targeted at them (accept/reject)
CREATE POLICY "Users can update targeted friendships" ON public.friendships
  FOR UPDATE TO authenticated
  USING (owns_profile(target_profile_id));

-- Users can delete friendships they're part of
CREATE POLICY "Users can delete own friendships" ON public.friendships
  FOR DELETE TO authenticated
  USING (owns_profile(requester_profile_id) OR owns_profile(target_profile_id));

-- Function to generate unique friend codes
CREATE OR REPLACE FUNCTION public.generate_friend_code()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  new_code text;
  done boolean;
BEGIN
  done := false;
  WHILE NOT done LOOP
    new_code := upper(substr(md5(random()::text), 1, 6));
    BEGIN
      NEW.friend_code := new_code;
      done := true;
    EXCEPTION WHEN unique_violation THEN
      done := false;
    END;
  END LOOP;
  RETURN NEW;
END;
$$;

-- Auto-generate friend code on profile creation
CREATE TRIGGER set_friend_code
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  WHEN (NEW.friend_code IS NULL)
  EXECUTE FUNCTION public.generate_friend_code();
