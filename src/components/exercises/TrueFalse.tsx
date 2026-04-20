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
    <div className="stage-card animate-slide-up rounded-2xl">
      <div className="relative p-5">
        <div className="mb-2 flex items-center gap-2 animate-fade-in">
          <span className="inline-flex h-6 items-center gap-1 rounded-full bg-primary/15 px-2.5 text-[10px] font-bold uppercase tracking-widest text-primary ring-1 ring-primary/30">
            ⚖️ Verdadeiro ou Falso
          </span>
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
                  'option-btn text-lg font-bold h-[80px] rounded-2xl transition-all duration-300 animate-fade-in hover:scale-[1.04] active:scale-[0.97] border-2',
                  !answered && (val ? 'border-success/40 hover:border-success hover:bg-success/10' : 'border-destructive/40 hover:border-destructive hover:bg-destructive/10'),
                  answered && isCorrectAnswer && 'option-btn-correct animate-bounce-in border-success text-success',
                  answered && isSelected && !isCorrectAnswer && 'option-btn-wrong animate-shake border-destructive text-destructive',
                  answered && !isSelected && !isCorrectAnswer && 'opacity-40 scale-95'
                )}
                style={{ animationDelay: `${(i + 2) * 100}ms` }}
              >
                <span className="text-3xl mr-2 emoji-3d">{val ? '✅' : '❌'}</span>
                {val ? 'Verdadeiro' : 'Falso'}
              </Button>
            );
          })}
        </div>
        {answered && (
          <div className={cn(
            'mt-4 rounded-xl px-4 py-3 text-sm animate-slide-up ring-1',
            selected === exercise.correct
              ? 'bg-success/10 text-success ring-success/30 shadow-[0_0_18px_hsl(var(--success)/0.25)]'
              : 'bg-destructive/10 text-destructive ring-destructive/30'
          )}>
            <p className="font-semibold text-base">
              {selected === exercise.correct ? '🎉 Correto!' : '😔 Incorreto'}
            </p>
            <p className="mt-1 opacity-80">{exercise.explanation}</p>
          </div>
        )}
      </div>
    </div>
  );
}
