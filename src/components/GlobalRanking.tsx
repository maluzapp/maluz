import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfileStore } from '@/hooks/useProfile';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { YEARS, getYearLabel } from '@/constants/years';
import { cn } from '@/lib/utils';

interface RankingEntry {
  id: string;
  name: string;
  avatar_emoji: string;
  xp: number;
  level: number;
  streak_days: number;
  school_year: string | null;
  rank: number;
}

export function GlobalRanking() {
  const profileId = useProfileStore((s) => s.activeProfileId);
  const [entries, setEntries] = useState<RankingEntry[]>([]);
  const [myRank, setMyRank] = useState<{ rank: number; total: number } | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const yearFilter = filter === 'all' ? null : filter;
      const [{ data: ranking }, { data: my }] = await Promise.all([
        supabase.rpc('get_global_ranking', { _limit: 50, _school_year: yearFilter }),
        profileId ? supabase.rpc('get_my_global_rank', { _profile_id: profileId }) : Promise.resolve({ data: null }),
      ]);
      if (cancelled) return;
      setEntries((ranking as RankingEntry[]) || []);
      if (my && (my as any[])[0]) setMyRank((my as any[])[0]);
      setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [filter, profileId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);
  // Order top3 visually: 2nd, 1st, 3rd for podium effect
  const podium = [top3[1], top3[0], top3[2]].filter(Boolean);

  const isMe = (id: string) => id === profileId;

  return (
    <div className="space-y-5">
      {/* Filter */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground font-mono uppercase tracking-wider">Filtrar:</span>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-auto min-w-[140px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">🌍 Todos os anos</SelectItem>
            {YEARS.map((y) => (
              <SelectItem key={y.value} value={y.value}>
                {getYearLabel(y.value)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* My position highlight */}
      {myRank && myRank.rank > 0 && (
        <Card className="border-primary/30 bg-gradient-to-br from-primary/[0.08] via-card to-card overflow-hidden relative">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-primary/10 blur-3xl rounded-full" />
          <CardContent className="p-4 flex items-center gap-3 relative">
            <div className="text-4xl emoji-3d">🎯</div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider">Sua posição global</p>
              <p className="font-display font-black text-2xl text-foreground leading-tight">
                #{myRank.rank} <span className="text-muted-foreground text-sm font-mono font-normal">/ {myRank.total}</span>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Podium top 3 */}
      {podium.length > 0 && (
        <div>
          <h3 className="text-xs text-muted-foreground font-mono uppercase tracking-widest mb-3 text-center">
            🏆 Pódio dos Campeões
          </h3>
          <div className="grid grid-cols-3 gap-2 items-end mb-2">
            {podium.map((entry) => {
              if (!entry) return <div key="empty" />;
              const position = entry.rank;
              const isFirst = position === 1;
              const isSecond = position === 2;
              const heightClass = isFirst ? 'h-32' : isSecond ? 'h-24' : 'h-20';
              const podiumClass = isFirst ? 'podium-gold border-[#fbbf24]' : isSecond ? 'podium-silver border-slate-300' : 'podium-bronze border-amber-700';
              const medal = isFirst ? '🥇' : isSecond ? '🥈' : '🥉';
              const emojiSize = isFirst ? 'text-6xl' : 'text-5xl';

              return (
                <div key={entry.id} className="flex flex-col items-center">
                  <div className={cn('relative mb-2 transition-transform', isFirst && 'animate-float')}>
                    <span className={cn(emojiSize, 'block emoji-3d')}>{entry.avatar_emoji}</span>
                    <span className={cn(
                      'absolute -top-2 -right-2 text-2xl emoji-3d',
                      isMe(entry.id) && 'animate-pulse'
                    )}>
                      {medal}
                    </span>
                  </div>
                  <p className={cn(
                    'font-display font-bold text-xs text-center truncate max-w-full px-1',
                    isMe(entry.id) ? 'text-primary' : 'text-foreground'
                  )}>
                    {entry.name}
                    {isMe(entry.id) && ' (você)'}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-mono">{entry.xp} XP</p>
                  <div className={cn(
                    'w-full mt-2 rounded-t-xl border-t-2 border-x bg-gradient-to-b from-card to-[hsl(214,40%,9%)] flex items-start justify-center pt-2',
                    heightClass,
                    podiumClass,
                  )}>
                    <span className="font-display font-black text-3xl text-foreground/40">
                      {position}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Rest of ranking */}
      {rest.length > 0 && (
        <div className="space-y-1.5">
          <h3 className="text-xs text-muted-foreground font-mono uppercase tracking-widest mb-2">
            Top {entries.length}
          </h3>
          {rest.map((entry) => (
            <Card
              key={entry.id}
              className={cn(
                'border-primary/10 transition-colors',
                isMe(entry.id) && 'border-primary/50 bg-primary/[0.05]'
              )}
            >
              <CardContent className="p-3 flex items-center gap-3">
                <span className="font-display font-black text-lg text-muted-foreground/60 w-8 text-center font-mono">
                  {entry.rank}
                </span>
                <span className="text-3xl">{entry.avatar_emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'font-semibold text-sm truncate',
                    isMe(entry.id) ? 'text-primary' : 'text-foreground'
                  )}>
                    {entry.name}
                    {isMe(entry.id) && <span className="text-xs text-primary ml-1">(você)</span>}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Nv.{entry.level} · 🔥 {entry.streak_days}
                    {entry.school_year && ` · ${getYearLabel(entry.school_year)}`}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-display font-bold text-foreground text-sm">{entry.xp.toLocaleString('pt-BR')}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">XP</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {entries.length === 0 && (
        <Card className="border-primary/10">
          <CardContent className="p-8 text-center">
            <div className="text-5xl mb-3 emoji-3d">🏆</div>
            <h3 className="font-display font-bold text-foreground mb-1">Sem competidores ainda</h3>
            <p className="text-sm text-muted-foreground">Estude para entrar no ranking!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
