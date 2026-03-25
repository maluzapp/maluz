import { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { MatchingExercise, ExerciseAnswer } from '@/types/study';

interface Props {
  exercise: MatchingExercise;
  index: number;
  onAnswer: (answer: ExerciseAnswer) => void;
}

export function Matching({ exercise, index, onAnswer }: Props) {
  // Shuffle right side once
  const [shuffledRight] = useState(() => {
    const items = exercise.pairs.map((p, i) => ({ text: p.right, originalIndex: i }));
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    return items;
  });

  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [matches, setMatches] = useState<Map<number, number>>(new Map());
  const [answered, setAnswered] = useState(false);

  const allMatched = matches.size === exercise.pairs.length;

  const handleLeftClick = (i: number) => {
    if (answered || matches.has(i)) return;
    setSelectedLeft(i);
  };

  const handleRightClick = useCallback((rightIdx: number) => {
    if (answered || selectedLeft === null) return;
    // Check if this right item is already matched
    const alreadyUsed = Array.from(matches.values()).includes(rightIdx);
    if (alreadyUsed) return;

    const newMatches = new Map(matches);
    newMatches.set(selectedLeft, rightIdx);
    setMatches(newMatches);
    setSelectedLeft(null);

    // If all matched, check answers
    if (newMatches.size === exercise.pairs.length) {
      let correct = 0;
      newMatches.forEach((rightShuffledIdx, leftIdx) => {
        if (shuffledRight[rightShuffledIdx].originalIndex === leftIdx) correct++;
      });
      const isCorrect = correct === exercise.pairs.length;
      setAnswered(true);
      onAnswer({
        exerciseIndex: index,
        isCorrect,
        userAnswer: `${correct}/${exercise.pairs.length} corretas`,
      });
    }
  }, [selectedLeft, matches, answered, exercise, shuffledRight, index, onAnswer]);

  const getMatchColor = (leftIdx: number) => {
    if (!answered || !matches.has(leftIdx)) return '';
    const rightShuffledIdx = matches.get(leftIdx)!;
    const isCorrect = shuffledRight[rightShuffledIdx].originalIndex === leftIdx;
    return isCorrect ? 'border-success bg-success/10' : 'border-destructive bg-destructive/10';
  };

  return (
    <Card>
      <CardContent className="p-5">
        <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-primary">
          Associação
        </div>
        <h2 className="mb-5 text-lg font-bold text-foreground">
          Conecte os conceitos relacionados
        </h2>

        <div className="grid grid-cols-2 gap-3">
          {/* Left column */}
          <div className="space-y-2">
            {exercise.pairs.map((pair, i) => (
              <button
                key={`l-${i}`}
                onClick={() => handleLeftClick(i)}
                disabled={answered || matches.has(i)}
                className={cn(
                  'w-full rounded-lg border-2 px-3 py-2.5 text-left text-sm font-medium transition-all',
                  selectedLeft === i && 'border-primary bg-primary/10',
                  matches.has(i) && !answered && 'border-muted bg-muted/50 opacity-60',
                  answered && getMatchColor(i),
                  !matches.has(i) && selectedLeft !== i && 'border-border hover:border-primary/50'
                )}
              >
                {pair.left}
              </button>
            ))}
          </div>

          {/* Right column */}
          <div className="space-y-2">
            {shuffledRight.map((item, i) => {
              const isUsed = Array.from(matches.values()).includes(i);
              return (
                <button
                  key={`r-${i}`}
                  onClick={() => handleRightClick(i)}
                  disabled={answered || isUsed || selectedLeft === null}
                  className={cn(
                    'w-full rounded-lg border-2 px-3 py-2.5 text-left text-sm font-medium transition-all',
                    isUsed && !answered && 'border-muted bg-muted/50 opacity-60',
                    selectedLeft !== null && !isUsed && 'border-accent hover:bg-accent/10',
                    selectedLeft === null && !isUsed && 'border-border',
                    answered && isUsed && 'opacity-60'
                  )}
                >
                  {item.text}
                </button>
              );
            })}
          </div>
        </div>

        {answered && (
          <div className={cn(
            'mt-4 rounded-lg px-4 py-3 text-sm',
            matches.size === exercise.pairs.length &&
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
