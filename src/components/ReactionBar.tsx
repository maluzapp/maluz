import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfileStore } from '@/hooks/useProfile';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const REACTION_EMOJIS = ['👏', '🔥', '💪', '⭐', '🎉'];

interface ReactionCount {
  emoji: string;
  count: number;
  reacted: boolean;
}

interface ReactionBarProps {
  targetType: 'session' | 'challenge';
  targetId: string;
  compact?: boolean;
}

export function ReactionBar({ targetType, targetId, compact = false }: ReactionBarProps) {
  const profileId = useProfileStore((s) => s.activeProfileId);
  const [reactions, setReactions] = useState<ReactionCount[]>([]);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    loadReactions();
  }, [targetId, profileId]);

  const loadReactions = async () => {
    if (!profileId) return;
    const { data } = await supabase
      .from('reactions' as any)
      .select('emoji, profile_id')
      .eq('target_type', targetType)
      .eq('target_id', targetId);

    const map: Record<string, { count: number; reacted: boolean }> = {};
    for (const r of (data as any[] || [])) {
      if (!map[r.emoji]) map[r.emoji] = { count: 0, reacted: false };
      map[r.emoji].count++;
      if (r.profile_id === profileId) map[r.emoji].reacted = true;
    }
    setReactions(
      Object.entries(map)
        .map(([emoji, v]) => ({ emoji, ...v }))
        .sort((a, b) => b.count - a.count)
    );
  };

  const toggleReaction = async (emoji: string) => {
    if (!profileId) return;
    const existing = reactions.find((r) => r.emoji === emoji && r.reacted);
    if (existing) {
      await supabase
        .from('reactions' as any)
        .delete()
        .eq('profile_id', profileId)
        .eq('target_type', targetType)
        .eq('target_id', targetId)
        .eq('emoji', emoji);
    } else {
      const { error } = await supabase.from('reactions' as any).insert({
        profile_id: profileId,
        target_type: targetType,
        target_id: targetId,
        emoji,
      });
      if (error && error.code === '23505') {
        // Already reacted
        return;
      }
    }
    setShowPicker(false);
    loadReactions();
  };

  const visibleReactions = reactions.filter((r) => r.count > 0);

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {visibleReactions.map((r) => (
        <button
          key={r.emoji}
          onClick={() => toggleReaction(r.emoji)}
          className={cn(
            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs transition-all',
            'border hover:scale-105 active:scale-95',
            r.reacted
              ? 'bg-primary/15 border-primary/30 text-primary'
              : 'bg-muted/50 border-border text-muted-foreground hover:border-primary/20'
          )}
        >
          <span>{r.emoji}</span>
          <span className="font-mono text-[10px]">{r.count}</span>
        </button>
      ))}

      {/* Add reaction button */}
      <div className="relative">
        <button
          onClick={() => setShowPicker(!showPicker)}
          className={cn(
            'inline-flex items-center justify-center rounded-full border border-dashed border-border',
            'text-muted-foreground hover:border-primary/30 hover:text-primary transition-all',
            'hover:scale-105 active:scale-95',
            compact ? 'w-6 h-6 text-xs' : 'w-7 h-7 text-sm'
          )}
        >
          +
        </button>

        {showPicker && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowPicker(false)} />
            <div className="absolute bottom-full left-0 mb-1 z-50 flex gap-1 bg-card border border-border rounded-full px-2 py-1.5 shadow-lg animate-fade-in">
              {REACTION_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => toggleReaction(emoji)}
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-lg',
                    'hover:bg-primary/10 hover:scale-110 active:scale-95 transition-all',
                    reactions.find((r) => r.emoji === emoji && r.reacted) && 'bg-primary/15'
                  )}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
