import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Check, X } from 'lucide-react';
import type { CompleteSentenceExercise, ExerciseAnswer } from '@/types/study';

interface Props {
  exercise: CompleteSentenceExercise;
  index: number;
  onAnswer: (answer: ExerciseAnswer) => void;
}

export function CompleteSentence({ exercise, index, onAnswer }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSelect = (optIdx: number) => {
    if (submitted) return;
    setSelected(optIdx);
    setSubmitted(true);
    const correct = optIdx === exercise.correctIndex;
    onAnswer({ exerciseIndex: index, isCorrect: correct, userAnswer: exercise.options[optIdx] });
  };

  // Split sentence at "___"
  const parts = exercise.sentence.split('___');

  return (
    <div className="animate-fade-in">
      <h2 className="font-display text-xl font-bold text-foreground mb-1">Complete a frase</h2>

      <div className="rounded-xl bg-card border border-border p-4 mb-4">
        <p className="text-foreground text-base leading-relaxed font-body">
          {parts[0]}
          <span className={`inline-block min-w-[80px] mx-1 px-2 py-0.5 rounded-md text-center font-bold border-b-2 ${
            submitted && selected !== null
              ? selected === exercise.correctIndex
                ? 'bg-success/20 border-success text-success'
                : 'bg-destructive/20 border-destructive text-destructive'
              : 'bg-muted/50 border-primary/50 text-primary'
          }`}>
            {submitted && selected !== null ? exercise.options[selected] : '______'}
          </span>
          {parts[1] || ''}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        {exercise.options.map((opt, i) => {
          const isSelected = selected === i;
          const isCorrectOpt = i === exercise.correctIndex;
          let cls = 'border-border bg-card hover:border-primary/50';
          if (submitted) {
            if (isCorrectOpt) cls = 'border-success bg-success/10';
            else if (isSelected) cls = 'border-destructive bg-destructive/10';
            else cls = 'border-border bg-card opacity-50';
          }
          return (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              disabled={submitted}
              className={`rounded-xl border-2 p-4 text-base font-body text-foreground text-left transition-all ${cls}`}
            >
              {opt}
              {submitted && isCorrectOpt && <Check className="inline h-4 w-4 text-success ml-1" />}
              {submitted && isSelected && !isCorrectOpt && <X className="inline h-4 w-4 text-destructive ml-1" />}
            </button>
          );
        })}
      </div>

      {submitted && (
        <Card className={`p-4 ${selected === exercise.correctIndex ? 'border-success bg-success/10' : 'border-destructive bg-destructive/10'}`}>
          <div className="flex items-center gap-2 mb-1">
            {selected === exercise.correctIndex
              ? <Check className="h-5 w-5 text-success" />
              : <X className="h-5 w-5 text-destructive" />}
            <span className="font-display font-bold text-foreground">
              {selected === exercise.correctIndex ? 'Correto!' : 'Incorreto'}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{exercise.explanation}</p>
        </Card>
      )}
    </div>
  );
}
