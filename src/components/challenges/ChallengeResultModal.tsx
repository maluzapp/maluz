import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, XCircle, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Challenge } from '@/pages/Challenges';

interface Props {
  challenge: Challenge;
  childName: string;
  onClose: () => void;
}

export function ChallengeResultModal({ challenge, childName, onClose }: Props) {
  const pct = challenge.score && challenge.total ? Math.round((challenge.score / challenge.total) * 100) : 0;
  const exercises = challenge.exercises_data || [];
  const answers = challenge.answers_data || [];

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" /> Resultado do Desafio
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Score summary */}
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-1">{childName}</p>
            <p className="text-4xl font-display font-bold text-foreground">{pct}%</p>
            <p className="text-sm text-muted-foreground">
              {challenge.subject} — {challenge.topic}
            </p>
            <div className="flex justify-center gap-4 mt-3 text-sm">
              <span className="flex items-center gap-1 text-accent">
                <CheckCircle className="h-4 w-4" /> {challenge.score} certas
              </span>
              <span className="flex items-center gap-1 text-destructive">
                <XCircle className="h-4 w-4" /> {(challenge.total || 0) - (challenge.score || 0)} erradas
              </span>
            </div>
          </div>

          {/* Per-question breakdown */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-foreground">Detalhes por questão</h3>
            {exercises.map((ex, i) => {
              const answer = answers.find(a => a.exerciseIndex === i);
              const isCorrect = answer?.isCorrect ?? false;
              return (
                <Card key={i} className={cn('border', isCorrect ? 'border-accent/20' : 'border-destructive/20')}>
                  <CardContent className="p-3">
                    <div className="flex items-start gap-2">
                      {isCorrect ? (
                        <CheckCircle className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm text-foreground">
                          <span className="font-semibold">Q{i + 1}:</span>{' '}
                          {'question' in ex ? ex.question : 'statement' in ex ? ex.statement : 'sentence' in ex ? ex.sentence : 'Exercício'}
                        </p>
                        {!isCorrect && ex.explanation && (
                          <p className="text-xs text-muted-foreground mt-1">{ex.explanation}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
