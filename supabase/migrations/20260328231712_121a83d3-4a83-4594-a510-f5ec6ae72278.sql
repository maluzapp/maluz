DROP POLICY IF EXISTS "Users can view own profiles" ON public.profiles;
DROP POLICY IF EXISTS "Parents can view linked children profiles" ON public.profiles;

CREATE OR REPLACE FUNCTION public.can_view_profile(_profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = _profile_id
      AND p.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.parent_child_links pcl
    JOIN public.profiles parent_p ON parent_p.id = pcl.parent_profile_id
    WHERE pcl.child_profile_id = _profile_id
      AND parent_p.user_id = auth.uid()
  );
$$;

CREATE POLICY "Users can view accessible profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.can_view_profile(id));