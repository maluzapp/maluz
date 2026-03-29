
-- Subscription plans table
CREATE TABLE public.subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  price_monthly numeric(10,2) NOT NULL DEFAULT 0,
  price_yearly numeric(10,2),
  price_weekly numeric(10,2),
  daily_session_limit integer NOT NULL DEFAULT 3,
  max_profiles integer NOT NULL DEFAULT 1,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  store_product_id_google text,
  store_product_id_apple text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Anyone can read plans
CREATE POLICY "Anyone can read plans" ON public.subscription_plans
  FOR SELECT TO anon, authenticated USING (true);

-- Admins can manage plans
CREATE POLICY "Admins can manage plans" ON public.subscription_plans
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- User subscriptions table
CREATE TABLE public.user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.subscription_plans(id),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'trial')),
  billing_period text NOT NULL DEFAULT 'monthly' CHECK (billing_period IN ('weekly', 'monthly', 'yearly')),
  store_transaction_id text,
  store_provider text CHECK (store_provider IN ('google_play', 'apple_store', 'stripe', NULL)),
  started_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, status) 
);

-- Enable RLS
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view own subscription
CREATE POLICY "Users can view own subscription" ON public.user_subscriptions
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Admins can manage all subscriptions
CREATE POLICY "Admins can manage subscriptions" ON public.user_subscriptions
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Daily usage tracking
CREATE TABLE public.daily_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  usage_date date NOT NULL DEFAULT CURRENT_DATE,
  sessions_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(profile_id, usage_date)
);

-- Enable RLS
ALTER TABLE public.daily_usage ENABLE ROW LEVEL SECURITY;

-- Users can view own usage
CREATE POLICY "Users can view own usage" ON public.daily_usage
  FOR SELECT TO authenticated USING (owns_profile(profile_id));

-- Users can insert/update own usage
CREATE POLICY "Users can insert own usage" ON public.daily_usage
  FOR INSERT TO authenticated WITH CHECK (owns_profile(profile_id));

CREATE POLICY "Users can update own usage" ON public.daily_usage
  FOR UPDATE TO authenticated USING (owns_profile(profile_id));

-- Insert default plans
INSERT INTO public.subscription_plans (name, slug, price_monthly, price_yearly, price_weekly, daily_session_limit, max_profiles, features, sort_order) VALUES
('Free', 'free', 0, NULL, NULL, 3, 1, '["Até 3 sessões por dia", "Correção básica", "1 perfil", "Conteúdo do 2º ao 3º Médio"]'::jsonb, 0),
('Pro', 'pro', 9.90, 99.90, NULL, -1, 3, '["Sessões ilimitadas", "Relatórios de desempenho", "Até 3 perfis", "Plano de estudo inteligente", "Análise detalhada de erros", "Sem anúncios"]'::jsonb, 1),
('Família', 'familia', 14.90, 149.90, NULL, -1, 6, '["Tudo do Pro", "Até 6 perfis", "Painel parental completo", "Relatórios por filho", "Suporte prioritário"]'::jsonb, 2);
