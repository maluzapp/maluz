-- Função utilitária (cria primeiro)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- 1) XP por matéria
CREATE TABLE public.profile_subject_xp (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL,
  subject TEXT NOT NULL,
  xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (profile_id, subject)
);
CREATE INDEX idx_psxp_profile ON public.profile_subject_xp(profile_id);
ALTER TABLE public.profile_subject_xp ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own subject xp" ON public.profile_subject_xp
  FOR SELECT TO authenticated USING (owns_profile(profile_id) OR is_friend(profile_id));
CREATE POLICY "Users insert own subject xp" ON public.profile_subject_xp
  FOR INSERT TO authenticated WITH CHECK (owns_profile(profile_id));
CREATE POLICY "Users update own subject xp" ON public.profile_subject_xp
  FOR UPDATE TO authenticated USING (owns_profile(profile_id));

-- 2) Trilhas
CREATE TABLE public.learning_tracks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL,
  subject TEXT NOT NULL,
  school_year TEXT NOT NULL,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (profile_id, subject, school_year)
);
CREATE INDEX idx_lt_profile ON public.learning_tracks(profile_id);
ALTER TABLE public.learning_tracks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own tracks" ON public.learning_tracks
  FOR SELECT TO authenticated USING (owns_profile(profile_id) OR is_friend(profile_id));
CREATE POLICY "Users insert own tracks" ON public.learning_tracks
  FOR INSERT TO authenticated WITH CHECK (owns_profile(profile_id));
CREATE POLICY "Users update own tracks" ON public.learning_tracks
  FOR UPDATE TO authenticated USING (owns_profile(profile_id));
CREATE POLICY "Users delete own tracks" ON public.learning_tracks
  FOR DELETE TO authenticated USING (owns_profile(profile_id));

-- 3) Nós
CREATE TABLE public.track_nodes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  track_id UUID NOT NULL REFERENCES public.learning_tracks(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  topic TEXT NOT NULL,
  description TEXT,
  emoji TEXT NOT NULL DEFAULT '✨',
  status TEXT NOT NULL DEFAULT 'locked',
  best_score INTEGER,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (track_id, position)
);
CREATE INDEX idx_tn_track ON public.track_nodes(track_id);
ALTER TABLE public.track_nodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own track nodes" ON public.track_nodes
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM learning_tracks t WHERE t.id = track_nodes.track_id
      AND (owns_profile(t.profile_id) OR is_friend(t.profile_id)))
  );
CREATE POLICY "Users insert own track nodes" ON public.track_nodes
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM learning_tracks t WHERE t.id = track_nodes.track_id AND owns_profile(t.profile_id))
  );
CREATE POLICY "Users update own track nodes" ON public.track_nodes
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM learning_tracks t WHERE t.id = track_nodes.track_id AND owns_profile(t.profile_id))
  );
CREATE POLICY "Users delete own track nodes" ON public.track_nodes
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM learning_tracks t WHERE t.id = track_nodes.track_id AND owns_profile(t.profile_id))
  );

CREATE TRIGGER trg_psxp_updated BEFORE UPDATE ON public.profile_subject_xp
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_lt_updated BEFORE UPDATE ON public.learning_tracks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4) Função para concluir um nó atomicamente
CREATE OR REPLACE FUNCTION public.complete_track_node(
  _node_id UUID,
  _score INTEGER,
  _xp_earned INTEGER
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_track learning_tracks%ROWTYPE;
  v_node track_nodes%ROWTYPE;
  v_next_node_id UUID;
  v_new_xp INTEGER;
  v_new_level INTEGER := 1;
  v_remaining INTEGER;
  v_subject TEXT;
BEGIN
  SELECT * INTO v_node FROM track_nodes WHERE id = _node_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Node not found'; END IF;

  SELECT * INTO v_track FROM learning_tracks WHERE id = v_node.track_id;
  IF NOT owns_profile(v_track.profile_id) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  v_subject := v_track.subject;

  UPDATE track_nodes
  SET status = 'completed',
      best_score = GREATEST(COALESCE(best_score, 0), _score),
      completed_at = COALESCE(completed_at, now())
  WHERE id = _node_id;

  SELECT id INTO v_next_node_id FROM track_nodes
  WHERE track_id = v_track.id AND position = v_node.position + 1;
  IF v_next_node_id IS NOT NULL THEN
    UPDATE track_nodes SET status = 'available'
    WHERE id = v_next_node_id AND status = 'locked';
  END IF;

  INSERT INTO profile_subject_xp (profile_id, subject, xp, level)
  VALUES (v_track.profile_id, v_subject, _xp_earned, 1)
  ON CONFLICT (profile_id, subject) DO UPDATE
    SET xp = profile_subject_xp.xp + EXCLUDED.xp;

  SELECT xp INTO v_new_xp FROM profile_subject_xp
  WHERE profile_id = v_track.profile_id AND subject = v_subject;

  v_remaining := v_new_xp;
  WHILE v_remaining >= v_new_level * 100 LOOP
    v_remaining := v_remaining - v_new_level * 100;
    v_new_level := v_new_level + 1;
  END LOOP;

  UPDATE profile_subject_xp SET level = v_new_level
  WHERE profile_id = v_track.profile_id AND subject = v_subject;

  UPDATE profiles
  SET xp = (SELECT COALESCE(SUM(xp),0) FROM profile_subject_xp WHERE profile_id = v_track.profile_id)
  WHERE id = v_track.profile_id;

  RETURN jsonb_build_object(
    'subject_xp', v_new_xp,
    'subject_level', v_new_level,
    'next_node_id', v_next_node_id
  );
END;
$$;