import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { MultipleChoice } from '@/components/exercises/MultipleChoice';
import { TrueFalse } from '@/components/exercises/TrueFalse';
import { FillBlank } from '@/components/exercises/FillBlank';
import { Matching } from '@/components/exercises/Matching';
import type { Exercise, ExerciseAnswer } from '@/types/study';
import { cn } from '@/lib/utils';

interface SessionData {
  id: string;
  subject: string;
  topic: string;
  year: string;
  score: number;
  total: number;
  xp_earned: number;
  created_at: string;
  exercises_data: Exercise[] | null;
  answers_data: ExerciseAnswer[] | null;
}

export default function SessionReview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    supabase
      .from('study_sessions')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        setSession(data as unknown as SessionData);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!session || !session.exercises_data) {
    return (
      <div className="min-h-screen bg-background px-4 py-6">
        <div className="mx-auto max-w-lg text-center">
          <Button variant="ghost" className="mb-4 gap-2" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
          <p className="text-muted-foreground">
            {!session ? 'Sessão não encontrada.' : 'Detalhes dos exercícios não disponíveis para sessões antigas.'}
          </p>
        </div>
      </div>
    );
  }

  const pct = Math.round((session.score / session.total) * 100);

  const handleShare = async () => {
    const { data: shareSettings } = await supabase
      .from('branding_settings')
      .select('key, value')
      .in('key', ['share_header', 'share_cta', 'share_app_url', 'app_name']);
    const s = Object.fromEntries((shareSettings ?? []).map((i) => [i.key, i.value]));
    const appName = s.app_name || 'Maluz';
    const header = s.share_header || `💡 *${appName} — Resultado do Estudo*`;
    const cta = s.share_cta || `🚀 Que tal tentar também? Baixe o ${appName}!`;
    const appUrl = s.share_app_url || 'https://maluz.app';

    const text = `${header}\n\n📖 ${session.subject} — ${session.topic}\n🏆 Acertei *${session.score} de ${session.total}* (${pct}%)\n⭐ +${session.xp_earned} XP\n\n${cta}\n👉 ${appUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const renderExercise = (ex: Exercise, idx: number) => {
    const answer = session.answers_data?.find(a => a.exerciseIndex === idx);
    const key = `review-${idx}`;
    const noop = () => {};
    switch (ex.type) {
      case 'multiple_choice':
        return <MultipleChoice key={key} exercise={ex} index={idx} onAnswer={noop} readOnly savedAnswer={answer} />;
      case 'true_false':
        return <TrueFalse key={key} exercise={ex} index={idx} onAnswer={noop} readOnly savedAnswer={answer} />;
      case 'fill_blank':
        return <FillBlank key={key} exercise={ex} index={idx} onAnswer={noop} readOnly savedAnswer={answer} />;
      case 'matching':
        return <Matching key={key} exercise={ex} index={idx} onAnswer={noop} readOnly savedAnswer={answer} />;
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
            <h1 className="font-display text-xl font-bold text-foreground">{session.subject}</h1>
            <p className="text-sm text-muted-foreground">{session.topic}</p>
            <div className="mt-3 flex items-center gap-4">
              <span className={cn(
                'text-2xl font-display font-bold',
                pct >= 70 ? 'text-success' : pct >= 50 ? 'text-primary' : 'text-destructive'
              )}>
                {pct}%
              </span>
              <span className="text-sm text-muted-foreground">{session.score}/{session.total} acertos • +{session.xp_earned} XP</span>
            </div>
          </CardContent>
        </Card>

        <Button variant="outline" className="w-full mb-6 gap-2" onClick={handleShare}>
          <Share2 className="h-4 w-4" /> Compartilhar no WhatsApp
        </Button>

        {/* Exercises */}
        <div className="space-y-4">
          {session.exercises_data.map((ex, idx) => (
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
