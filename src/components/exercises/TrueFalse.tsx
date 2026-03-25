import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { TrueFalseExercise, ExerciseAnswer } from '@/types/study';

interface Props {
  exercise: TrueFalseExercise;
  index: number;
  onAnswer: (answer: ExerciseAnswer) => void;
}

export function TrueFalse({ exercise, index, onAnswer }: Props) {
  const [selected, setSelected] = useState<boolean | null>(null);
  const answered = selected !== null;

  const handleSelect = (value: boolean) => {
    if (answered) return;
    setSelected(value);
    const isCorrect = value === exercise.correct;
    onAnswer({ exerciseIndex: index, isCorrect, userAnswer: value ? 'Verdadeiro' : 'Falso' });
  };

  return (
    <Card>
      <CardContent className="p-5">
        <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-primary">
          Verdadeiro ou Falso
        </div>
        <h2 className="mb-6 text-lg font-bold text-foreground">{exercise.statement}</h2>
        <div className="grid grid-cols-2 gap-3">
          {[true, false].map((val) => {
            const isCorrectAnswer = val === exercise.correct;
            const isSelected = val === selected;
            return (
              <Button
                key={String(val)}
                variant="outline"
                size="lg"
                onClick={() => handleSelect(val)}
                disabled={answered}
                className={cn(
                  'text-base font-bold',
                  answered && isCorrectAnswer && 'animate-pop border-success bg-success/10 text-success',
                  answered && isSelected && !isCorrectAnswer && 'animate-shake border-destructive bg-destructive/10 text-destructive',
                  answered && !isSelected && !isCorrectAnswer && 'opacity-50'
                )}
              >
                {val ? '✅ Verdadeiro' : '❌ Falso'}
              </Button>
            );
          })}
        </div>
        {answered && (
          <div className={cn(
            'mt-4 rounded-lg px-4 py-3 text-sm',
            selected === exercise.correct ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
          )}>
            <p className="font-semibold">
              {selected === exercise.correct ? '✅ Correto!' : '❌ Incorreto'}
            </p>
            <p className="mt-1 opacity-80">{exercise.explanation}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
