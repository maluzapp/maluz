import * as React from 'react';
import { cn } from '@/lib/utils';
import { Crown, Medal } from 'lucide-react';

export interface PodiumEntry {
  id: string;
  name: string;
  avatar: string; // emoji
  xp: number;
}

interface TrophyPodiumProps {
  entries: PodiumEntry[]; // up to 3, ordered by rank
  unit?: string;
  onEntryClick?: (id: string) => void;
  className?: string;
}

const places = [
  // [position, height, ringTone, badgeBg, label, podiumGradient, shadowClass]
  {
    rank: 2,
    h: 'h-20',
    avatarSize: 'w-16 h-16',
    badge: 'bg-gradient-to-b from-slate-300 to-slate-500',
    podium:
      'bg-gradient-to-b from-slate-400 to-slate-700 shadow-trophy-silver',
    icon: <Medal className="h-4 w-4 text-slate-100" />,
    label: '2º',
  },
  {
    rank: 1,
    h: 'h-28',
    avatarSize: 'w-20 h-20',
    badge: 'bg-gradient-gold shadow-bevel-gold-sm',
    podium: 'bg-gradient-gold shadow-trophy',
    icon: <Crown className="h-5 w-5 text-primary-foreground" />,
    label: '1º',
  },
  {
    rank: 3,
    h: 'h-16',
    avatarSize: 'w-14 h-14',
    badge: 'bg-gradient-to-b from-amber-500 to-amber-800',
    podium:
      'bg-gradient-to-b from-amber-600 to-amber-900 shadow-trophy-bronze',
    icon: <Medal className="h-4 w-4 text-amber-100" />,
    label: '3º',
  },
] as const;

export const TrophyPodium: React.FC<TrophyPodiumProps> = ({
  entries,
  unit = 'XP',
  onEntryClick,
  className,
}) => {
  const byRank: (PodiumEntry | undefined)[] = [entries[1], entries[0], entries[2]];

  return (
    <div className={cn('relative px-4 pt-6 pb-3', className)}>
      <div className="flex items-end justify-center gap-3">
        {places.map((place, idx) => {
          const entry = byRank[idx];
          if (!entry) {
            return (
              <div key={place.rank} className="flex flex-col items-center gap-2 opacity-40">
                <div className={cn('rounded-full ring-2 ring-border bg-muted flex items-center justify-center text-2xl', place.avatarSize)}>·</div>
                <div className={cn('w-20 rounded-t-xl', place.h, 'bg-muted/40')} />
              </div>
            );
          }
          return (
            <button
              key={entry.id}
              type="button"
              onClick={() => onEntryClick?.(entry.id)}
              className="flex flex-col items-center gap-2 group press-down"
            >
              <div className="relative">
                <div
                  className={cn(
                    'rounded-full ring-[3px] ring-primary/80 bg-card flex items-center justify-center text-3xl shadow-bevel-navy',
                    place.avatarSize,
                    place.rank === 1 && 'animate-trophy-bounce'
                  )}
                >
                  {entry.avatar}
                </div>
                <div className={cn('absolute -top-2 -right-1 w-7 h-7 rounded-full flex items-center justify-center ring-2 ring-card', place.badge)}>
                  {place.icon}
                </div>
              </div>
              <p className="text-xs font-display font-bold text-foreground max-w-[88px] truncate">{entry.name}</p>
              <p className="text-[10px] font-mono text-primary font-bold">{entry.xp.toLocaleString('pt-BR')} {unit}</p>
              <div
                className={cn(
                  'w-20 rounded-t-xl flex items-start justify-center pt-1.5 ring-1 ring-gold-deep/30',
                  place.h,
                  place.podium
                )}
              >
                <span className="font-display font-black text-lg text-stroke-navy text-primary-foreground">
                  {place.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
