import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const gameButtonVariants = cva(
  'relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl font-display font-bold tracking-wide press-down ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        gold: 'bg-gradient-gold text-primary-foreground shadow-bevel-gold text-stroke-navy',
        purple: 'bg-gradient-purple text-royal-foreground shadow-bevel-purple text-stroke-navy',
        green: 'bg-gradient-to-b from-xp to-xp-deep text-primary-foreground shadow-bevel-green text-stroke-navy',
        coral: 'bg-gradient-coral text-white shadow-bevel-coral text-stroke-navy',
        ghostGold:
          'bg-card/60 text-primary border-2 border-primary/60 shadow-[inset_0_1px_0_hsl(var(--gold-light)/0.3),0_3px_0_hsl(var(--gold-shadow)/0.6)] hover:bg-primary/10',
        navy: 'bg-card text-foreground shadow-bevel-navy',
      },
      size: {
        sm: 'h-10 px-4 text-sm [&_svg]:size-4',
        md: 'h-12 px-5 text-base [&_svg]:size-5',
        lg: 'h-14 px-7 text-lg [&_svg]:size-6',
        icon: 'h-12 w-12 [&_svg]:size-5',
      },
    },
    defaultVariants: { variant: 'gold', size: 'md' },
  }
);

export interface GameButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof gameButtonVariants> {
  asChild?: boolean;
  shine?: boolean;
}

export const GameButton = React.forwardRef<HTMLButtonElement, GameButtonProps>(
  ({ className, variant, size, asChild = false, shine = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp ref={ref} className={cn(gameButtonVariants({ variant, size }), shine && 'overflow-hidden animate-shine-sweep', className)} {...props}>
        {children}
      </Comp>
    );
  }
);
GameButton.displayName = 'GameButton';

export { gameButtonVariants };
