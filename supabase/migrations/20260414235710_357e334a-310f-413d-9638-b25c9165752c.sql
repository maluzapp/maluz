
-- Notification templates table
CREATE TABLE public.notification_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  icon_emoji text NOT NULL DEFAULT '🔔',
  category text NOT NULL DEFAULT 'custom',
  trigger_type text NOT NULL DEFAULT 'manual',
  inactive_days integer DEFAULT NULL,
  is_active boolean NOT NULL DEFAULT true,
  channel text NOT NULL DEFAULT 'push',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage notification_templates" ON public.notification_templates
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can read active templates" ON public.notification_templates
  FOR SELECT TO authenticated
  USING (is_active = true);

-- Push subscriptions table
CREATE TABLE public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own subscriptions" ON public.push_subscriptions
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can read all subscriptions" ON public.push_subscriptions
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Notification log
CREATE TABLE public.notification_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES public.notification_templates(id),
  user_id uuid NOT NULL,
  channel text NOT NULL DEFAULT 'push',
  status text NOT NULL DEFAULT 'sent',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage notification_log" ON public.notification_log
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert default templates
INSERT INTO public.notification_templates (title, body, icon_emoji, category, trigger_type, inactive_days, channel) VALUES
  ('Novo desafio te espera! 🎯', 'Um novo desafio foi criado para você! Mostre o que sabe e conquiste mais XP.', '🎯', 'challenge', 'manual', NULL, 'push'),
  ('Hora de revisar! 📚', 'Que tal revisar a matéria de hoje? A revisão é o segredo para fixar o conteúdo!', '📚', 'review', 'auto_inactive', 2, 'push'),
  ('Sua sequência está em risco! 🔥', 'Você não estudou hoje ainda! Não perca sua sequência de dias consecutivos.', '🔥', 'streak', 'auto_inactive', 1, 'push'),
  ('Que tal praticar hoje? 💡', 'Uma sessão rápida de exercícios pode fazer toda a diferença. Vamos lá?', '💡', 'study', 'auto_inactive', 3, 'push'),
  ('Seus amigos estão estudando! 👥', 'Seus amigos já começaram a estudar hoje. Não fique para trás!', '👥', 'social', 'auto_inactive', 2, 'push'),
  ('Missão desbloqueada! 🏆', 'Você está perto de subir de nível! Complete mais exercícios e chegue lá.', '🏆', 'gamification', 'manual', NULL, 'push'),
  ('Saudades de você! 🌟', 'Faz tempo que você não aparece por aqui. Volte e continue evoluindo!', '🌟', 'reengagement', 'auto_inactive', 7, 'both'),
  ('Conteúdo novo disponível! 📖', 'Novos exercícios foram adicionados. Venha conferir e praticar!', '📖', 'content', 'manual', NULL, 'both');
