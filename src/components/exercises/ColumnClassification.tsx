import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import type { ColumnClassificationExercise, ExerciseAnswer } from '@/types/study';

interface Props {
  exercise: ColumnClassificationExercise;
  index: number;
  onAnswer: (answer: ExerciseAnswer) => void;
}

export function ColumnClassification({ exercise, index, onAnswer }: Props) {
  const [assignments, setAssignments] = useState<Record<number, number | null>>(() =>
    Object.fromEntries(exercise.items.map((_, i) => [i, null]))
  );
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // Shuffled order of items
  const [shuffledIndices] = useState<number[]>(() => {
    const arr = exercise.items.map((_, i) => i);
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  });

  const handleAssign = (itemIdx: number, colIdx: number) => {
    if (submitted) return;
    setAssignments(prev => ({ ...prev, [itemIdx]: prev[itemIdx] === colIdx ? null : colIdx }));
  };

  const allAssigned = Object.values(assignments).every(v => v !== null);

  const handleSubmit = () => {
    const correct = exercise.items.every((item, i) => assignments[i] === item.column);
    setIsCorrect(correct);
    setSubmitted(true);
    const score = exercise.items.filter((item, i) => assignments[i] === item.column).length;
    onAnswer({
      exerciseIndex: index,
      isCorrect: correct,
      userAnswer: `${score}/${exercise.items.length}`,
    });
  };

  return (
    <div className="animate-fade-in">
      <h2 className="font-display text-xl font-bold text-foreground mb-1">Classifique os itens</h2>
      <p className="text-sm text-muted-foreground mb-3">{exercise.question}</p>

      {/* Column headers */}
      <div className="grid gap-2 mb-3" style={{ gridTemplateColumns: `repeat(${exercise.columns.length}, 1fr)` }}>
        {exercise.columns.map((col, ci) => (
          <div key={ci} className="text-center text-sm font-bold font-display text-primary bg-primary/10 rounded-xl py-2.5">
            {col}
          </div>
        ))}
      </div>

      {/* Items */}
      <div className="space-y-2 mb-4">
        {shuffledIndices.map(itemIdx => {
          const item = exercise.items[itemIdx];
          const assigned = assignments[itemIdx];
          const rightAnswer = submitted && assigned === item.column;
          const wrongAnswer = submitted && assigned !== null && assigned !== item.column;

          return (
            <div
              key={itemIdx}
              className={`rounded-lg border p-3 transition-all ${
                rightAnswer ? 'border-success bg-success/10' :
                wrongAnswer ? 'border-destructive bg-destructive/10' :
                'border-border bg-card'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-body text-foreground flex-1">{item.text}</span>
                {submitted && (rightAnswer ? <Check className="h-4 w-4 text-success shrink-0" /> : wrongAnswer ? <X className="h-4 w-4 text-destructive shrink-0" /> : null)}
              </div>
              <div className="grid gap-1.5 mt-2" style={{ gridTemplateColumns: `repeat(${exercise.columns.length}, 1fr)` }}>
                {exercise.columns.map((col, ci) => {
                  const isActive = assigned === ci;
                  const showCorrect = submitted && item.column === ci;
                  return (
                    <button
                      key={ci}
                      onClick={() => handleAssign(itemIdx, ci)}
                      disabled={submitted}
                      className={`text-[10px] py-1 px-2 rounded-md border transition-all ${
                        showCorrect ? 'border-success bg-success/20 text-success font-bold' :
                        isActive && !submitted ? 'border-primary bg-primary/20 text-primary font-bold' :
                        isActive && submitted ? 'border-destructive bg-destructive/20 text-destructive' :
                        'border-border text-muted-foreground hover:border-primary/40'
                      }`}
                    >
                      {col}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {!submitted && (
        <Button onClick={handleSubmit} disabled={!allAssigned} className="w-full font-display font-bold">
          Confirmar
        </Button>
      )}

      {submitted && (
        <Card className={`p-4 ${isCorrect ? 'border-success bg-success/10' : 'border-destructive bg-destructive/10'}`}>
          <div className="flex items-center gap-2 mb-1">
            {isCorrect ? <Check className="h-5 w-5 text-success" /> : <X className="h-5 w-5 text-destructive" />}
            <span className="font-display font-bold text-foreground">{isCorrect ? 'Perfeito!' : 'Algumas classificações erradas'}</span>
          </div>
          <p className="text-sm text-muted-foreground">{exercise.explanation}</p>
        </Card>
      )}
    </div>
  );
}
