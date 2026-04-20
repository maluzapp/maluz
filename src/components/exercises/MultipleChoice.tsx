import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { fireCorrectConfetti } from './Confetti';
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
    if (isCorrect) fireCorrectConfetti();
    onAnswer({ exerciseIndex: index, isCorrect, userAnswer: exercise.options[optIndex] });
  };

  return (
    <div className="stage-card animate-slide-up rounded-2xl">
      <div className="relative p-5">
        <div className="mb-2 flex items-center gap-2 animate-fade-in">
          <span className="inline-flex h-6 items-center gap-1 rounded-full bg-primary/15 px-2.5 text-[10px] font-bold uppercase tracking-widest text-primary ring-1 ring-primary/30">
            🎯 Múltipla escolha
          </span>
        </div>
        <h2 className="mb-5 text-xl font-bold text-foreground animate-fade-in" style={{ animationDelay: '100ms' }}>
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
                  'option-btn w-full rounded-xl border-2 px-4 py-4 text-left text-base font-medium transition-all duration-300 animate-fade-in',
                  !answered && 'border-border/60 hover:border-primary hover:bg-primary/5 hover:scale-[1.02] active:scale-[0.98]',
                  answered && isCorrect && 'option-btn-correct animate-bounce-in border-success text-success',
                  answered && isSelected && !isCorrect && 'option-btn-wrong animate-shake border-destructive text-destructive',
                  answered && !isSelected && !isCorrect && 'border-border/40 opacity-40 scale-95'
                )}
                style={{ animationDelay: `${(i + 2) * 80}ms` }}
              >
                <span className={cn(
                  'mr-3 inline-flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold transition-all',
                  'bg-gradient-to-br from-primary/25 to-primary/5 text-primary ring-1 ring-primary/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_0_8px_hsl(var(--primary)/0.25)]',
                  answered && isCorrect && 'from-success/30 to-success/10 text-success ring-success/40 shadow-[0_0_12px_hsl(var(--success)/0.5)]',
                  answered && isSelected && !isCorrect && 'from-destructive/30 to-destructive/10 text-destructive ring-destructive/40'
                )}>
                  {String.fromCharCode(65 + i)}
                </span>
                {opt}
              </button>
            );
          })}
        </div>
        {answered && (
          <div className={cn(
            'mt-4 rounded-xl px-4 py-3 text-sm animate-slide-up ring-1',
            selected === exercise.correctIndex
              ? 'bg-success/10 text-success ring-success/30 shadow-[0_0_18px_hsl(var(--success)/0.25)]'
              : 'bg-destructive/10 text-destructive ring-destructive/30'
          )}>
            <p className="font-semibold text-base">
              {selected === exercise.correctIndex ? '🎉 Correto!' : '😔 Incorreto'}
            </p>
            <p className="mt-1 opacity-80">{exercise.explanation}</p>
          </div>
        )}
      </div>
    </div>
  );
}
