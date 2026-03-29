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
  stripe_price_id: string | null;
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

// Stripe price → plan slug mapping
export const STRIPE_PRICES: Record<string, { slug: string; period: 'monthly' | 'yearly' }> = {
  'price_1TGJVgEWUivwufDD8qFByYML': { slug: 'pro', period: 'monthly' },
  'price_1TGJWvEWUivwufDD6lWAQJIk': { slug: 'pro', period: 'yearly' },
  'price_1TGJX3EWUivwufDDIy281CCo': { slug: 'familia', period: 'monthly' },
  'price_1TGJX4EWUivwufDDp2uoTWVo': { slug: 'familia', period: 'yearly' },
};

// Yearly price IDs per plan slug
export const STRIPE_YEARLY_PRICES: Record<string, string> = {
  pro: 'price_1TGJWvEWUivwufDD6lWAQJIk',
  familia: 'price_1TGJX4EWUivwufDDp2uoTWVo',
};

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

export interface StripeSubscriptionStatus {
  subscribed: boolean;
  price_id?: string;
  product_id?: string;
  subscription_end?: string;
}

export function useStripeSubscription() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['stripe_subscription', user?.id],
    enabled: !!user,
    refetchInterval: 60_000, // Poll every 60s
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('check-stripe-subscription');
      if (error) throw error;
      return data as StripeSubscriptionStatus;
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
  const { data: stripeStatus } = useStripeSubscription();
  const { data: usage } = useDailyUsage();

  // If Stripe says subscribed → unlimited
  if (stripeStatus?.subscribed) {
    const priceInfo = stripeStatus.price_id ? STRIPE_PRICES[stripeStatus.price_id] : null;
    return { canStart: true, sessionsUsed: usage?.sessions_count ?? 0, limit: -1, planSlug: priceInfo?.slug ?? 'pro' };
  }

  // If DB subscription is active with unlimited
  if (subscription?.plan?.daily_session_limit === -1) {
    return { canStart: true, sessionsUsed: usage?.sessions_count ?? 0, limit: -1, planSlug: subscription.plan.slug };
  }

  // Free tier
  const limit = subscription?.plan?.daily_session_limit ?? 3;
  const used = usage?.sessions_count ?? 0;
  return { canStart: used < limit, sessionsUsed: used, limit, planSlug: subscription?.plan?.slug ?? 'free' };
}

export async function incrementDailyUsage(profileId: string) {
  const today = new Date().toISOString().split('T')[0];
  
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

export async function startCheckout(priceId: string) {
  const { data, error } = await supabase.functions.invoke('create-checkout', {
    body: { price_id: priceId },
  });
  if (error) throw error;
  if (data?.url) {
    window.open(data.url, '_blank');
  }
  return data;
}

export async function openCustomerPortal() {
  const { data, error } = await supabase.functions.invoke('customer-portal');
  if (error) throw error;
  if (data?.url) {
    window.open(data.url, '_blank');
  }
  return data;
}
