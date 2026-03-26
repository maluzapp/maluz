import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfileStore } from '@/hooks/useProfile';
import { Progress } from '@/components/ui/progress';
import { Flame, Star, TrendingUp } from 'lucide-react';

interface ProfileStats {
  name: string;
  avatar_emoji: string;
  xp: number;
  level: number;
  streak_days: number;
}

// XP needed for each level: level N needs N * 100 XP
function xpForLevel(level: number) {
  return level * 100;
}

export function GamificationBar() {
  const profileId = useProfileStore((s) => s.activeProfileId);
  const [stats, setStats] = useState<ProfileStats | null>(null);

  useEffect(() => {
    if (!profileId) return;
    const fetch = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('name, avatar_emoji, xp, level, streak_days')
        .eq('id', profileId)
        .single();
      if (data) setStats(data as ProfileStats);
    };
    fetch();
  }, [profileId]);

  if (!stats) return null;

  const xpNeeded = xpForLevel(stats.level);
  const xpInLevel = stats.xp % xpNeeded || (stats.xp > 0 ? xpNeeded : 0);
  const progressPct = Math.min((xpInLevel / xpNeeded) * 100, 100);

  return (
    <div className="flex items-center gap-3 rounded-xl bg-card border border-border px-4 py-2.5 shadow-sm">
      <span className="text-2xl">{stats.avatar_emoji}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between text-sm">
          <span className="font-display font-bold text-foreground truncate">{stats.name}</span>
          <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0 ml-2">
            <span className="flex items-center gap-0.5">
              <TrendingUp className="h-3 w-3" />
              Nv. {stats.level}
            </span>
            <span className="flex items-center gap-0.5">
              <Star className="h-3 w-3 text-accent" />
              {stats.xp}
            </span>
            <span className="flex items-center gap-0.5">
              <Flame className="h-3 w-3 text-destructive" />
              {stats.streak_days}
            </span>
          </div>
        </div>
        <Progress value={progressPct} className="h-1.5 mt-1" />
      </div>
    </div>
  );
}
