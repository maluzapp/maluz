ALTER TABLE public.study_sessions ADD COLUMN IF NOT EXISTS exercises_data jsonb;
ALTER TABLE public.study_sessions ADD COLUMN IF NOT EXISTS answers_data jsonb;