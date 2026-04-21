-- Add last_active_at to profiles to track real usage (not just login)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS last_active_at timestamp with time zone;

CREATE INDEX IF NOT EXISTS idx_profiles_last_active_at ON public.profiles(last_active_at DESC);

-- RPC for users to update their own last_active_at (throttled in client)
CREATE OR REPLACE FUNCTION public.touch_profile_activity()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET last_active_at = now()
  WHERE user_id = auth.uid();
END;
$$;

GRANT EXECUTE ON FUNCTION public.touch_profile_activity() TO authenticated;