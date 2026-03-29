
CREATE OR REPLACE FUNCTION public.get_profiles_by_ids(_ids uuid[])
RETURNS TABLE(id uuid, name text, avatar_emoji text, xp integer, level integer, streak_days integer, friend_code text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT p.id, p.name, p.avatar_emoji, p.xp, p.level, p.streak_days, p.friend_code
  FROM public.profiles p
  WHERE p.id = ANY(_ids);
$$;
