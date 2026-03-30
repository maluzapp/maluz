-- Persist spouse/family relationships between parent profiles
CREATE TABLE IF NOT EXISTS public.spouse_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL,
  spouse_profile_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT spouse_links_profiles_distinct CHECK (profile_id <> spouse_profile_id),
  CONSTRAINT spouse_links_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT spouse_links_spouse_profile_id_fkey FOREIGN KEY (spouse_profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT spouse_links_pair_unique UNIQUE (profile_id, spouse_profile_id)
);

ALTER TABLE public.spouse_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own spouse links"
ON public.spouse_links
FOR SELECT
TO authenticated
USING (public.owns_profile(profile_id) OR public.owns_profile(spouse_profile_id));

CREATE POLICY "Users can insert own spouse links"
ON public.spouse_links
FOR INSERT
TO authenticated
WITH CHECK (public.owns_profile(profile_id) OR public.owns_profile(spouse_profile_id));

CREATE POLICY "Users can delete own spouse links"
ON public.spouse_links
FOR DELETE
TO authenticated
USING (public.owns_profile(profile_id) OR public.owns_profile(spouse_profile_id));

CREATE INDEX IF NOT EXISTS idx_spouse_links_profile_id ON public.spouse_links(profile_id);
CREATE INDEX IF NOT EXISTS idx_spouse_links_spouse_profile_id ON public.spouse_links(spouse_profile_id);

CREATE OR REPLACE FUNCTION public.get_effective_plan_user_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH own_parent_profiles AS (
    SELECT id
    FROM public.profiles
    WHERE user_id = _user_id
      AND profile_type = 'parent'
  ),
  spouse_parent_profiles AS (
    SELECT CASE
      WHEN sl.profile_id IN (SELECT id FROM own_parent_profiles) THEN sl.spouse_profile_id
      ELSE sl.profile_id
    END AS spouse_profile_id
    FROM public.spouse_links sl
    WHERE sl.profile_id IN (SELECT id FROM own_parent_profiles)
       OR sl.spouse_profile_id IN (SELECT id FROM own_parent_profiles)
  )
  SELECT COALESCE(
    (
      SELECT us.user_id
      FROM public.user_subscriptions us
      JOIN public.subscription_plans sp ON sp.id = us.plan_id
      WHERE us.status = 'active'
        AND us.user_id IN (
          SELECT _user_id
          UNION
          SELECT p.user_id
          FROM public.profiles p
          WHERE p.id IN (SELECT spouse_profile_id FROM spouse_parent_profiles)
        )
      ORDER BY sp.max_profiles DESC, sp.daily_session_limit ASC, us.started_at DESC
      LIMIT 1
    ),
    _user_id
  );
$$;