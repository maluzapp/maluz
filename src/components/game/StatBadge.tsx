import * as React from 'react';
import { cn } from '@/lib/utils';

type Tone = 'gold' | 'coral' | 'green' | 'purple' | 'info';

const toneStyles: Record<Tone, { bg: string; ring: string; iconColor: string }> = {
  gold: {
    bg: 'bg-gradient-gold shadow-bevel-gold-sm',
    ring: 'ring-gold-deep/60',
    iconColor: 'text-primary-foreground',
  },
  coral: {
    bg: 'bg-gradient-coral shadow-bevel-coral',
    ring: 'ring-coral-deep/60',
    iconColor: 'text-white',
  },
  green: {
    bg: 'bg-gradient-to-b from-xp to-xp-deep shadow-bevel-green',
    ring: 'ring-xp-deep/60',
    iconColor: 'text-primary-foreground',
  },
  purple: {
    bg: 'bg-gradient-purple shadow-bevel-purple',
    ring: 'ring-royal-deep/60',
    iconColor: 'text-royal-foreground',
  },
  info: {
    bg: 'bg-gradient-to-b from-info to-info-deep shadow-[inset_0_1px_0_hsl(210_95%_75%),inset_0_-3px_0_hsl(var(--info-blue-deep)),0_3px_0_hsl(210_70%_18%),0_6px_14px_-2px_hsl(var(--info-blue)/0.4)]',
    ring: 'ring-info-deep/60',
    iconColor: 'text-white',
  },
};

interface StatBadgeProps {
  icon?: React.ReactNode;
  value: React.ReactNode;
  label: string;
  tone?: Tone;
  className?: string;
}

export const StatBadge: React.FC<StatBadgeProps> = ({ icon, value, label, tone = 'gold', className }) => {
  const t = toneStyles[tone];
  return (
    <div className={cn('flex flex-col items-center gap-1.5', className)}>
      <div
        className={cn(
          'relative w-16 h-16 rounded-full flex flex-col items-center justify-center ring-1',
          t.bg,
          t.ring
        )}
      >
        {icon && <div className={cn('absolute -top-1.5 -right-1.5 w-7 h-7 rounded-full bg-card border-2 border-card flex items-center justify-center', t.iconColor)}>{icon}</div>}
        <span className="font-display font-black text-xl leading-none text-stroke-navy text-primary-foreground">{value}</span>
      </div>
      <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-bold">{label}</span>
    </div>
  );
};
