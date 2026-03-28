CREATE POLICY "Parents can view linked children profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.parent_child_links pcl
    JOIN public.profiles parent_p ON parent_p.id = pcl.parent_profile_id
    WHERE pcl.child_profile_id = profiles.id
    AND parent_p.user_id = auth.uid()
  )
);