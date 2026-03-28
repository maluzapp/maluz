import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useProfileStore } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { getYearLabel } from '@/constants/years';
import { Flame, Star, BookOpen, Target, Calendar, Zap, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfileData {
  name: string;
  avatar_emoji: string;
  xp: number;
  level: number;
  streak_days: number;
  total_exercises: number;
  total_correct: number;
  school_year: string | null;
  last_study_date: string | null;
}

interface RecentSession {
  id: string;
  subject: string;
  topic: string;
  score: number;
  total: number;
  xp_earned: number;
  created_at: string;
}

interface SubjectStat {
  subject: string;
  sessions: number;
  totalScore: number;
  totalQuestions: number;
}

function xpForLevel(level: number) { return level * 100; }

function formatRelativeDate(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffH = Math.floor(diffMs / 3600000);
  if (diffH < 1) return 'Agora há pouco';
  if (diffH < 24) return `${diffH}h atrás`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return 'Ontem';
  if (diffD < 7) return `${diffD} dias atrás`;
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

export default function Index() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const profileId = useProfileStore((s) => s.activeProfileId);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);
  const [subjectStats, setSubjectStats] = useState<SubjectStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user || !profileId) return;
    let cancelled = false;
    const fetchData = async () => {
      const [profileRes, sessionsRes] = await Promise.all([
        supabase.from('profiles').select('name, avatar_emoji, xp, level, streak_days, total_exercises, total_correct, school_year, last_study_date').eq('id', profileId).single(),
        supabase.from('study_sessions').select('id, subject, topic, score, total, xp_earned, created_at').eq('profile_id', profileId).order('created_at', { ascending: false }).limit(20),
      ]);
      if (cancelled) return;
      if (profileRes.data) setProfile(profileRes.data as ProfileData);
      const sessions = (sessionsRes.data as RecentSession[]) || [];
      setRecentSessions(sessions);

      // Compute subject stats
      const map: Record<string, SubjectStat> = {};
      for (const s of sessions) {
        if (!map[s.subject]) map[s.subject] = { subject: s.subject, sessions: 0, totalScore: 0, totalQuestions: 0 };
        map[s.subject].sessions++;
        map[s.subject].totalScore += s.score;
        map[s.subject].totalQuestions += s.total;
      }
      setSubjectStats(Object.values(map).sort((a, b) => b.sessions - a.sessions));
      setLoading(false);
    };
    fetchData();
    return () => { cancelled = true; };
  }, [profileId, user, authLoading]);

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background animate-fade-in">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          <p className="text-xs text-muted-foreground font-mono">Carregando...</p>
        </div>
      </div>
    );
  }

  const xpNeeded = xpForLevel(profile.level);
  const xpInLevel = profile.xp % xpNeeded || (profile.xp > 0 ? xpNeeded : 0);
  const progressPct = Math.min((xpInLevel / xpNeeded) * 100, 100);
  const accuracy = profile.total_exercises > 0 ? Math.round((profile.total_correct / profile.total_exercises) * 100) : 0;

  return (
    <div className="min-h-screen bg-background px-4 py-6 pb-36 animate-fade-in">
      <div className="mx-auto max-w-lg space-y-5">

        {/* Profile hero */}
        <div className="text-center animate-fade-in">
          <div className="relative inline-block mb-3">
            <span className="text-6xl block">{profile.avatar_emoji}</span>
            <span className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full font-mono">
              Nv.{profile.level}
            </span>
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">Olá, {profile.name}! 👋</h1>
          {profile.school_year && (
            <p className="text-sm text-primary font-medium mt-0.5">{getYearLabel(profile.school_year)}</p>
          )}
        </div>

        {/* XP Progress */}
        <Card className="animate-fade-in border-primary/20 overflow-hidden" style={{ animationDelay: '80ms' }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-sm font-display font-bold text-foreground">
                <Star className="h-4 w-4 text-primary" />
                {profile.xp} XP
              </div>
              <span className="text-xs text-muted-foreground font-mono">
                {xpInLevel}/{xpNeeded} para Nv.{profile.level + 1}
              </span>
            </div>
            <Progress value={progressPct} className="h-2.5" />
          </CardContent>
        </Card>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3 animate-fade-in" style={{ animationDelay: '160ms' }}>
          <Card className="border-primary/10">
            <CardContent className="p-3 text-center">
              <Flame className="h-5 w-5 text-destructive mx-auto mb-1" />
              <p className="font-display font-bold text-xl text-foreground">{profile.streak_days}</p>
              <p className="text-[10px] text-muted-foreground font-mono uppercase">Dias seguidos</p>
            </CardContent>
          </Card>
          <Card className="border-primary/10">
            <CardContent className="p-3 text-center">
              <Target className="h-5 w-5 text-primary mx-auto mb-1" />
              <p className="font-display font-bold text-xl text-foreground">{accuracy}%</p>
              <p className="text-[10px] text-muted-foreground font-mono uppercase">Precisão</p>
            </CardContent>
          </Card>
          <Card className="border-primary/10">
            <CardContent className="p-3 text-center">
              <BookOpen className="h-5 w-5 text-accent mx-auto mb-1" />
              <p className="font-display font-bold text-xl text-foreground">{profile.total_exercises}</p>
              <p className="text-[10px] text-muted-foreground font-mono uppercase">Exercícios</p>
            </CardContent>
          </Card>
        </div>

        {/* Subject performance */}
        {subjectStats.length > 0 && (
          <Card className="animate-fade-in border-primary/10" style={{ animationDelay: '240ms' }}>
            <CardContent className="p-4">
              <h2 className="font-display font-bold text-foreground mb-3 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                Desempenho por matéria
              </h2>
              <div className="space-y-3">
                {subjectStats.slice(0, 5).map((stat) => {
                  const pct = stat.totalQuestions > 0 ? Math.round((stat.totalScore / stat.totalQuestions) * 100) : 0;
                  return (
                    <div key={stat.subject}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-foreground font-medium truncate">{stat.subject}</span>
                        <span className={cn(
                          'text-xs font-mono font-bold',
                          pct >= 70 ? 'text-accent' : pct >= 50 ? 'text-primary' : 'text-destructive'
                        )}>{pct}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all duration-500',
                            pct >= 70 ? 'bg-accent' : pct >= 50 ? 'bg-primary' : 'bg-destructive'
                          )}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{stat.sessions} sessões</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent sessions */}
        {recentSessions.length > 0 ? (
          <div className="animate-fade-in" style={{ animationDelay: '320ms' }}>
            <h2 className="font-display font-bold text-foreground mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Atividade recente
            </h2>
            <div className="space-y-2">
              {recentSessions.slice(0, 5).map((s) => {
                const pct = Math.round((s.score / s.total) * 100);
                return (
                  <Card key={s.id} className="border-primary/5 cursor-pointer hover:border-primary/20 transition-colors" onClick={() => navigate(`/sessao/${s.id}`)}>
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold shrink-0',
                        pct >= 70 ? 'bg-accent/15 text-accent' : pct >= 50 ? 'bg-primary/15 text-primary' : 'bg-destructive/15 text-destructive'
                      )}>
                        {pct}%
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{s.subject}</p>
                        <p className="text-xs text-muted-foreground truncate">{s.topic}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-primary font-mono">+{s.xp_earned} XP</p>
                        <p className="text-[10px] text-muted-foreground">{formatRelativeDate(s.created_at)}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ) : (
          <Card className="animate-fade-in border-primary/10" style={{ animationDelay: '320ms' }}>
            <CardContent className="p-8 text-center">
              <Zap className="h-10 w-10 text-primary/40 mx-auto mb-3" />
              <h3 className="font-display font-bold text-foreground mb-1">Comece a estudar!</h3>
              <p className="text-sm text-muted-foreground">
                Toque na 💡 para gerar seus primeiros exercícios
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
