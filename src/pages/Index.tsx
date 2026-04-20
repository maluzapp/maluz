import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfileStore } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { useStripeSubscription, useUserSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import { getYearLabel } from '@/constants/years';
import {
  Flame, BookOpen, Target, Calendar, Zap, BarChart3, Settings, Crown, Lock, Mic, Camera, Swords, ChevronRight, Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { GameCard } from '@/components/game/GameCard';
import { GameButton } from '@/components/game/GameButton';
import { StatBadge } from '@/components/game/StatBadge';
import { ProgressBarGame } from '@/components/game/ProgressBarGame';
import xpCoin from '@/assets/icons-game/xp-coin.png';
import centralLamp from '@/assets/icons-game/central-lamp-glow.png';

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
interface PendingChallenge {
  id: string;
  subject: string;
  topic: string;
  message: string | null;
  created_at: string;
  parent_profile_id: string;
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
  const [pendingChallenges, setPendingChallenges] = useState<PendingChallenge[]>([]);
  const [parentNames, setParentNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const { data: stripeStatus } = useStripeSubscription();
  const { data: dbSub } = useUserSubscription();
  const isPro = !!(stripeStatus?.subscribed || (dbSub?.status === 'active' && dbSub?.plan?.slug !== 'free'));

  useEffect(() => {
    if (authLoading || !user || !profileId) return;
    let cancelled = false;
    const fetchData = async () => {
      const [profileRes, sessionsRes, challengesRes] = await Promise.all([
        supabase.from('profiles').select('name, avatar_emoji, xp, level, streak_days, total_exercises, total_correct, school_year, last_study_date').eq('id', profileId).single(),
        supabase.from('study_sessions').select('id, subject, topic, score, total, xp_earned, created_at').eq('profile_id', profileId).order('created_at', { ascending: false }).limit(20),
        supabase.from('challenges').select('id, subject, topic, message, created_at, parent_profile_id').eq('child_profile_id', profileId).eq('status', 'pending').order('created_at', { ascending: false }).limit(5),
      ]);
      if (cancelled) return;
      if (profileRes.data) setProfile(profileRes.data as ProfileData);
      const sessions = (sessionsRes.data as RecentSession[]) || [];
      setRecentSessions(sessions);

      const map: Record<string, SubjectStat> = {};
      for (const s of sessions) {
        if (!map[s.subject]) map[s.subject] = { subject: s.subject, sessions: 0, totalScore: 0, totalQuestions: 0 };
        map[s.subject].sessions++;
        map[s.subject].totalScore += s.score;
        map[s.subject].totalQuestions += s.total;
      }
      setSubjectStats(Object.values(map).sort((a, b) => b.sessions - a.sessions));

      const pending = (challengesRes.data as any[] as PendingChallenge[]) || [];
      setPendingChallenges(pending);

      const parentIds = [...new Set(pending.map(c => c.parent_profile_id))];
      if (parentIds.length > 0) {
        const { data: parents } = await supabase.from('profiles').select('id, name').in('id', parentIds);
        const nameMap: Record<string, string> = {};
        for (const p of (parents || [])) nameMap[p.id] = p.name;
        if (!cancelled) setParentNames(nameMap);
      }

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
    <div className="min-h-screen bg-gradient-navy-deep px-4 py-5 pb-28 md:pb-36 animate-fade-in">
      <div className="mx-auto max-w-lg space-y-4">

        {/* HERO HEADER — Royal Match style */}
        <GameCard tone="gold" className="p-4 animate-fade-in">
          <div className="flex items-center gap-4">
            {/* Avatar in gold frame */}
            <div className="relative shrink-0">
              <div className="w-[68px] h-[68px] rounded-full bg-gradient-gold p-[3px] shadow-bevel-gold-sm">
                <div className="w-full h-full rounded-full bg-card flex items-center justify-center text-4xl ring-2 ring-card">
                  {profile.avatar_emoji}
                </div>
              </div>
              {/* Level badge */}
              <div className="absolute -bottom-1 -right-1 min-w-[28px] h-7 px-1.5 rounded-full bg-gradient-purple shadow-bevel-purple flex items-center justify-center ring-2 ring-card">
                <span className="font-display font-black text-xs text-stroke-navy text-royal-foreground leading-none">
                  {profile.level}
                </span>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="font-display text-xl font-black text-foreground truncate">
                  {profile.name}
                </h1>
                {isPro && (
                  <span className="shrink-0 inline-flex items-center gap-0.5 px-1.5 h-5 rounded-md bg-gradient-purple shadow-bevel-purple text-[9px] font-mono font-black text-stroke-navy text-royal-foreground">
                    <Crown className="h-2.5 w-2.5" /> PRO
                  </span>
                )}
              </div>
              {profile.school_year && (
                <p className="text-xs font-mono font-bold text-primary uppercase tracking-wider mt-0.5">
                  {getYearLabel(profile.school_year)}
                </p>
              )}
              {/* XP bar */}
              <div className="mt-2.5">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1">
                    <img src={xpCoin} alt="" width={24} height={24} className="h-4 w-4 object-contain" loading="lazy" />
                    <span className="font-display font-black text-sm text-gold-shine">
                      {profile.xp.toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-muted-foreground">
                    {xpInLevel}/{xpNeeded} → Nv.{profile.level + 1}
                  </span>
                </div>
                <ProgressBarGame value={progressPct} height={12} />
              </div>
            </div>

            <button
              onClick={() => navigate('/creditos')}
              className="shrink-0 w-9 h-9 rounded-full bg-card/60 border border-primary/30 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors press-down"
              aria-label="Configurações"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </GameCard>

        {/* STAT COINS row */}
        <div className="flex items-start justify-around py-1 animate-fade-in" style={{ animationDelay: '80ms' }}>
          <StatBadge
            tone="coral"
            icon={<Flame className="h-3.5 w-3.5" />}
            value={profile.streak_days}
            label="Streak"
          />
          <StatBadge
            tone="green"
            icon={<Target className="h-3.5 w-3.5" />}
            value={`${accuracy}%`}
            label="Precisão"
          />
          <StatBadge
            tone="info"
            icon={<BookOpen className="h-3.5 w-3.5" />}
            value={profile.total_exercises}
            label="Exercícios"
          />
        </div>

        {/* CONTINUE STUDYING CTA */}
        <GameCard tone="gold" className="p-4 animate-fade-in relative" style={{ animationDelay: '120ms' }}>
          <div className="flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-primary mb-1">
                Pronto para mais XP?
              </p>
              <h2 className="font-display text-lg font-black text-foreground leading-tight mb-3">
                Continue estudando<br />e ganhe recompensas!
              </h2>
              <GameButton variant="gold" size="md" shine onClick={() => navigate('/gerar')}>
                <Sparkles className="h-4 w-4" /> Gerar exercícios
              </GameButton>
            </div>
            <img
              src={centralLamp}
              alt=""
              width={140}
              height={140}
              loading="lazy"
              className="h-24 w-24 object-contain animate-trophy-bounce drop-shadow-[0_8px_16px_hsl(var(--primary)/0.4)] shrink-0"
            />
          </div>
        </GameCard>

        {/* PENDING CHALLENGES */}
        {pendingChallenges.length > 0 && (
          <div className="animate-fade-in space-y-2" style={{ animationDelay: '160ms' }}>
            <h2 className="font-display font-black text-foreground flex items-center gap-2 px-1">
              <Swords className="h-4 w-4 text-coral" />
              Desafios pendentes
              <span className="ml-auto inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full bg-gradient-coral shadow-bevel-coral text-white text-[11px] font-mono font-black animate-badge-pop">
                {pendingChallenges.length}
              </span>
            </h2>
            {pendingChallenges.map((c) => (
              <GameCard
                key={c.id}
                tone="coral"
                interactive
                className="p-3.5"
                onClick={() => navigate(`/desafio/${c.id}`)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-coral shadow-bevel-coral flex items-center justify-center shrink-0">
                    <Swords className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-bold text-foreground truncate">{c.subject} — {c.topic}</p>
                    <p className="text-xs text-muted-foreground font-mono">
                      De: <span className="text-foreground/80 font-bold">{parentNames[c.parent_profile_id] || 'Pai/Mãe'}</span>
                    </p>
                    {c.message && (
                      <p className="text-xs text-muted-foreground italic truncate mt-0.5">"{c.message}"</p>
                    )}
                  </div>
                  <GameButton variant="coral" size="sm" className="shrink-0">
                    Iniciar
                  </GameButton>
                </div>
              </GameCard>
            ))}
          </div>
        )}

        {/* SUBJECT PERFORMANCE */}
        {subjectStats.length > 0 && (
          <GameCard tone="navy" className="p-4 animate-fade-in" style={{ animationDelay: '200ms' }}>
            <h2 className="font-display font-black text-foreground mb-3 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Desempenho por matéria
            </h2>
            <div className="space-y-3">
              {subjectStats.slice(0, 5).map((stat) => {
                const pct = stat.totalQuestions > 0 ? Math.round((stat.totalScore / stat.totalQuestions) * 100) : 0;
                return (
                  <div key={stat.subject}>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="text-foreground font-display font-bold truncate">{stat.subject}</span>
                      <span className={cn(
                        'text-xs font-mono font-black',
                        pct >= 70 ? 'text-xp' : pct >= 50 ? 'text-primary' : 'text-coral'
                      )}>{pct}%</span>
                    </div>
                    <ProgressBarGame value={pct} height={10} showShine={false} />
                    <p className="text-[10px] text-muted-foreground font-mono mt-1">{stat.sessions} sessões</p>
                  </div>
                );
              })}
            </div>
          </GameCard>
        )}

        {/* PRO UPSELL — purple/gold gradient */}
        {!isPro && (
          <GameCard tone="purple" className="p-4 animate-fade-in relative overflow-hidden" style={{ animationDelay: '240ms' }}>
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-gradient-radial opacity-30 pointer-events-none" style={{ background: 'radial-gradient(circle, hsl(var(--royal-purple) / 0.4), transparent 70%)' }} />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-purple shadow-bevel-purple flex items-center justify-center animate-glow-breathe">
                  <Crown className="h-5 w-5 text-royal-foreground" />
                </div>
                <h2 className="font-display font-black text-foreground text-lg">Recursos PRO</h2>
                <span className="ml-auto bg-gradient-purple shadow-bevel-purple text-royal-foreground text-[9px] font-black px-2 py-1 rounded-full font-mono uppercase tracking-wider text-stroke-navy">PRO</span>
              </div>
              <div className="space-y-2.5 mb-4">
                {[
                  { icon: Camera, title: 'Fotos ilimitadas', desc: 'Envie quantas fotos do livro quiser' },
                  { icon: Mic, title: 'Áudio de resumo', desc: 'Grave e envie áudio com a matéria' },
                  { icon: BarChart3, title: 'Sessões ilimitadas', desc: 'Estude sem limite diário' },
                ].map((item) => (
                  <div key={item.title} className="flex items-center gap-3 opacity-85">
                    <div className="w-9 h-9 rounded-lg bg-card/70 border border-royal/30 flex items-center justify-center shrink-0">
                      <item.icon className="h-4 w-4 text-royal" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-display font-bold text-foreground">{item.title}</p>
                      <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                    </div>
                    <Lock className="h-3.5 w-3.5 text-royal/60 shrink-0" />
                  </div>
                ))}
              </div>
              <GameButton variant="purple" size="md" shine className="w-full" onClick={() => navigate('/#planos')}>
                <Crown className="h-4 w-4" /> Desbloquear PRO
              </GameButton>
            </div>
          </GameCard>
        )}

        {/* RECENT ACTIVITY */}
        {recentSessions.length > 0 ? (
          <div className="animate-fade-in" style={{ animationDelay: '280ms' }}>
            <h2 className="font-display font-black text-foreground mb-3 flex items-center gap-2 px-1">
              <Calendar className="h-4 w-4 text-primary" />
              Atividade recente
            </h2>
            <div className="space-y-2">
              {recentSessions.slice(0, 5).map((s) => {
                const pct = Math.round((s.score / s.total) * 100);
                const tone = pct >= 70 ? 'green' : pct >= 50 ? 'gold' : 'coral';
                return (
                  <GameCard
                    key={s.id}
                    tone={tone}
                    interactive
                    className="p-3"
                    onClick={() => navigate(`/sessao/${s.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-12 h-12 rounded-xl flex items-center justify-center text-sm font-display font-black shrink-0 text-stroke-navy',
                        pct >= 70 ? 'bg-gradient-to-b from-xp to-xp-deep shadow-bevel-green text-primary-foreground'
                          : pct >= 50 ? 'bg-gradient-gold shadow-bevel-gold-sm text-primary-foreground'
                          : 'bg-gradient-coral shadow-bevel-coral text-white'
                      )}>
                        {pct}%
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-display font-bold text-foreground truncate">{s.subject}</p>
                        <p className="text-xs text-muted-foreground truncate">{s.topic}</p>
                      </div>
                      <div className="text-right shrink-0 flex flex-col items-end gap-0.5">
                        <span className="inline-flex items-center gap-0.5 text-xs font-mono font-black text-primary">
                          <img src={xpCoin} alt="" width={20} height={20} className="h-3.5 w-3.5 object-contain" loading="lazy" />
                          +{s.xp_earned}
                        </span>
                        <p className="text-[10px] text-muted-foreground font-mono">{formatRelativeDate(s.created_at)}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                  </GameCard>
                );
              })}
            </div>
          </div>
        ) : (
          <GameCard tone="gold" className="p-8 text-center animate-fade-in" style={{ animationDelay: '280ms' }}>
            <Zap className="h-10 w-10 text-primary/60 mx-auto mb-3" />
            <h3 className="font-display font-black text-foreground mb-1">Comece a estudar!</h3>
            <p className="text-sm text-muted-foreground">
              Toque na 💡 para gerar seus primeiros exercícios
            </p>
          </GameCard>
        )}
      </div>
    </div>
  );
}
