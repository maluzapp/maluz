import * as React from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * GameIcon — Plasma Neon wrapper para ícones grandes coloridos.
 * Usa degradê na borda, fundo escuro, glow contextual e sombra interna.
 *
 * Exemplo:
 *   <GameIcon icon={Star} variant="gold" size="md" />
 */

export type GameIconVariant =
  | 'gold'
  | 'flame'
  | 'mystic'
  | 'frost'
  | 'mint'
  | 'rose';

export type GameIconSize = 'sm' | 'md' | 'lg' | 'xl';

const VARIANT_STYLES: Record<GameIconVariant, { border: string; glow: string; iconText: string; drop: string }> = {
  // Dourado (XP, conquistas, troféus) — alinhado com a marca Maluz
  gold: {
    border: 'from-[hsl(42,91%,61%)]/70 via-transparent to-white/10',
    glow: 'shadow-[0_0_50px_-8px_hsl(42_91%_61%/0.55),inset_0_0_18px_hsl(42_91%_61%/0.18)]',
    iconText: 'text-[hsl(42,91%,68%)]',
    drop: 'drop-shadow-[0_0_12px_hsl(42_91%_61%/0.7)]',
  },
  // Fogo (streaks, urgência)
  flame: {
    border: 'from-[#ef4444]/70 via-transparent to-white/10',
    glow: 'shadow-[0_0_50px_-8px_rgba(239,68,68,0.55),inset_0_0_18px_rgba(239,68,68,0.18)]',
    iconText: 'text-[#fb7185]',
    drop: 'drop-shadow-[0_0_12px_rgba(239,68,68,0.7)]',
  },
  // Místico (social, amigos, alianças)
  mystic: {
    border: 'from-[#d946ef]/70 via-transparent to-white/10',
    glow: 'shadow-[0_0_50px_-8px_rgba(217,70,239,0.55),inset_0_0_18px_rgba(217,70,239,0.18)]',
    iconText: 'text-[#e879f9]',
    drop: 'drop-shadow-[0_0_12px_rgba(217,70,239,0.7)]',
  },
  // Gelo (desafios, combate)
  frost: {
    border: 'from-[#06b6d4]/70 via-transparent to-white/10',
    glow: 'shadow-[0_0_50px_-8px_rgba(6,182,212,0.55),inset_0_0_18px_rgba(6,182,212,0.18)]',
    iconText: 'text-[#22d3ee]',
    drop: 'drop-shadow-[0_0_12px_rgba(6,182,212,0.7)]',
  },
  // Menta (precisão, sucesso)
  mint: {
    border: 'from-[hsl(160,94%,58%)]/70 via-transparent to-white/10',
    glow: 'shadow-[0_0_50px_-8px_hsl(160_94%_58%/0.55),inset_0_0_18px_hsl(160_94%_58%/0.18)]',
    iconText: 'text-[hsl(160,94%,64%)]',
    drop: 'drop-shadow-[0_0_12px_hsl(160_94%_58%/0.7)]',
  },
  // Rosa (notificações, novidades)
  rose: {
    border: 'from-[#f43f5e]/70 via-transparent to-white/10',
    glow: 'shadow-[0_0_50px_-8px_rgba(244,63,94,0.55),inset_0_0_18px_rgba(244,63,94,0.18)]',
    iconText: 'text-[#fb7185]',
    drop: 'drop-shadow-[0_0_12px_rgba(244,63,94,0.7)]',
  },
};

const SIZE_STYLES: Record<GameIconSize, { box: string; rounded: string; icon: string }> = {
  sm: { box: 'h-10 w-10', rounded: 'rounded-xl', icon: 'h-5 w-5' },
  md: { box: 'h-14 w-14', rounded: 'rounded-2xl', icon: 'h-7 w-7' },
  lg: { box: 'h-20 w-20', rounded: 'rounded-2xl', icon: 'h-10 w-10' },
  xl: { box: 'h-28 w-28', rounded: 'rounded-3xl', icon: 'h-14 w-14' },
};

interface GameIconProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: LucideIcon;
  variant?: GameIconVariant;
  size?: GameIconSize;
  /** Pulsa suavemente o glow */
  pulse?: boolean;
}

export const GameIcon = React.forwardRef<HTMLDivElement, GameIconProps>(
  ({ icon: Icon, variant = 'gold', size = 'md', pulse = false, className, ...props }, ref) => {
    const v = VARIANT_STYLES[variant];
    const s = SIZE_STYLES[size];

    return (
      <div
        ref={ref}
        className={cn(
          'relative inline-flex items-center justify-center p-[1.5px] bg-gradient-to-br',
          v.border,
          v.glow,
          s.box,
          s.rounded,
          pulse && 'animate-glow-pulse',
          className,
        )}
        {...props}
      >
        <div
          className={cn(
            'flex h-full w-full items-center justify-center bg-gradient-to-br from-[hsl(213,50%,9%)] to-[hsl(214,40%,14%)] border border-white/5',
            s.rounded,
          )}
        >
          <Icon className={cn(s.icon, v.iconText, v.drop)} strokeWidth={2.2} />
        </div>
      </div>
    );
  },
);
GameIcon.displayName = 'GameIcon';
