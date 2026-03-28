
-- Profile type: child or parent
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_type text NOT NULL DEFAULT 'child';

-- Parent-child links table
CREATE TABLE public.parent_child_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  child_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(parent_profile_id, child_profile_id)
);

ALTER TABLE public.parent_child_links ENABLE ROW LEVEL SECURITY;

-- Invite codes table
CREATE TABLE public.invite_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  used boolean NOT NULL DEFAULT false,
  used_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours')
);

ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;

-- RLS: parent_child_links
CREATE POLICY "Users can view own links" ON public.parent_child_links
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = parent_profile_id AND user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = child_profile_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can insert own links" ON public.parent_child_links
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = parent_profile_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can delete own links" ON public.parent_child_links
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = parent_profile_id AND user_id = auth.uid())
  );

-- RLS: invite_codes
CREATE POLICY "Profile owners can manage invite codes" ON public.invite_codes
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = profile_id AND user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = profile_id AND user_id = auth.uid())
  );

CREATE POLICY "Anyone authenticated can read valid codes" ON public.invite_codes
  FOR SELECT TO authenticated
  USING (true);
