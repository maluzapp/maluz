import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface BrandingSetting {
  id: string;
  key: string;
  value: string;
  category: string;
  updated_at: string;
}

export function useBrandingSettings(category?: string) {
  return useQuery({
    queryKey: ['branding_settings', category],
    queryFn: async () => {
      let q = supabase.from('branding_settings').select('*');
      if (category) q = q.eq('category', category);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as BrandingSetting[];
    },
  });
}

export function useBrandingByCategory() {
  return useQuery({
    queryKey: ['branding_settings', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase.from('branding_settings').select('*');
      if (error) throw error;
      const map: Record<string, Record<string, BrandingSetting>> = {};
      for (const item of data ?? []) {
        if (!map[item.category]) map[item.category] = {};
        map[item.category][item.key] = item as BrandingSetting;
      }
      return map;
    },
  });
}

export function useUpdateBranding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (updates: { key: string; value: string; category: string }[]) => {
      for (const u of updates) {
        const { error } = await supabase
          .from('branding_settings')
          .upsert({ key: u.key, value: u.value, category: u.category }, { onConflict: 'key' });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['branding_settings'] });
      toast.success('Configurações salvas!');
    },
    onError: (e: Error) => {
      toast.error('Erro ao salvar: ' + e.message);
    },
  });
}

export function useIsAdmin() {
  return useQuery({
    queryKey: ['is_admin'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      const { data } = await supabase
        .from('user_roles' as any)
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin');
      return (data && data.length > 0) ?? false;
    },
  });
}
