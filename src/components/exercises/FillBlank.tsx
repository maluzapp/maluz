import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { FillBlankExercise, ExerciseAnswer } from '@/types/study';

interface Props {
  exercise: FillBlankExercise;
  index: number;
  onAnswer: (answer: ExerciseAnswer) => void;
}

export function FillBlank({ exercise, index, onAnswer }: Props) {
  const [value, setValue] = useState('');
  const [answered, setAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const handleSubmit = () => {
    if (!value.trim() || answered) return;
    const correct = value.trim().toLowerCase() === exercise.answer.trim().toLowerCase();
    setIsCorrect(correct);
    setAnswered(true);
    onAnswer({ exerciseIndex: index, isCorrect: correct, userAnswer: value.trim() });
  };

  // Split sentence by ___
  const parts = exercise.sentence.split('___');

  return (
    <Card>
      <CardContent className="p-5">
        <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-primary">
          Preencher lacuna
        </div>
        <div className="mb-5 text-lg font-bold text-foreground">
          {parts[0]}
          <span className={cn(
            'mx-1 inline-block min-w-[100px] border-b-2 px-1 text-center',
            answered && isCorrect && 'border-success text-success',
            answered && !isCorrect && 'border-destructive text-destructive',
            !answered && 'border-primary'
          )}>
            {answered ? (isCorrect ? value : exercise.answer) : value || '___'}
          </span>
          {parts[1]}
        </div>

        {!answered ? (
          <div className="flex gap-2">
            <Input
              placeholder="Sua resposta..."
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              autoFocus
            />
            <Button onClick={handleSubmit} disabled={!value.trim()}>
              Enviar
            </Button>
          </div>
        ) : (
          <div className={cn(
            'rounded-lg px-4 py-3 text-sm',
            isCorrect ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
          )}>
            <p className="font-semibold">
              {isCorrect ? '✅ Correto!' : `❌ Incorreto — Resposta: ${exercise.answer}`}
            </p>
            <p className="mt-1 opacity-80">{exercise.explanation}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
