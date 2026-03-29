import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { fireCorrectConfetti } from './Confetti';
import type { FillBlankExercise, ExerciseAnswer } from '@/types/study';

interface Props {
  exercise: FillBlankExercise;
  index: number;
  onAnswer: (answer: ExerciseAnswer) => void;
  readOnly?: boolean;
  savedAnswer?: ExerciseAnswer;
}

export function FillBlank({ exercise, index, onAnswer, readOnly, savedAnswer }: Props) {
  const [value, setValue] = useState(savedAnswer?.userAnswer || '');
  const [answered, setAnswered] = useState(!!readOnly);
  const [isCorrect, setIsCorrect] = useState(savedAnswer?.isCorrect ?? false);
  const [feedback, setFeedback] = useState('');
  const [validating, setValidating] = useState(false);

  const handleSubmit = async () => {
    if (!value.trim() || answered || validating) return;
    setValidating(true);

    try {
      const { data, error } = await supabase.functions.invoke('validate-answer', {
        body: {
          sentence: exercise.sentence,
          expectedAnswer: exercise.answer,
          userAnswer: value.trim(),
        },
      });

      if (error) throw error;
      const correct = data?.correct ?? (value.trim().toLowerCase() === exercise.answer.trim().toLowerCase());
      const fb = data?.feedback || '';
      setIsCorrect(correct);
      setFeedback(fb);
      setAnswered(true);
      onAnswer({ exerciseIndex: index, isCorrect: correct, userAnswer: value.trim() });
    } catch {
      // Fallback to exact match
      const correct = value.trim().toLowerCase() === exercise.answer.trim().toLowerCase();
      setIsCorrect(correct);
      setAnswered(true);
      onAnswer({ exerciseIndex: index, isCorrect: correct, userAnswer: value.trim() });
    } finally {
      setValidating(false);
    }
  };

  const parts = exercise.sentence.split('___');

  return (
    <Card className="animate-slide-up overflow-hidden">
      <CardContent className="p-5">
        <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-primary animate-fade-in">
          Preencher lacuna
        </div>
        <div className="mb-5 text-lg font-bold text-foreground animate-fade-in" style={{ animationDelay: '100ms' }}>
          {parts[0]}
          <span className={cn(
            'mx-1 inline-block min-w-[100px] border-b-3 px-1 text-center transition-all duration-500',
            answered && isCorrect && 'border-success text-success animate-bounce-in',
            answered && !isCorrect && 'border-destructive text-destructive animate-shake',
            !answered && 'border-primary animate-pulse'
          )}>
            {answered ? (isCorrect ? value : exercise.answer) : value || '___'}
          </span>
          {parts[1]}
        </div>

        {!answered && !readOnly ? (
          <div className="flex gap-2 animate-fade-in" style={{ animationDelay: '200ms' }}>
            <Input
              placeholder="Sua resposta..."
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              autoFocus
              className="rounded-xl"
              disabled={validating}
            />
            <Button onClick={handleSubmit} disabled={!value.trim() || validating} className="rounded-xl">
              {validating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enviar'}
            </Button>
          </div>
        ) : (
          <div className={cn(
            'rounded-xl px-4 py-3 text-sm animate-slide-up',
            isCorrect ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
          )}>
            <p className="font-semibold text-base">
              {isCorrect ? '🎉 Correto!' : `😔 Incorreto — Resposta: ${exercise.answer}`}
            </p>
            {!isCorrect && value && value.trim().toLowerCase() !== exercise.answer.trim().toLowerCase() && (
              <p className="mt-0.5 text-xs opacity-70">Sua resposta: {readOnly ? savedAnswer?.userAnswer : value}</p>
            )}
            {feedback && <p className="mt-1 opacity-80">{feedback}</p>}
            <p className="mt-1 opacity-80">{exercise.explanation}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
