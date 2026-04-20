import * as React from 'react';
import { cn } from '@/lib/utils';

type Tone = 'gold' | 'purple' | 'navy' | 'coral' | 'green';

const toneStyles: Record<Tone, string> = {
  gold: 'shadow-card-game bg-gradient-gold-soft',
  purple:
    'shadow-[0_1px_0_hsl(var(--royal-purple)/0.25)_inset,0_-2px_0_hsl(var(--royal-purple-deep)/0.6)_inset,0_8px_22px_-8px_hsl(var(--royal-purple)/0.45),0_0_0_1px_hsl(var(--royal-purple)/0.35)] bg-gradient-to-br from-royal/15 via-card to-card',
  navy: 'shadow-bevel-navy bg-card',
  coral:
    'shadow-[0_1px_0_hsl(var(--coral)/0.3)_inset,0_-2px_0_hsl(var(--coral-deep)/0.5)_inset,0_8px_22px_-8px_hsl(var(--coral)/0.4),0_0_0_1px_hsl(var(--coral)/0.3)] bg-gradient-to-br from-coral/10 via-card to-card',
  green:
    'shadow-[0_1px_0_hsl(var(--xp-green)/0.3)_inset,0_-2px_0_hsl(var(--xp-green-deep)/0.5)_inset,0_8px_22px_-8px_hsl(var(--xp-green)/0.4),0_0_0_1px_hsl(var(--xp-green)/0.3)] bg-gradient-to-br from-xp/10 via-card to-card',
};

interface GameCardProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: Tone;
  interactive?: boolean;
}

export const GameCard = React.forwardRef<HTMLDivElement, GameCardProps>(
  ({ className, tone = 'gold', interactive = false, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'relative rounded-2xl text-card-foreground overflow-hidden',
        toneStyles[tone],
        interactive && 'press-down cursor-pointer hover:brightness-110 transition-[filter]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
GameCard.displayName = 'GameCard';
