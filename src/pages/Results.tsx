import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, XCircle, CheckCircle, Share2, Star, History, BookOpen, Trophy, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { GameIcon } from '@/components/ui/game-icon';
import { useStudyStore } from '@/store/study-store';
import { useProfileStore } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { getYearLabel } from '@/constants/years';
import { cn } from '@/lib/utils';
import { PerfectScoreConfetti, firePerfectScoreConfetti } from '@/components/exercises/Confetti';
import { awardStudyProgress, calculateXp } from '@/lib/studyProgress';

function getEmoji(pct: number) {
  if (pct >= 90) return '🏆';
  if (pct >= 70) return '🎉';
  if (pct >= 50) return '💪';
  return '📖';
}

function getMessage(pct: number) {
  if (pct >= 90) return 'Excelente! Você arrasou!';
  if (pct >= 70) return 'Muito bem! Continue assim!';
  if (pct >= 50) return 'Bom trabalho! Pode melhorar!';
  return 'Vamos revisar e tentar de novo!';
}

interface SessionRecord {
  id: string;
  subject: string;
  topic: string;
  year: string;
  score: number;
  total: number;
  xp_earned: number;
  created_at: string;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function SessionHistory() {
  const profileId = useProfileStore((s) => s.activeProfileId);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!profileId) return;
    const fetch = async () => {
      const { data } = await supabase
        .from('study_sessions')
        .select('id, subject, topic, year, score, total, xp_earned, created_at')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false })
        .limit(50);
      setSessions((data as SessionRecord[]) || []);
      setLoading(false);
    };
    fetch();
  }, [profileId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-12">
        <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="font-display text-xl font-bold text-foreground mb-2">Nenhum estudo ainda</h2>
        <p className="text-muted-foreground mb-6">Complete exercícios para ver seu histórico aqui</p>
        <Button onClick={() => navigate('/inicio')} className="gap-2">
          <BookOpen className="h-4 w-4" />
          Começar a estudar
        </Button>
      </div>
    );
  }

  // Stats summary
  const totalSessions = sessions.length;
  const totalXP = sessions.reduce((sum, s) => sum + s.xp_earned, 0);
  const avgScore = Math.round(sessions.reduce((sum, s) => sum + (s.score / s.total) * 100, 0) / totalSessions);

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="animate-fade-in">
          <CardContent className="p-3 text-center flex flex-col items-center">
            <GameIcon icon={Trophy} variant="gold" size="md" className="mb-2" />
            <p className="font-display font-bold text-lg text-foreground">{totalSessions}</p>
            <p className="text-[10px] text-muted-foreground">Sessões</p>
          </CardContent>
        </Card>
        <Card className="animate-fade-in" style={{ animationDelay: '100ms' }}>
          <CardContent className="p-3 text-center flex flex-col items-center">
            <GameIcon icon={Star} variant="gold" size="md" pulse className="mb-2" />
            <p className="font-display font-bold text-lg text-foreground">{totalXP}</p>
            <p className="text-[10px] text-muted-foreground">XP Total</p>
          </CardContent>
        </Card>
        <Card className="animate-fade-in" style={{ animationDelay: '200ms' }}>
          <CardContent className="p-3 text-center flex flex-col items-center">
            <GameIcon icon={CheckCircle} variant="mint" size="md" className="mb-2" />
            <p className="font-display font-bold text-lg text-foreground">{avgScore}%</p>
            <p className="text-[10px] text-muted-foreground">Média</p>
          </CardContent>
        </Card>
      </div>

      {/* Session list */}
      <div>
        <h2 className="font-display text-lg font-bold text-foreground mb-3 flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          Histórico de Estudos
        </h2>
        <div className="space-y-2.5">
          {sessions.map((s, idx) => {
            const pct = Math.round((s.score / s.total) * 100);
            return (
              <Card
                key={s.id}
                className="animate-fade-in overflow-hidden cursor-pointer hover:border-primary/30 transition-colors"
                style={{ animationDelay: `${(idx + 3) * 60}ms` }}
                onClick={() => navigate(`/sessao/${s.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-display font-bold text-foreground truncate">
                        {s.subject}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">{s.topic}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(s.created_at)}
                        </span>
                        {s.year && (
                          <span>{getYearLabel(s.year) || s.year}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className={cn(
                        'text-lg font-display font-bold',
                        pct >= 70 ? 'text-success' : pct >= 50 ? 'text-accent' : 'text-destructive'
                      )}>
                        {getEmoji(pct)} {pct}%
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {s.score}/{s.total} • +{s.xp_earned} XP
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function Results() {
  const navigate = useNavigate();
  const { exercises, answers, config, reset, sessionId } = useStudyStore();
  const profileId = useProfileStore((s) => s.activeProfileId);
  const [xpEarned, setXpEarned] = useState(0);
  const [saved, setSaved] = useState(false);

  const hasActiveSession = config && exercises.length > 0;

  const score = answers.filter((a) => a.isCorrect).length;
  const total = exercises.length;
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;

  // Save results once per generated study session, even across remounts/navigation
  useEffect(() => {
    if (!config || !profileId || total === 0 || !sessionId) return;

    const savedSessionId = sessionStorage.getItem('lastSavedStudySessionId');
    if (savedSessionId === sessionId) {
      setSaved(true);
      setXpEarned(calculateXp(score, total));
      return;
    }

    const xp = calculateXp(score, total);
    setXpEarned(xp);

    const saveResults = async () => {
      const result = await awardStudyProgress({
        profileId,
        subject: config.subject,
        topic: config.topic,
        year: config.year,
        score,
        total,
        exercises,
        answers,
        countDailyUsage: true,
      });

      if (result.error) return;

      sessionStorage.setItem('lastSavedStudySessionId', sessionId);

      setSaved(true);
    };

    saveResults();
  }, [answers, config, exercises, profileId, score, sessionId, total]);

  const handleNewSession = () => {
    reset();
    navigate('/inicio');
  };

  const handleRetry = () => {
    navigate('/confirmacao');
  };

  const handleShareWhatsApp = async () => {
    if (!config) return;
    // Fetch custom share settings from branding
    const { data: shareSettings } = await supabase
      .from('branding_settings')
      .select('key, value')
      .in('key', ['share_header', 'share_cta', 'share_app_url', 'app_name']);
    const s = Object.fromEntries((shareSettings ?? []).map((i) => [i.key, i.value]));
    const appName = s.app_name || 'Maluz';
    const header = s.share_header || `💡 *${appName} — Resultado do Estudo*`;
    const cta = s.share_cta || `🚀 Que tal tentar também? Baixe o ${appName} e descubra o seu resultado!`;
    const appUrl = s.share_app_url || 'https://maluz.app';

    const text = `${header}\n\n📖 ${config.subject} — ${config.topic} (${config.year})\n🏆 Acertei *${score} de ${total}* (${pct}%)\n⭐ Ganhei ${xpEarned} XP!\n\n${getMessage(pct)}\n\n${cta}\n👉 ${appUrl.replace(/\/$/, '')}`;
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const url = isMobile
      ? `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`
      : `https://web.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-background px-4 py-6 pb-28 md:pb-36">
      <div className="mx-auto max-w-lg">
        {hasActiveSession ? (
          <>
            {/* Perfect score confetti */}
            {pct === 100 && <PerfectScoreConfetti />}

            {/* Score card - dark themed */}
            <Card className={cn(
              "mb-6 overflow-hidden animate-scale-in border-primary/20 bg-card",
              pct === 100 && "ring-2 ring-primary shimmer-glow"
            )}>
              <div className="px-6 py-8 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
                <div className="relative z-10">
                  <div className="mb-2 text-5xl">{getEmoji(pct)}</div>
                  <h1 className="font-display text-4xl font-bold text-foreground">{pct}%</h1>
                  <p className="mt-1 text-muted-foreground">{getMessage(pct)}</p>
                  <div className="mt-4 flex justify-center gap-6 text-sm">
                    <div className="flex items-center gap-1.5 text-emerald-400">
                      <CheckCircle className="h-4 w-4" />
                      <span className="font-semibold">{score} certas</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-destructive">
                      <XCircle className="h-4 w-4" />
                      <span className="font-semibold">{total - score} erradas</span>
                    </div>
                  </div>
                  {xpEarned > 0 && (
                    <div className="mt-4 inline-flex items-center gap-1.5 bg-accent/15 text-accent px-4 py-1.5 rounded-full animate-bounce-in">
                      <Star className="h-4 w-4" />
                      <span className="font-display font-bold">+{xpEarned} XP</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Review wrong answers */}
            {answers.some((a) => !a.isCorrect) && (
              <div className="mb-6">
                <h2 className="mb-3 font-display text-lg font-bold text-foreground">
                  📝 Revise seus erros
                </h2>
                <div className="space-y-3">
                  {answers.filter((a) => !a.isCorrect).map((a) => {
                    const ex = exercises[a.exerciseIndex];
                    return (
                      <Card key={a.exerciseIndex} className="animate-fade-in">
                        <CardContent className="p-4">
                          <p className="mb-1 text-sm font-semibold text-destructive">
                            ❌ Questão {a.exerciseIndex + 1}
                          </p>
                          <p className="mb-2 text-sm text-foreground">
                            {ex.type === 'multiple_choice' && ex.question}
                            {ex.type === 'true_false' && ex.statement}
                            {ex.type === 'fill_blank' && ex.sentence}
                            {ex.type === 'matching' && 'Associação de conceitos'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {ex.explanation}
                          </p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3">
              <Button size="lg" className="w-full gap-2 font-display font-bold" onClick={handleRetry}>
                <RefreshCw className="h-4 w-4" />
                Gerar mais exercícios
              </Button>
              <Button size="lg" variant="outline" className="w-full gap-2" onClick={handleShareWhatsApp}>
                <Share2 className="h-4 w-4" />
                Compartilhar no WhatsApp
              </Button>
              <Button size="lg" variant="outline" className="w-full gap-2" onClick={handleNewSession}>
                <ArrowLeft className="h-4 w-4" />
                Novo estudo
              </Button>
            </div>

            {/* Past sessions */}
            <div className="mt-8">
              <h2 className="font-display text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                Sessões anteriores
              </h2>
              <SessionHistory />
            </div>
          </>
        ) : (
          <>
            {/* Header */}
            <div className="mb-6 animate-fade-in">
              <h1 className="font-display text-2xl font-bold text-foreground">📊 Seus Resultados</h1>
              <p className="text-sm text-muted-foreground">Acompanhe seu progresso de estudos</p>
            </div>

            {/* History */}
            <SessionHistory />
          </>
        )}
      </div>
    </div>
  );
}
