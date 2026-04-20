CREATE OR REPLACE FUNCTION public.get_global_ranking(_limit integer DEFAULT 100, _school_year text DEFAULT NULL)
RETURNS TABLE(
  id uuid,
  name text,
  avatar_emoji text,
  xp integer,
  level integer,
  streak_days integer,
  school_year text,
  rank bigint
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    p.id,
    split_part(p.name, ' ', 1) || CASE
      WHEN position(' ' in p.name) > 0
      THEN ' ' || upper(left(split_part(p.name, ' ', 2), 1)) || '.'
      ELSE ''
    END AS name,
    p.avatar_emoji,
    p.xp,
    p.level,
    p.streak_days,
    p.school_year,
    ROW_NUMBER() OVER (ORDER BY p.xp DESC, p.level DESC, p.streak_days DESC) AS rank
  FROM public.profiles p
  WHERE p.profile_type = 'child'
    AND p.xp > 0
    AND (_school_year IS NULL OR p.school_year = _school_year)
  ORDER BY p.xp DESC, p.level DESC, p.streak_days DESC
  LIMIT _limit;
$$;

CREATE OR REPLACE FUNCTION public.get_my_global_rank(_profile_id uuid)
RETURNS TABLE(rank bigint, total bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH ranked AS (
    SELECT
      id,
      ROW_NUMBER() OVER (ORDER BY xp DESC, level DESC, streak_days DESC) AS r
    FROM public.profiles
    WHERE profile_type = 'child' AND xp > 0
  )
  SELECT
    COALESCE((SELECT r FROM ranked WHERE id = _profile_id), 0::bigint) AS rank,
    (SELECT COUNT(*) FROM ranked) AS total;
$$;

GRANT EXECUTE ON FUNCTION public.get_global_ranking(integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_global_rank(uuid) TO authenticated;