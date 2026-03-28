import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { MultipleChoiceExercise, ExerciseAnswer } from '@/types/study';

interface Props {
  exercise: MultipleChoiceExercise;
  index: number;
  onAnswer: (answer: ExerciseAnswer) => void;
  readOnly?: boolean;
  savedAnswer?: ExerciseAnswer;
}

export function MultipleChoice({ exercise, index, onAnswer, readOnly, savedAnswer }: Props) {
  const [selected, setSelected] = useState<number | null>(() => {
    if (readOnly && savedAnswer) {
      return exercise.options.indexOf(savedAnswer.userAnswer);
    }
    return null;
  });
  const answered = selected !== null;

  const handleSelect = (optIndex: number) => {
    if (answered) return;
    setSelected(optIndex);
    const isCorrect = optIndex === exercise.correctIndex;
    onAnswer({ exerciseIndex: index, isCorrect, userAnswer: exercise.options[optIndex] });
  };

  return (
    <Card className="animate-slide-up overflow-hidden">
      <CardContent className="p-5">
        <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-primary animate-fade-in">
          Múltipla escolha
        </div>
        <h2 className="mb-5 text-lg font-bold text-foreground animate-fade-in" style={{ animationDelay: '100ms' }}>
          {exercise.question}
        </h2>
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
                  'w-full rounded-xl border-2 px-4 py-3.5 text-left text-sm font-medium transition-all duration-300 animate-fade-in',
                  !answered && 'border-border hover:border-primary hover:bg-primary/5 hover:scale-[1.02] active:scale-[0.98]',
                  answered && isCorrect && 'animate-bounce-in border-success bg-success/10 text-success shadow-md shadow-success/20',
                  answered && isSelected && !isCorrect && 'animate-shake border-destructive bg-destructive/10 text-destructive',
                  answered && !isSelected && !isCorrect && 'border-border opacity-40 scale-95'
                )}
                style={{ animationDelay: `${(i + 2) * 80}ms` }}
              >
                <span className="mr-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-bold transition-colors">
                  {String.fromCharCode(65 + i)}
                </span>
                {opt}
              </button>
            );
          })}
        </div>
        {answered && (
          <div className={cn(
            'mt-4 rounded-xl px-4 py-3 text-sm animate-slide-up',
            selected === exercise.correctIndex ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
          )}>
            <p className="font-semibold text-base">
              {selected === exercise.correctIndex ? '🎉 Correto!' : '😔 Incorreto'}
            </p>
            <p className="mt-1 opacity-80">{exercise.explanation}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
