import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { MultipleChoiceExercise, ExerciseAnswer } from '@/types/study';

interface Props {
  exercise: MultipleChoiceExercise;
  index: number;
  onAnswer: (answer: ExerciseAnswer) => void;
}

export function MultipleChoice({ exercise, index, onAnswer }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const answered = selected !== null;

  const handleSelect = (optIndex: number) => {
    if (answered) return;
    setSelected(optIndex);
    const isCorrect = optIndex === exercise.correctIndex;
    onAnswer({ exerciseIndex: index, isCorrect, userAnswer: exercise.options[optIndex] });
  };

  return (
    <Card>
      <CardContent className="p-5">
        <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-primary">
          Múltipla escolha
        </div>
        <h2 className="mb-5 text-lg font-bold text-foreground">{exercise.question}</h2>
        <div className="space-y-2.5">
          {exercise.options.map((opt, i) => {
            const isCorrect = i === exercise.correctIndex;
            const isSelected = i === selected;
            return (
              <button
                key={i}
                onClick={() => handleSelect(i)}
                disabled={answered}
                className={cn(
                  'w-full rounded-lg border-2 px-4 py-3 text-left text-sm font-medium transition-all',
                  !answered && 'border-border hover:border-primary hover:bg-primary/5',
                  answered && isCorrect && 'animate-pop border-success bg-success/10 text-success',
                  answered && isSelected && !isCorrect && 'animate-shake border-destructive bg-destructive/10 text-destructive',
                  answered && !isSelected && !isCorrect && 'border-border opacity-50'
                )}
              >
                <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-bold">
                  {String.fromCharCode(65 + i)}
                </span>
                {opt}
              </button>
            );
          })}
        </div>
        {answered && (
          <div className={cn(
            'mt-4 rounded-lg px-4 py-3 text-sm',
            selected === exercise.correctIndex ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
          )}>
            <p className="font-semibold">
              {selected === exercise.correctIndex ? '✅ Correto!' : '❌ Incorreto'}
            </p>
            <p className="mt-1 opacity-80">{exercise.explanation}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
