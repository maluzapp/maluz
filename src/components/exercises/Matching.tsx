import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Undo2 } from 'lucide-react';
import { fireCorrectConfetti } from './Confetti';
import type { MatchingExercise, ExerciseAnswer } from '@/types/study';

interface Props {
  exercise: MatchingExercise;
  index: number;
  onAnswer: (answer: ExerciseAnswer) => void;
  readOnly?: boolean;
  savedAnswer?: ExerciseAnswer;
}

const MATCH_COLORS = [
  { line: '#D4A843', bg: 'bg-primary/15', border: 'border-primary', text: 'text-primary' },
  { line: '#5EEAD4', bg: 'bg-accent/20', border: 'border-accent', text: 'text-accent-foreground' },
  { line: '#94A3B8', bg: 'bg-secondary/30', border: 'border-secondary', text: 'text-secondary-foreground' },
  { line: '#A78BFA', bg: 'bg-muted/40', border: 'border-muted-foreground', text: 'text-muted-foreground' },
  { line: '#FB923C', bg: 'bg-primary/10', border: 'border-primary/60', text: 'text-primary' },
  { line: '#38BDF8', bg: 'bg-accent/10', border: 'border-accent/60', text: 'text-accent-foreground' },
];

export function Matching({ exercise, index, onAnswer, readOnly, savedAnswer }: Props) {
  const [shuffledRight] = useState(() => {
    const items = exercise.pairs.map((p, i) => ({ text: p.right, originalIndex: i }));
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    return items;
  });

  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [selectedRight, setSelectedRight] = useState<number | null>(null);
  const [matches, setMatches] = useState<Map<number, number>>(new Map());
  const [answered, setAnswered] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const leftRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const rightRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const svgRef = useRef<SVGSVGElement>(null);
  const [lines, setLines] = useState<{ x1: number; y1: number; x2: number; y2: number; color: string }[]>([]);

  // Recalculate lines whenever matches change
  useEffect(() => {
    const updateLines = () => {
      if (!containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const newLines: typeof lines = [];
      let matchIdx = 0;
      matches.forEach((rightShuffledIdx, leftIdx) => {
        const leftEl = leftRefs.current[leftIdx];
        const rightEl = rightRefs.current[rightShuffledIdx];
        if (leftEl && rightEl) {
          const lr = leftEl.getBoundingClientRect();
          const rr = rightEl.getBoundingClientRect();
          const color = MATCH_COLORS[matchIdx % MATCH_COLORS.length].line;
          newLines.push({
            x1: lr.right - containerRect.left,
            y1: lr.top + lr.height / 2 - containerRect.top,
            x2: rr.left - containerRect.left,
            y2: rr.top + rr.height / 2 - containerRect.top,
            color,
          });
        }
        matchIdx++;
      });
      setLines(newLines);
    };
    updateLines();
    window.addEventListener('resize', updateLines);
    return () => window.removeEventListener('resize', updateLines);
  }, [matches]);

  // Try to create a match whenever both sides are selected
  useEffect(() => {
    if (answered) return;
    if (selectedLeft !== null && selectedRight !== null) {
      const newMatches = new Map(matches);
      newMatches.set(selectedLeft, selectedRight);
      setMatches(newMatches);
      setSelectedLeft(null);
      setSelectedRight(null);
    }
  }, [selectedLeft, selectedRight]);

  const handleLeftClick = (i: number) => {
    if (answered) return;
    if (matches.has(i)) {
      const newMatches = new Map(matches);
      newMatches.delete(i);
      setMatches(newMatches);
      setSelectedLeft(null);
      setSelectedRight(null);
      return;
    }
    setSelectedLeft(selectedLeft === i ? null : i);
  };

  const handleRightClick = (rightIdx: number) => {
    if (answered) return;
    const alreadyUsed = Array.from(matches.values()).includes(rightIdx);
    // If already used, undo that match
    if (alreadyUsed) {
      const newMatches = new Map(matches);
      for (const [l, r] of newMatches.entries()) {
        if (r === rightIdx) { newMatches.delete(l); break; }
      }
      setMatches(newMatches);
      setSelectedLeft(null);
      setSelectedRight(rightIdx);
      return;
    }
    setSelectedRight(selectedRight === rightIdx ? null : rightIdx);
  };

  const handleConfirm = () => {
    let correct = 0;
    matches.forEach((rightShuffledIdx, leftIdx) => {
      if (shuffledRight[rightShuffledIdx].originalIndex === leftIdx) correct++;
    });
    const isCorrect = correct === exercise.pairs.length;
    setAnswered(true);
    onAnswer({
      exerciseIndex: index,
      isCorrect,
      userAnswer: `${correct}/${exercise.pairs.length} corretas`,
    });
  };

  const getMatchIndex = (leftIdx: number): number | null => {
    if (!matches.has(leftIdx)) return null;
    return Array.from(matches.keys()).indexOf(leftIdx);
  };

  const getRightMatchIndex = (rightIdx: number): number | null => {
    for (const [leftIdx, rIdx] of matches.entries()) {
      if (rIdx === rightIdx) return Array.from(matches.keys()).indexOf(leftIdx);
    }
    return null;
  };

  const getMatchColorClass = (matchIdx: number | null) => {
    if (matchIdx === null) return null;
    return MATCH_COLORS[matchIdx % MATCH_COLORS.length];
  };

  const getResultColor = (leftIdx: number) => {
    if (!answered || !matches.has(leftIdx)) return '';
    const rightShuffledIdx = matches.get(leftIdx)!;
    const isCorrect = shuffledRight[rightShuffledIdx].originalIndex === leftIdx;
    return isCorrect ? 'border-success bg-success/10' : 'border-destructive bg-destructive/10';
  };

  const allMatched = matches.size === exercise.pairs.length;

  return (
    <Card className="animate-slide-up overflow-hidden">
      <CardContent className="p-5">
        <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-primary">
          Associação
        </div>
        <h2 className="mb-2 text-lg font-bold text-foreground">
          Conecte os conceitos relacionados
        </h2>
        <p className="mb-4 text-xs text-muted-foreground">
          Toque em qualquer lado para começar a conectar. Toque em um par já conectado para refazer.
        </p>

        <div className="relative" ref={containerRef}>
          {/* SVG lines overlay */}
          <svg
            ref={svgRef}
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
            style={{ overflow: 'visible' }}
          >
            {lines.map((l, i) => (
              <line
                key={i}
                x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
                stroke={l.color}
                strokeWidth={2.5}
                strokeLinecap="round"
                opacity={answered ? 0.4 : 0.8}
                className="transition-all duration-300"
              >
                <animate attributeName="stroke-dashoffset" from="100" to="0" dur="0.4s" fill="freeze" />
              </line>
            ))}
          </svg>

          <div className="grid grid-cols-2 gap-3">
            {/* Left column */}
            <div className="space-y-2">
              {exercise.pairs.map((pair, i) => {
                const matchIdx = getMatchIndex(i);
                const colorClass = getMatchColorClass(matchIdx);
                const isMatched = matches.has(i);
                return (
                  <button
                    key={`l-${i}`}
                    ref={el => { leftRefs.current[i] = el; }}
                    onClick={() => handleLeftClick(i)}
                    disabled={answered}
                    className={cn(
                      'w-full rounded-lg border-2 px-3 py-2.5 text-left text-sm font-medium transition-all duration-300 relative z-20',
                      selectedLeft === i && 'border-primary bg-primary/10 ring-2 ring-primary/30 shimmer-glow',
                      !answered && isMatched && colorClass && `${colorClass.border} ${colorClass.bg}`,
                      !answered && !isMatched && selectedLeft !== i && 'border-border hover:border-primary/50',
                      answered && getResultColor(i),
                    )}
                  >
                    <span className="flex items-center justify-between gap-1">
                      <span>{pair.left}</span>
                      {isMatched && !answered && colorClass && (
                        <span className={cn('text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center', colorClass.bg, colorClass.text)}>
                          {(matchIdx ?? 0) + 1}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Right column */}
            <div className="space-y-2">
              {shuffledRight.map((item, i) => {
                const isUsed = Array.from(matches.values()).includes(i);
                const matchIdx = getRightMatchIndex(i);
                const colorClass = getMatchColorClass(matchIdx);
                return (
                  <button
                    key={`r-${i}`}
                    ref={el => { rightRefs.current[i] = el; }}
                    onClick={() => handleRightClick(i)}
                    disabled={answered}
                    className={cn(
                      'w-full rounded-lg border-2 px-3 py-2.5 text-left text-sm font-medium transition-all duration-300 relative z-20',
                      selectedRight === i && 'border-accent bg-accent/10 ring-2 ring-accent/30 shimmer-glow',
                      !answered && isUsed && colorClass && `${colorClass.border} ${colorClass.bg}`,
                      !answered && !isUsed && selectedRight !== i && 'border-border hover:border-accent/50',
                      answered && isUsed && 'opacity-60',
                    )}
                  >
                    <span className="flex items-center justify-between gap-1">
                      <span>{item.text}</span>
                      {isUsed && !answered && colorClass && (
                        <span className={cn('text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center', colorClass.bg, colorClass.text)}>
                          {(matchIdx ?? 0) + 1}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Confirm button */}
        {allMatched && !answered && (
          <Button
            size="lg"
            className="mt-4 w-full gap-2 font-display font-bold"
            onClick={handleConfirm}
          >
            Confirmar Associações
          </Button>
        )}

        {/* Undo all */}
        {matches.size > 0 && !answered && !allMatched && (
          <button
            className="mt-3 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mx-auto"
            onClick={() => { setMatches(new Map()); setSelectedLeft(null); setSelectedRight(null); }}
          >
            <Undo2 className="h-3 w-3" /> Limpar tudo
          </button>
        )}

        {answered && (
          <div className={cn(
            'mt-4 rounded-lg px-4 py-3 text-sm',
            Array.from(matches.entries()).every(([l, r]) => shuffledRight[r].originalIndex === l)
              ? 'bg-success/10 text-success'
              : 'bg-destructive/10 text-destructive'
          )}>
            <p className="font-semibold">
              {Array.from(matches.entries()).every(([l, r]) => shuffledRight[r].originalIndex === l)
                ? '✅ Todas corretas!'
                : '❌ Algumas associações estão incorretas'}
            </p>
            <p className="mt-1 opacity-80">{exercise.explanation}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
