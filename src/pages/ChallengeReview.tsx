import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, Swords, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { MultipleChoice } from '@/components/exercises/MultipleChoice';
import { TrueFalse } from '@/components/exercises/TrueFalse';
import { FillBlank } from '@/components/exercises/FillBlank';
import { Matching } from '@/components/exercises/Matching';
import { Ordering } from '@/components/exercises/Ordering';
import { CompleteSentence } from '@/components/exercises/CompleteSentence';
import { ColumnClassification } from '@/components/exercises/ColumnClassification';
import type { Exercise, ExerciseAnswer } from '@/types/study';
import { cn } from '@/lib/utils';
import { getSubjectEmoji } from '@/constants/subjects';

interface ChallengeData {
  id: string;
  subject: string;
  topic: string;
  year: string;
  score: number | null;
  total: number | null;
  exercises_data: Exercise[] | null;
  answers_data: ExerciseAnswer[] | null;
  completed_at: string | null;
  child_profile_id: string;
  parent_profile_id: string;
  message: string | null;
}

export default function ChallengeReview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [challenge, setChallenge] = useState<ChallengeData | null>(null);
  const [childName, setChildName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      const { data } = await supabase
        .from('challenges')
        .select('*')
        .eq('id', id)
        .single();

      if (data) {
        setChallenge(data as unknown as ChallengeData);
        // Fetch child name
        const { data: profileData } = await supabase
          .rpc('get_profiles_by_ids', { _ids: [(data as any).child_profile_id] });
        const child = (profileData as any)?.[0];
        if (child) setChildName(child.name);
      }
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

  if (!challenge || !challenge.exercises_data) {
    return (
      <div className="min-h-screen bg-background px-4 py-6">
        <div className="mx-auto max-w-lg text-center">
          <Button variant="ghost" className="mb-4 gap-2" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
          <p className="text-muted-foreground">Desafio não encontrado ou sem detalhes disponíveis.</p>
        </div>
      </div>
    );
  }

  const score = challenge.score ?? 0;
  const total = challenge.total ?? challenge.exercises_data.length;
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;

  const renderExercise = (ex: Exercise, idx: number) => {
    const answer = challenge.answers_data?.find(a => a.exerciseIndex === idx);
    const key = `challenge-review-${idx}`;
    const noop = () => {};
    switch (ex.type) {
      case 'multiple_choice': return <MultipleChoice key={key} exercise={ex} index={idx} onAnswer={noop} readOnly savedAnswer={answer} />;
      case 'true_false': return <TrueFalse key={key} exercise={ex} index={idx} onAnswer={noop} readOnly savedAnswer={answer} />;
      case 'fill_blank': return <FillBlank key={key} exercise={ex} index={idx} onAnswer={noop} readOnly savedAnswer={answer} />;
      case 'matching': return <Matching key={key} exercise={ex} index={idx} onAnswer={noop} readOnly savedAnswer={answer} />;
      case 'ordering': return <Ordering key={key} exercise={ex} index={idx} onAnswer={noop} readOnly savedAnswer={answer} />;
      case 'complete_sentence': return <CompleteSentence key={key} exercise={ex} index={idx} onAnswer={noop} readOnly savedAnswer={answer} />;
      case 'column_classification': return <ColumnClassification key={key} exercise={ex} index={idx} onAnswer={noop} readOnly savedAnswer={answer} />;
      default: return <MultipleChoice key={key} exercise={ex as any} index={idx} onAnswer={noop} readOnly savedAnswer={answer} />;
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-6 pb-28 md:pb-36">
      <div className="mx-auto max-w-lg">
        <Button variant="ghost" className="mb-4 gap-2" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>

        {/* Header */}
        <Card className="mb-6 border-primary/20">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <Swords className="h-5 w-5 text-primary" />
              <span className="text-xs font-display font-bold text-primary">Desafio</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-4xl emoji-3d shrink-0">{getSubjectEmoji(challenge.subject)}</span>
              <div className="min-w-0">
                <h1 className="font-display text-xl font-bold text-foreground">{challenge.subject}</h1>
                <p className="text-sm text-muted-foreground">{challenge.topic}</p>
                {childName && (
                  <p className="text-sm text-muted-foreground mt-1">Aluno: {childName}</p>
                )}
              </div>
            </div>
            <div className="mt-3 flex items-center gap-4">
              <span className={cn(
                'text-2xl font-display font-bold',
                pct >= 70 ? 'text-success' : pct >= 50 ? 'text-primary' : 'text-destructive'
              )}>
                {pct}%
              </span>
              <span className="text-sm text-muted-foreground">{score}/{total} acertos</span>
            </div>
            <div className="flex gap-4 mt-2 text-sm">
              <span className="flex items-center gap-1 text-accent">
                <CheckCircle className="h-4 w-4" /> {score} certas
              </span>
              <span className="flex items-center gap-1 text-destructive">
                <XCircle className="h-4 w-4" /> {total - score} erradas
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Exercises */}
        <div className="space-y-4">
          {challenge.exercises_data.map((ex, idx) => (
            <div key={idx}>
              <p className="text-xs text-muted-foreground mb-1 font-mono">Questão {idx + 1}</p>
              {renderExercise(ex, idx)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
