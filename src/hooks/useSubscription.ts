import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfileStore } from '@/hooks/useProfile';

export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  price_monthly: number;
  price_yearly: number | null;
  price_weekly: number | null;
  daily_session_limit: number;
  max_profiles: number;
  features: string[];
  is_active: boolean;
  sort_order: number;
  store_product_id_google: string | null;
  store_product_id_apple: string | null;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: string;
  billing_period: string;
  store_provider: string | null;
  started_at: string;
  expires_at: string | null;
  plan?: SubscriptionPlan;
}

export function usePlans() {
  return useQuery({
    queryKey: ['subscription_plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return (data ?? []) as SubscriptionPlan[];
    },
  });
}

export function useUserSubscription() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['user_subscription', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*, plan:subscription_plans(*)')
        .eq('user_id', user!.id)
        .eq('status', 'active')
        .maybeSingle();
      if (error) throw error;
      return data as (UserSubscription & { plan: SubscriptionPlan }) | null;
    },
  });
}

export function useDailyUsage() {
  const profileId = useProfileStore((s) => s.activeProfileId);
  return useQuery({
    queryKey: ['daily_usage', profileId],
    enabled: !!profileId,
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('daily_usage')
        .select('*')
        .eq('profile_id', profileId!)
        .eq('usage_date', today)
        .maybeSingle();
      if (error) throw error;
      return data as { sessions_count: number } | null;
    },
  });
}

export function useCanStartSession() {
  const { data: subscription } = useUserSubscription();
  const { data: usage } = useDailyUsage();

  // If user has active pro/familia subscription, unlimited
  if (subscription?.plan?.daily_session_limit === -1) {
    return { canStart: true, sessionsUsed: usage?.sessions_count ?? 0, limit: -1, plan: subscription.plan };
  }

  // Free tier: 3 sessions per day
  const limit = subscription?.plan?.daily_session_limit ?? 3;
  const used = usage?.sessions_count ?? 0;
  return { canStart: used < limit, sessionsUsed: used, limit, plan: subscription?.plan ?? null };
}

export async function incrementDailyUsage(profileId: string) {
  const today = new Date().toISOString().split('T')[0];
  
  // Try to update existing record
  const { data: existing } = await supabase
    .from('daily_usage')
    .select('id, sessions_count')
    .eq('profile_id', profileId)
    .eq('usage_date', today)
    .maybeSingle();

  if (existing) {
    await supabase
      .from('daily_usage')
      .update({ sessions_count: existing.sessions_count + 1 })
      .eq('id', existing.id);
  } else {
    await supabase
      .from('daily_usage')
      .insert({ profile_id: profileId, usage_date: today, sessions_count: 1 });
  }
}
