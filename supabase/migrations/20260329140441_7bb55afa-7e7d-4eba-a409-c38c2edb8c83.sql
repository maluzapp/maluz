
-- Fix search_path on generate_friend_code function
CREATE OR REPLACE FUNCTION public.generate_friend_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
