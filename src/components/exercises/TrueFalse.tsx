import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { fireCorrectConfetti } from './Confetti';
import type { TrueFalseExercise, ExerciseAnswer } from '@/types/study';

interface Props {
  exercise: TrueFalseExercise;
  index: number;
  onAnswer: (answer: ExerciseAnswer) => void;
  readOnly?: boolean;
  savedAnswer?: ExerciseAnswer;
}

export function TrueFalse({ exercise, index, onAnswer, readOnly, savedAnswer }: Props) {
  const [selected, setSelected] = useState<boolean | null>(() => {
    if (readOnly && savedAnswer) return savedAnswer.userAnswer === 'Verdadeiro';
    return null;
  });
  const answered = selected !== null;

  const handleSelect = (value: boolean) => {
    if (answered) return;
    setSelected(value);
    const isCorrect = value === exercise.correct;
    if (isCorrect) fireCorrectConfetti();
    onAnswer({ exerciseIndex: index, isCorrect, userAnswer: value ? 'Verdadeiro' : 'Falso' });
  };

  return (
    <Card className="animate-slide-up overflow-hidden">
      <CardContent className="p-5">
        <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-primary animate-fade-in">
          Verdadeiro ou Falso
        </div>
        <h2 className="mb-6 text-xl font-bold text-foreground animate-fade-in" style={{ animationDelay: '100ms' }}>
          {exercise.statement}
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {[true, false].map((val, i) => {
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
                  'text-lg font-bold h-[72px] rounded-xl transition-all duration-300 animate-fade-in hover:scale-[1.03] active:scale-[0.97]',
                  answered && isCorrectAnswer && 'animate-bounce-in border-success bg-success/10 text-success shadow-md shadow-success/20',
                  answered && isSelected && !isCorrectAnswer && 'animate-shake border-destructive bg-destructive/10 text-destructive',
                  answered && !isSelected && !isCorrectAnswer && 'opacity-40 scale-95'
                )}
                style={{ animationDelay: `${(i + 2) * 100}ms` }}
              >
                {val ? '✅ Verdadeiro' : '❌ Falso'}
              </Button>
            );
          })}
        </div>
        {answered && (
          <div className={cn(
            'mt-4 rounded-xl px-4 py-3 text-sm animate-slide-up',
            selected === exercise.correct ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
          )}>
            <p className="font-semibold text-base">
              {selected === exercise.correct ? '🎉 Correto!' : '😔 Incorreto'}
            </p>
            <p className="mt-1 opacity-80">{exercise.explanation}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
