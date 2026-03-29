import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfileStore } from '@/hooks/useProfile';
import { toast } from 'sonner';

export function usePendingFriendRequests() {
  const profileId = useProfileStore((s) => s.activeProfileId);
  const [count, setCount] = useState(0);

  const fetchCount = async () => {
    if (!profileId) return;
    const { count: c } = await supabase
      .from('friendships' as any)
      .select('*', { count: 'exact', head: true })
      .eq('target_profile_id', profileId)
      .eq('status', 'pending');
    setCount(c ?? 0);
  };

  useEffect(() => {
    if (!profileId) return;
    fetchCount();

    const channel = supabase
      .channel(`friend-requests-${profileId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'friendships',
          filter: `target_profile_id=eq.${profileId}`,
        },
        (payload) => {
          if ((payload.new as any)?.status === 'pending') {
            setCount((prev) => prev + 1);
            toast.info('📬 Novo pedido de amizade!', {
              description: 'Alguém quer ser seu amigo. Confira na aba Amigos!',
              action: { label: 'Ver', onClick: () => window.location.assign('/amigos') },
            });
          }
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friendships',
        },
        () => {
          // Refetch on any change (accept, delete, etc.)
          fetchCount();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profileId]);

  return count;
}
