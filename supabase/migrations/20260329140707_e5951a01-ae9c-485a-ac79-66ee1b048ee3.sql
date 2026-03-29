
-- Allow friends to view each other's study sessions
CREATE OR REPLACE FUNCTION public.is_friend(_profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.friendships f
    JOIN public.profiles p ON (
      (f.requester_profile_id = _profile_id AND p.id = f.target_profile_id AND p.user_id = auth.uid())
      OR
      (f.target_profile_id = _profile_id AND p.id = f.requester_profile_id AND p.user_id = auth.uid())
    )
    WHERE f.status = 'accepted'
  );
$$;

-- Update study_sessions SELECT policy to include friends
DROP POLICY IF EXISTS "Users can view own sessions" ON public.study_sessions;
CREATE POLICY "Users can view own or friend sessions" ON public.study_sessions
  FOR SELECT TO authenticated
  USING (owns_profile(profile_id) OR is_friend(profile_id));

-- Allow friends to view each other's profiles (for search/friend display)
DROP POLICY IF EXISTS "Users can view accessible profiles" ON public.profiles;
CREATE POLICY "Users can view accessible profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (can_view_profile(id) OR is_friend(id));
