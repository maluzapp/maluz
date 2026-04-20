import * as React from 'react';
import { cn } from '@/lib/utils';

interface ProgressBarGameProps {
  value: number; // 0..100
  height?: number;
  showShine?: boolean;
  className?: string;
}

export const ProgressBarGame: React.FC<ProgressBarGameProps> = ({
  value,
  height = 16,
  showShine = true,
  className,
}) => {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      className={cn(
        'relative w-full rounded-full overflow-hidden',
        'bg-background-deep',
        'shadow-[inset_0_2px_4px_hsl(213_70%_2%/0.7),0_1px_0_hsl(var(--gold-light)/0.1)]',
        'ring-1 ring-gold-deep/40',
        className
      )}
      style={{ height }}
    >
      <div
        className="relative h-full bg-gradient-xp transition-[width] duration-700 ease-out rounded-full"
        style={{ width: `${pct}%` }}
      >
        {/* Inner highlight */}
        <div
          className="absolute inset-x-0 top-0 h-1/2 rounded-t-full opacity-60"
          style={{
            background: 'linear-gradient(180deg, hsl(var(--gold-light) / 0.7), transparent)',
          }}
        />
        {showShine && pct > 8 && (
          <div className="absolute inset-0 overflow-hidden rounded-full">
            <div
              className="absolute top-0 h-full w-1/4"
              style={{
                background: 'linear-gradient(90deg, transparent, hsl(0 0% 100% / 0.55), transparent)',
                animation: 'shine-sweep 2.4s ease-in-out infinite',
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
