import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, CheckCircle, XCircle, Swords, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { MultipleChoice } from '@/components/exercises/MultipleChoice';
import { TrueFalse } from '@/components/exercises/TrueFalse';
import { FillBlank } from '@/components/exercises/FillBlank';
import { Matching } from '@/components/exercises/Matching';
import { Ordering } from '@/components/exercises/Ordering';
import { CompleteSentence } from '@/components/exercises/CompleteSentence';
import { ColumnClassification } from '@/components/exercises/ColumnClassification';
import { ExitExerciseDialog } from '@/components/exercises/ExitExerciseDialog';
import { useExerciseExitGuard } from '@/hooks/useExerciseExitGuard';
import { useProfileStore } from '@/hooks/useProfile';
import { awardStudyProgress } from '@/lib/studyProgress';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Exercise, ExerciseAnswer } from '@/types/study';

export default function ChallengeExercise() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const profileId = useProfileStore((s) => s.activeProfileId);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [answers, setAnswers] = useState<ExerciseAnswer[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [challengeInfo, setChallengeInfo] = useState<{ subject: string; topic: string; message: string | null } | null>(null);
  const [challengeYear, setChallengeYear] = useState('');
  const [finalizing, setFinalizing] = useState(false);
  const hasProgress = exercises.length > 0 && (answers.length > 0 || currentIndex > 0);
  const exitGuard = useExerciseExitGuard({ enabled: !loading && !completed && hasProgress, exitTo: '/desafios' });

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      const { data, error } = await supabase
        .from('challenges')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        toast.error('Desafio não encontrado');
        navigate('/desafios');
        return;
      }

      const c = data as any;
      if (c.status === 'completed') {
        toast.info('Este desafio já foi concluído');
        navigate('/desafios');
        return;
      }

      setChallengeInfo({ subject: c.subject, topic: c.topic, message: c.message });
      setChallengeYear(c.year);
      setExercises((c.exercises_data as Exercise[]) || []);

      // Mark as in_progress
      await supabase.from('challenges' as any).update({ status: 'in_progress' }).eq('id', id);
      setLoading(false);
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (completed) {
    const score = answers.filter(a => a.isCorrect).length;
    const total = exercises.length;
    const pct = Math.round((score / total) * 100);

    return (
      <div className="min-h-screen bg-background px-4 py-6 pb-28">
        <div className="mx-auto max-w-lg">
          <Card className="overflow-hidden animate-scale-in border-primary/20">
            <div className="px-6 py-8 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
              <div className="relative z-10">
                <Swords className="h-10 w-10 text-primary mx-auto mb-2" />
                <h1 className="font-display text-xl font-bold text-foreground mb-1">Desafio Concluído!</h1>
                <p className="text-sm text-muted-foreground mb-4">{challengeInfo?.subject} — {challengeInfo?.topic}</p>
                <div className="text-5xl font-display font-bold text-foreground mb-2">{pct}%</div>
                <div className="flex justify-center gap-6 text-sm">
                  <span className="flex items-center gap-1.5 text-accent">
                    <CheckCircle className="h-4 w-4" /> {score} certas
                  </span>
                  <span className="flex items-center gap-1.5 text-destructive">
                    <XCircle className="h-4 w-4" /> {total - score} erradas
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Review wrong answers */}
          {answers.some(a => !a.isCorrect) && (
            <div className="mt-6">
              <h2 className="mb-3 font-display text-lg font-bold text-foreground">📝 Revise seus erros</h2>
              <div className="space-y-2">
                {answers.filter(a => !a.isCorrect).map(a => {
                  const ex = exercises[a.exerciseIndex];
                  return (
                    <Card key={a.exerciseIndex} className="animate-fade-in">
                      <CardContent className="p-4">
                        <p className="mb-1 text-sm font-semibold text-destructive">❌ Questão {a.exerciseIndex + 1}</p>
                        <p className="text-sm text-foreground">
                          {'question' in ex ? ex.question : 'statement' in ex ? ex.statement : 'sentence' in ex ? ex.sentence : ''}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">{ex.explanation}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          <Button size="lg" className="w-full mt-6 gap-2 font-display font-bold" onClick={() => navigate('/desafios')}>
            <Swords className="h-4 w-4" /> Voltar aos Desafios
          </Button>
        </div>
      </div>
    );
  }

  const exercise = exercises[currentIndex];
  const progress = (currentIndex / exercises.length) * 100;

  const handleAnswer = (answer: ExerciseAnswer) => {
    setAnswers(prev => [...prev, answer]);
    setAnswered(true);
  };

  const handleNext = async () => {
    if (currentIndex + 1 >= exercises.length) {
      setFinalizing(true);
      // Complete challenge
      const finalAnswers = answers;
      const score = finalAnswers.filter(a => a.isCorrect).length;

      const { error: challengeError } = await supabase.from('challenges' as any).update({
        status: 'completed',
        answers_data: JSON.parse(JSON.stringify(finalAnswers)),
        score,
        completed_at: new Date().toISOString(),
      }).eq('id', id);

      if (challengeError) {
        toast.error('Não foi possível concluir o desafio');
        setFinalizing(false);
        return;
      }

      if (profileId && challengeInfo) {
        const progressResult = await awardStudyProgress({
          profileId,
          subject: challengeInfo.subject,
          topic: challengeInfo.topic,
          year: challengeYear,
          score,
          total: exercises.length,
          exercises,
          answers: finalAnswers,
        });

        if (progressResult.error) {
          toast.success('Desafio concluído!');
          toast.error('O resultado foi salvo, mas o XP não pôde ser atualizado agora.');
        } else {
          toast.success(`Desafio concluído! +${progressResult.xp} XP enviados. 🎯`);
        }
      } else {
        toast.success('Desafio concluído! Seu resultado foi enviado. 🎯');
      }

      setCompleted(true);
    } else {
      setCurrentIndex(prev => prev + 1);
      setAnswered(false);
    }
  };

  const renderExercise = (ex: Exercise) => {
    const key = `challenge-ex-${currentIndex}`;
    switch (ex.type) {
      case 'multiple_choice': return <MultipleChoice key={key} exercise={ex} index={currentIndex} onAnswer={handleAnswer} />;
      case 'true_false': return <TrueFalse key={key} exercise={ex} index={currentIndex} onAnswer={handleAnswer} />;
      case 'fill_blank': return <FillBlank key={key} exercise={ex} index={currentIndex} onAnswer={handleAnswer} />;
      case 'matching': return <Matching key={key} exercise={ex} index={currentIndex} onAnswer={handleAnswer} />;
      case 'ordering': return <Ordering key={key} exercise={ex} index={currentIndex} onAnswer={handleAnswer} />;
      case 'complete_sentence': return <CompleteSentence key={key} exercise={ex} index={currentIndex} onAnswer={handleAnswer} />;
      case 'column_classification': return <ColumnClassification key={key} exercise={ex} index={currentIndex} onAnswer={handleAnswer} />;
      default: return <MultipleChoice key={key} exercise={ex as any} index={currentIndex} onAnswer={handleAnswer} />;
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-6 pb-24">
      <div className="mx-auto max-w-lg">
        {/* Challenge badge */}
        <div className="flex items-center gap-2 mb-4 text-sm text-primary">
          <Swords className="h-4 w-4" />
          <span className="font-display font-bold">Desafio: {challengeInfo?.subject}</span>
        </div>

        {challengeInfo?.message && (
          <div className="mb-4 p-3 rounded-xl bg-primary/10 text-sm text-foreground italic">
            💬 "{challengeInfo.message}"
          </div>
        )}

        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
            <span className="font-semibold">Questão {currentIndex + 1} de {exercises.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {renderExercise(exercise)}

        {answered && (
          <Button size="lg" className="mt-6 w-full gap-2 font-display font-bold" onClick={handleNext} disabled={finalizing}>
            {currentIndex + 1 >= exercises.length ? 'Concluir Desafio' : 'Próxima Questão'}
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}

        <ExitExerciseDialog
          open={exitGuard.isDialogOpen}
          onOpenChange={exitGuard.setIsDialogOpen}
          onConfirm={exitGuard.confirmExit}
        />
      </div>
    </div>
  );
}
