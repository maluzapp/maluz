import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfileStore } from '@/hooks/useProfile';

export function usePendingChallenges() {
  const profileId = useProfileStore((s) => s.activeProfileId);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!profileId) return;

    const fetchCount = async () => {
      const { count: c } = await supabase
        .from('challenges')
        .select('*', { count: 'exact', head: true })
        .eq('child_profile_id', profileId)
        .eq('status', 'pending');
      setCount(c || 0);
    };

    fetchCount();

    const channel = supabase
      .channel('pending-challenges')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'challenges',
      }, () => fetchCount())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [profileId]);

  return count;
}
