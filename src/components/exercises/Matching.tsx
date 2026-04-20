import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Undo2, Check, X } from 'lucide-react';
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
  { line: '#6366F1', bg: 'bg-[hsl(239,84%,67%)]/15', border: 'border-[hsl(239,84%,67%)]', text: 'text-[hsl(239,84%,67%)]' },
  { line: '#F59E0B', bg: 'bg-[hsl(38,92%,50%)]/15', border: 'border-[hsl(38,92%,50%)]', text: 'text-[hsl(38,92%,50%)]' },
  { line: '#10B981', bg: 'bg-[hsl(160,84%,39%)]/15', border: 'border-[hsl(160,84%,39%)]', text: 'text-[hsl(160,84%,39%)]' },
  { line: '#EC4899', bg: 'bg-[hsl(330,81%,60%)]/15', border: 'border-[hsl(330,81%,60%)]', text: 'text-[hsl(330,81%,60%)]' },
  { line: '#8B5CF6', bg: 'bg-[hsl(258,90%,66%)]/15', border: 'border-[hsl(258,90%,66%)]', text: 'text-[hsl(258,90%,66%)]' },
  { line: '#14B8A6', bg: 'bg-[hsl(173,80%,40%)]/15', border: 'border-[hsl(173,80%,40%)]', text: 'text-[hsl(173,80%,40%)]' },
];

interface CurveLine {
  path: string;
  color: string;
  isCorrect?: boolean;
}

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
  const [curves, setCurves] = useState<CurveLine[]>([]);

  const updateLines = useCallback(() => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const newCurves: CurveLine[] = [];
    let matchIdx = 0;
    matches.forEach((rightShuffledIdx, leftIdx) => {
      const leftEl = leftRefs.current[leftIdx];
      const rightEl = rightRefs.current[rightShuffledIdx];
      if (leftEl && rightEl) {
        const lr = leftEl.getBoundingClientRect();
        const rr = rightEl.getBoundingClientRect();
        const x1 = lr.right - containerRect.left;
        const y1 = lr.top + lr.height / 2 - containerRect.top;
        const x2 = rr.left - containerRect.left;
        const y2 = rr.top + rr.height / 2 - containerRect.top;

        // Cubic bezier curve with horizontal control points
        const dx = (x2 - x1) * 0.45;
        const path = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;

        let color = MATCH_COLORS[matchIdx % MATCH_COLORS.length].line;
        let isCorrect: boolean | undefined;
        if (answered) {
          isCorrect = shuffledRight[rightShuffledIdx].originalIndex === leftIdx;
          color = isCorrect ? 'hsl(142, 71%, 45%)' : 'hsl(0, 84%, 60%)';
        }

        newCurves.push({ path, color, isCorrect });
      }
      matchIdx++;
    });
    setCurves(newCurves);
  }, [matches, answered, shuffledRight]);

  useEffect(() => {
    updateLines();
    window.addEventListener('resize', updateLines);
    return () => window.removeEventListener('resize', updateLines);
  }, [updateLines]);

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
    if (isCorrect) fireCorrectConfetti();
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

  const isLeftCorrect = (leftIdx: number): boolean | null => {
    if (!answered || !matches.has(leftIdx)) return null;
    const rightShuffledIdx = matches.get(leftIdx)!;
    return shuffledRight[rightShuffledIdx].originalIndex === leftIdx;
  };

  const isRightCorrect = (rightIdx: number): boolean | null => {
    if (!answered) return null;
    for (const [leftIdx, rIdx] of matches.entries()) {
      if (rIdx === rightIdx) {
        return shuffledRight[rightIdx].originalIndex === leftIdx;
      }
    }
    return null;
  };

  const allMatched = matches.size === exercise.pairs.length;
  const allCorrect = answered && Array.from(matches.entries()).every(([l, r]) => shuffledRight[r].originalIndex === l);

  return (
    <div className="stage-card animate-slide-up rounded-2xl">
      <div className="relative p-5">
        <div className="mb-2 flex items-center gap-2">
          <span className="inline-flex h-6 items-center gap-1 rounded-full bg-primary/15 px-2.5 text-[10px] font-bold uppercase tracking-widest text-primary ring-1 ring-primary/30">
            🔗 Associação
          </span>
        </div>
        <h2 className="mb-2 text-xl font-bold text-foreground">
          Conecte os conceitos relacionados
        </h2>
        <p className="mb-4 text-xs text-muted-foreground">
          Toque em qualquer lado para conectar. Toque em um par já conectado para refazer.
        </p>

        <div className="relative" ref={containerRef}>
          {/* SVG curved lines overlay */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
            style={{ overflow: 'visible' }}
          >
            {curves.map((c, i) => (
              <path
                key={i}
                d={c.path}
                stroke={c.color}
                strokeWidth={answered ? 3 : 2.5}
                strokeLinecap="round"
                fill="none"
                opacity={answered ? 0.85 : 0.7}
                className="transition-all duration-300"
                strokeDasharray={answered ? 'none' : '1000'}
                strokeDashoffset="0"
              >
                {!answered && (
                  <animate attributeName="stroke-dashoffset" from="1000" to="0" dur="0.5s" fill="freeze" />
                )}
              </path>
            ))}
          </svg>

          <div className="grid grid-cols-[1fr_24px_1fr] items-start">
            {/* Left column */}
            <div className="space-y-2.5">
              {exercise.pairs.map((pair, i) => {
                const matchIdx = getMatchIndex(i);
                const colorClass = getMatchColorClass(matchIdx);
                const isMatched = matches.has(i);
                const correctResult = isLeftCorrect(i);

                return (
                  <button
                    key={`l-${i}`}
                    ref={el => { leftRefs.current[i] = el; }}
                    onClick={() => handleLeftClick(i)}
                    disabled={answered}
                    className={cn(
                      'w-full rounded-xl border-2 px-3 py-3.5 text-left text-sm font-medium transition-all duration-200 relative z-20',
                      // Before answer
                      !answered && selectedLeft === i && 'border-primary bg-primary/10 ring-2 ring-primary/30 scale-[1.02]',
                      !answered && isMatched && colorClass && `${colorClass.border} ${colorClass.bg}`,
                      !answered && !isMatched && selectedLeft !== i && 'border-border bg-card hover:border-primary/50',
                      // After answer
                      answered && correctResult === true && 'border-success bg-success/10',
                      answered && correctResult === false && 'border-destructive bg-destructive/10',
                      answered && correctResult === null && 'border-border bg-card opacity-60',
                    )}
                  >
                    <span className="flex items-center justify-between gap-1">
                      <span className="flex-1">{pair.left}</span>
                      {answered && correctResult === true && <Check className="h-4 w-4 text-success shrink-0" />}
                      {answered && correctResult === false && <X className="h-4 w-4 text-destructive shrink-0" />}
                      {isMatched && !answered && colorClass && (
                        <span className={cn('text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shrink-0', colorClass.bg, colorClass.text)}>
                          {(matchIdx ?? 0) + 1}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Gap for curves */}
            <div />

            {/* Right column */}
            <div className="space-y-2.5">
              {shuffledRight.map((item, i) => {
                const isUsed = Array.from(matches.values()).includes(i);
                const matchIdx = getRightMatchIndex(i);
                const colorClass = getMatchColorClass(matchIdx);
                const correctResult = isRightCorrect(i);

                return (
                  <button
                    key={`r-${i}`}
                    ref={el => { rightRefs.current[i] = el; }}
                    onClick={() => handleRightClick(i)}
                    disabled={answered}
                    className={cn(
                      'w-full rounded-xl border-2 px-3 py-3.5 text-left text-sm font-medium transition-all duration-200 relative z-20',
                      // Before answer
                      !answered && selectedRight === i && 'border-accent bg-accent/10 ring-2 ring-accent/30 scale-[1.02]',
                      !answered && isUsed && colorClass && `${colorClass.border} ${colorClass.bg}`,
                      !answered && !isUsed && selectedRight !== i && 'border-border bg-card hover:border-accent/50',
                      // After answer
                      answered && correctResult === true && 'border-success bg-success/10',
                      answered && correctResult === false && 'border-destructive bg-destructive/10',
                      answered && correctResult === null && 'border-border bg-card opacity-60',
                    )}
                  >
                    <span className="flex items-center justify-between gap-1">
                      <span className="flex-1">{item.text}</span>
                      {answered && correctResult === true && <Check className="h-4 w-4 text-success shrink-0" />}
                      {answered && correctResult === false && <X className="h-4 w-4 text-destructive shrink-0" />}
                      {isUsed && !answered && colorClass && (
                        <span className={cn('text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shrink-0', colorClass.bg, colorClass.text)}>
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
          <Card className={cn(
            'mt-4 p-4',
            allCorrect ? 'border-success bg-success/10' : 'border-destructive bg-destructive/10'
          )}>
            <div className="flex items-center gap-2 mb-1">
              {allCorrect ? <Check className="h-5 w-5 text-success" /> : <X className="h-5 w-5 text-destructive" />}
              <span className="font-display font-bold text-foreground">
                {allCorrect ? 'Perfeito!' : 'Algumas associações estão incorretas'}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{exercise.explanation}</p>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}
