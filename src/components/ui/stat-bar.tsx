import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * StatBar — Barra de progresso "gamer" com degradê, listras animadas e glow interno.
 * Substitui Progress básico para conquistas/XP.
 */

export type StatBarVariant = 'gold' | 'flame' | 'mystic' | 'frost' | 'mint' | 'rose';

const VARIANT: Record<StatBarVariant, { gradient: string; glow: string; track: string }> = {
  gold: {
    gradient: 'from-[#fbbf24] via-[#f59e0b] to-[#d97706]',
    glow: 'shadow-[0_0_16px_rgba(251,191,36,0.55),inset_0_-2px_4px_rgba(0,0,0,0.3),inset_0_2px_3px_rgba(255,255,255,0.4)]',
    track: 'bg-[hsl(214,40%,11%)] ring-1 ring-[#fbbf24]/20',
  },
  flame: {
    gradient: 'from-[#fb7185] via-[#ef4444] to-[#b91c1c]',
    glow: 'shadow-[0_0_16px_rgba(239,68,68,0.55),inset_0_-2px_4px_rgba(0,0,0,0.3),inset_0_2px_3px_rgba(255,255,255,0.4)]',
    track: 'bg-[hsl(214,40%,11%)] ring-1 ring-[#ef4444]/20',
  },
  mystic: {
    gradient: 'from-[#e879f9] via-[#d946ef] to-[#a21caf]',
    glow: 'shadow-[0_0_16px_rgba(217,70,239,0.55),inset_0_-2px_4px_rgba(0,0,0,0.3),inset_0_2px_3px_rgba(255,255,255,0.4)]',
    track: 'bg-[hsl(214,40%,11%)] ring-1 ring-[#d946ef]/20',
  },
  frost: {
    gradient: 'from-[#67e8f9] via-[#06b6d4] to-[#0e7490]',
    glow: 'shadow-[0_0_16px_rgba(6,182,212,0.55),inset_0_-2px_4px_rgba(0,0,0,0.3),inset_0_2px_3px_rgba(255,255,255,0.4)]',
    track: 'bg-[hsl(214,40%,11%)] ring-1 ring-[#06b6d4]/20',
  },
  mint: {
    gradient: 'from-[#6ee7b7] via-[hsl(160,94%,58%)] to-[#047857]',
    glow: 'shadow-[0_0_16px_hsl(160_94%_58%/0.55),inset_0_-2px_4px_rgba(0,0,0,0.3),inset_0_2px_3px_rgba(255,255,255,0.4)]',
    track: 'bg-[hsl(214,40%,11%)] ring-1 ring-[hsl(160,94%,58%)]/20',
  },
  rose: {
    gradient: 'from-[#fda4af] via-[#f43f5e] to-[#9f1239]',
    glow: 'shadow-[0_0_16px_rgba(244,63,94,0.55),inset_0_-2px_4px_rgba(0,0,0,0.3),inset_0_2px_3px_rgba(255,255,255,0.4)]',
    track: 'bg-[hsl(214,40%,11%)] ring-1 ring-[#f43f5e]/20',
  },
};

const SIZE = {
  sm: 'h-2.5',
  md: 'h-3.5',
  lg: 'h-5',
} as const;

interface StatBarProps {
  value: number;
  max?: number;
  variant?: StatBarVariant;
  size?: keyof typeof SIZE;
  showStripes?: boolean;
  className?: string;
}

export function StatBar({
  value,
  max = 100,
  variant = 'gold',
  size = 'md',
  showStripes = true,
  className,
}: StatBarProps) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const v = VARIANT[variant];

  return (
    <div
      className={cn('relative w-full overflow-hidden rounded-full', v.track, SIZE[size], className)}
    >
      <div
        className={cn(
          'relative h-full rounded-full bg-gradient-to-r transition-all duration-700 ease-out',
          v.gradient,
          v.glow,
        )}
        style={{ width: `${pct}%` }}
      >
        {showStripes && (
          <div
            className="absolute inset-0 rounded-full opacity-30 stat-stripes"
            aria-hidden="true"
          />
        )}
        {/* Highlight superior */}
        <div
          className="absolute top-0 left-0 right-0 h-1/3 rounded-t-full bg-white/25"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
