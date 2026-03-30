CREATE POLICY "Parents can delete own challenges"
ON public.challenges
FOR DELETE
TO authenticated
USING (public.owns_profile(parent_profile_id));