import { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GripVertical, Check, X, ArrowUp, ArrowDown } from 'lucide-react';
import type { OrderingExercise, ExerciseAnswer } from '@/types/study';

interface Props {
  exercise: OrderingExercise;
  index: number;
  onAnswer: (answer: ExerciseAnswer) => void;
}

export function Ordering({ exercise, index, onAnswer }: Props) {
  // Shuffle items initially
  const [order, setOrder] = useState<number[]>(() => {
    const indices = exercise.items.map((_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return indices;
  });
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const moveItem = useCallback((fromIdx: number, dir: -1 | 1) => {
    if (submitted) return;
    const toIdx = fromIdx + dir;
    if (toIdx < 0 || toIdx >= order.length) return;
    setOrder(prev => {
      const next = [...prev];
      [next[fromIdx], next[toIdx]] = [next[toIdx], next[fromIdx]];
      return next;
    });
  }, [submitted, order.length]);

  const handleSubmit = () => {
    const correct = order.every((itemIdx, pos) => exercise.correctOrder[pos] === itemIdx);
    setIsCorrect(correct);
    setSubmitted(true);
    onAnswer({ exerciseIndex: index, isCorrect: correct, userAnswer: order.join(',') });
  };

  return (
    <div className="animate-fade-in">
      <h2 className="font-display text-lg font-bold text-foreground mb-1">Ordene corretamente</h2>
      <p className="text-sm text-muted-foreground mb-4">{exercise.question}</p>

      <div className="space-y-2 mb-4">
        {order.map((itemIdx, pos) => {
          const isRight = submitted && exercise.correctOrder[pos] === itemIdx;
          const isWrong = submitted && !isRight;
          return (
            <div
              key={itemIdx}
              className={`flex items-center gap-2 rounded-lg border p-3 transition-all ${
                isRight ? 'border-success bg-success/10' :
                isWrong ? 'border-destructive bg-destructive/10' :
                'border-border bg-card'
              }`}
            >
              <GripVertical className="h-5 w-5 text-muted-foreground shrink-0" />
              <span className="flex-1 text-base font-body text-foreground">{exercise.items[itemIdx]}</span>
              {!submitted && (
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => moveItem(pos, -1)}
                    disabled={pos === 0}
                    className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-30 active:scale-90 transition-all"
                  >
                    <ArrowUp className="h-5 w-5 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => moveItem(pos, 1)}
                    disabled={pos === order.length - 1}
                    className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-30 active:scale-90 transition-all"
                  >
                    <ArrowDown className="h-5 w-5 text-muted-foreground" />
                  </button>
                </div>
              )}
              {submitted && (isRight ? <Check className="h-5 w-5 text-success" /> : <X className="h-5 w-5 text-destructive" />)}
            </div>
          );
        })}
      </div>

      {!submitted && (
        <Button onClick={handleSubmit} className="w-full font-display font-bold">
          Confirmar Ordem
        </Button>
      )}

      {submitted && (
        <Card className={`p-4 ${isCorrect ? 'border-success bg-success/10' : 'border-destructive bg-destructive/10'}`}>
          <div className="flex items-center gap-2 mb-1">
            {isCorrect ? <Check className="h-5 w-5 text-success" /> : <X className="h-5 w-5 text-destructive" />}
            <span className="font-display font-bold text-foreground">{isCorrect ? 'Perfeito!' : 'Ordem incorreta'}</span>
          </div>
          <p className="text-sm text-muted-foreground">{exercise.explanation}</p>
          {!isCorrect && (
            <p className="text-xs text-muted-foreground mt-2">
              Ordem correta: {exercise.correctOrder.map(i => exercise.items[i]).join(' → ')}
            </p>
          )}
        </Card>
      )}
    </div>
  );
}
