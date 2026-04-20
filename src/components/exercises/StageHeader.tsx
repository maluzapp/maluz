import { Trophy, Zap, Target } from 'lucide-react';
import { StatBar } from '@/components/ui/stat-bar';
import { cn } from '@/lib/utils';

interface StageHeaderProps {
  current: number;
  total: number;
  correctCount: number;
  exerciseType?: string;
}

const TYPE_LABEL: Record<string, { label: string; emoji: string }> = {
  multiple_choice: { label: 'Múltipla Escolha', emoji: '🎯' },
  true_false: { label: 'Verdadeiro ou Falso', emoji: '⚖️' },
  fill_blank: { label: 'Preencher Lacuna', emoji: '✍️' },
  matching: { label: 'Associação', emoji: '🔗' },
  ordering: { label: 'Ordenação', emoji: '🔢' },
  complete_sentence: { label: 'Completar Frase', emoji: '📝' },
  column_classification: { label: 'Classificação', emoji: '📊' },
};

export function StageHeader({ current, total, correctCount, exerciseType }: StageHeaderProps) {
  const stage = TYPE_LABEL[exerciseType || ''] || { label: 'Desafio', emoji: '⭐' };
  const progress = (current / total) * 100;
  const accuracy = current > 0 ? (correctCount / current) * 100 : 0;

  return (
    <div className="mb-5 animate-fade-in">
      {/* Top row: Stage info + stats */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/30 via-primary/15 to-transparent ring-1 ring-primary/40 shadow-[0_0_18px_hsl(var(--primary)/0.4),inset_0_1px_0_rgba(255,255,255,0.15)]">
            <span className="text-2xl emoji-3d">{stage.emoji}</span>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary/80">
              Fase {current + 1}/{total}
            </span>
            <span className="text-sm font-display font-bold text-foreground">{stage.label}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <StatChip icon={<Trophy className="h-3 w-3" />} value={correctCount} variant="gold" />
          <StatChip icon={<Zap className="h-3 w-3" />} value={`${Math.round(accuracy)}%`} variant="mint" />
          <StatChip icon={<Target className="h-3 w-3" />} value={total - current} variant="frost" />
        </div>
      </div>

      {/* Stage progress bar with stripes */}
      <div className="relative">
        <StatBar value={progress} max={100} variant="gold" size="md" showStripes />
        {/* Tick marks per fase */}
        <div className="pointer-events-none absolute inset-0 flex justify-between px-1">
          {Array.from({ length: total + 1 }).map((_, i) => (
            <span
              key={i}
              className={cn(
                'h-full w-px',
                i <= current ? 'bg-primary-foreground/30' : 'bg-foreground/10'
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function StatChip({
  icon,
  value,
  variant,
}: {
  icon: React.ReactNode;
  value: string | number;
  variant: 'gold' | 'mint' | 'frost';
}) {
  const styles = {
    gold: 'from-[#fbbf24]/25 to-[#d97706]/10 text-[#fbbf24] ring-[#fbbf24]/30 shadow-[0_0_10px_rgba(251,191,36,0.3)]',
    mint: 'from-[hsl(160,94%,58%)]/25 to-[hsl(160,84%,30%)]/10 text-[hsl(160,94%,68%)] ring-[hsl(160,94%,58%)]/30 shadow-[0_0_10px_hsl(160_94%_58%/0.3)]',
    frost: 'from-[#06b6d4]/25 to-[#0e7490]/10 text-[#67e8f9] ring-[#06b6d4]/30 shadow-[0_0_10px_rgba(6,182,212,0.3)]',
  };
  return (
    <div
      className={cn(
        'flex items-center gap-1 rounded-full bg-gradient-to-br px-2 py-1 text-[11px] font-bold ring-1',
        styles[variant]
      )}
    >
      {icon}
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
