import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfileStore } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Swords, Send, Clock, CheckCircle, Trophy, Plus, Share2, Eye, RefreshCw, Trash2, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { CreateChallengeModal } from '@/components/challenges/CreateChallengeModal';
import { ChallengeResultModal } from '@/components/challenges/ChallengeResultModal';
import type { Exercise, ExerciseAnswer } from '@/types/study';

interface ChildProfile {
  id: string;
  name: string;
  avatar_emoji: string;
  school_year: string | null;
}

export interface Challenge {
  id: string;
  parent_profile_id: string;
  child_profile_id: string;
  subject: string;
  topic: string;
  year: string;
  exercises_data: Exercise[] | null;
  answers_data: ExerciseAnswer[] | null;
  score: number | null;
  total: number;
  status: string;
  completed_at: string | null;
  created_at: string;
  message: string | null;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffH = Math.floor(diffMs / 3600000);
  if (diffH < 1) return 'Agora';
  if (diffH < 24) return `${diffH}h atrás`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return 'Ontem';
  if (diffD < 7) return `${diffD} dias atrás`;
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function getStatusInfo(status: string) {
  switch (status) {
    case 'pending': return { label: 'Pendente', icon: Clock, color: 'text-amber-400 bg-amber-400/15' };
    case 'in_progress': return { label: 'Em andamento', icon: Swords, color: 'text-primary bg-primary/15' };
    case 'completed': return { label: 'Concluído', icon: CheckCircle, color: 'text-accent bg-accent/15' };
    default: return { label: status, icon: Clock, color: 'text-muted-foreground bg-muted' };
  }
}

export default function Challenges() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const profileId = useProfileStore((s) => s.activeProfileId);
  const [profileType, setProfileType] = useState<string>('child');
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [childProfiles, setChildProfiles] = useState<ChildProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [childNames, setChildNames] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!profileId || !user) return;
    loadData();

    // Realtime subscription for challenge updates
    const channel = supabase
      .channel('challenges-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'challenges',
      }, () => {
        loadData();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [profileId, user]);

  const loadData = async () => {
    if (!profileId) return;

    // Get profile type
    const { data: profile } = await supabase
      .from('profiles')
      .select('profile_type')
      .eq('id', profileId)
      .single();
    
    const pType = profile?.profile_type || 'child';
    setProfileType(pType);

    if (pType === 'parent') {
      // Get linked children
      const { data: links } = await supabase
        .from('parent_child_links')
        .select('child_profile_id')
        .eq('parent_profile_id', profileId);
      
      const childIds = (links || []).map(l => l.child_profile_id);
      
      if (childIds.length > 0) {
        const { data: children } = await supabase
          .from('profiles')
          .select('id, name, avatar_emoji, school_year')
          .in('id', childIds);
        setChildProfiles((children as ChildProfile[]) || []);
        
        const nameMap: Record<string, string> = {};
        for (const c of (children || [])) {
          nameMap[c.id] = c.name;
        }
        setChildNames(nameMap);
      }

      // Get challenges I sent
      const { data: myChallenges } = await supabase
        .from('challenges')
        .select('*')
        .eq('parent_profile_id', profileId)
        .order('created_at', { ascending: false });
      setChallenges((myChallenges as any[] as Challenge[]) || []);
    } else {
      // Child: get challenges sent to me
      const { data: myChallenges } = await supabase
        .from('challenges')
        .select('*')
        .eq('child_profile_id', profileId)
        .order('created_at', { ascending: false });
      setChallenges((myChallenges as any[] as Challenge[]) || []);
    }

    setLoading(false);
  };

  const startChallenge = (challenge: Challenge) => {
    if (!challenge.exercises_data) {
      toast.error('Exercícios ainda não foram gerados');
      return;
    }
    navigate(`/desafio/${challenge.id}`);
  };

  const resendChallenge = async (challenge: Challenge) => {
    const { error } = await supabase.from('challenges' as any).insert({
      parent_profile_id: challenge.parent_profile_id,
      child_profile_id: challenge.child_profile_id,
      subject: challenge.subject,
      topic: challenge.topic,
      year: challenge.year,
      exercises_data: challenge.exercises_data,
      total: challenge.total,
      message: challenge.message,
      status: 'pending',
    });

    if (error) {
      toast.error('Não foi possível reenviar o desafio');
      return;
    }

    toast.success('Desafio reenviado com sucesso!');
    loadData();
  };

  const deleteChallenge = async (challengeId: string) => {
    const { error } = await supabase.from('challenges').delete().eq('id', challengeId);

    if (error) {
      toast.error('Não foi possível excluir o desafio');
      return;
    }

    if (selectedChallenge?.id === challengeId) {
      setSelectedChallenge(null);
    }

    toast.success('Desafio excluído');
    loadData();
  };

  const shareWhatsApp = (challenge: Challenge) => {
    const pct = challenge.score && challenge.total ? Math.round((challenge.score / challenge.total) * 100) : 0;
    const childName = childNames[challenge.child_profile_id] || 'a criança';
    const text = `\u{1F4A1} *Maluz \u2014 Desafio Conclu\u00eddo!*\n\n\u{1F3AF} Desafio: ${challenge.subject} \u2014 ${challenge.topic}\n\u{1F3C6} ${childName} acertou *${challenge.score} de ${challenge.total}* (${pct}%)\n\n\u{1F680} Que tal desafiar seu filho tamb\u00e9m?\nhttps://maluz.app`;
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    window.open(isMobile ? `https://wa.me/?text=${encodeURIComponent(text)}` : `https://web.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const resendViaWhatsApp = (challenge: Challenge) => {
    const childName = childNames[challenge.child_profile_id] || 'Filho(a)';
    const text = `\u{1F4A1} *Maluz \u2014 Novo Desafio!*\n\n\u{1F3AF} ${challenge.subject} \u2014 ${challenge.topic}\n\u{1F4DD} ${challenge.total} exerc\u00edcios\n${challenge.message ? `\u{1F4AC} "${challenge.message}"\n` : ''}\n\u{1F680} Abra o Maluz para resolver!\nhttps://maluz.app`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const pendingChallenges = challenges.filter(c => c.status === 'pending' || c.status === 'in_progress');
  const completedChallenges = challenges.filter(c => c.status === 'completed');

  return (
    <div className="min-h-screen bg-background px-4 py-6 pb-28 md:pb-36 animate-fade-in">
      <div className="mx-auto max-w-lg space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
              <Swords className="h-6 w-6 text-primary" /> Desafios
            </h1>
            <p className="text-sm text-muted-foreground">
              {profileType === 'parent' ? 'Envie desafios para seus filhos' : 'Desafios enviados por seus pais'}
            </p>
          </div>
          {profileType === 'parent' && childProfiles.length > 0 && (
            <Button onClick={() => setShowCreate(true)} size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" /> Novo
            </Button>
          )}
        </div>

        {profileType === 'parent' && childProfiles.length === 0 && (
          <Card className="border-primary/10">
            <CardContent className="p-8 text-center">
              <Swords className="h-10 w-10 text-primary/30 mx-auto mb-3" />
              <h3 className="font-display font-bold text-foreground mb-1">Nenhum filho vinculado</h3>
              <p className="text-sm text-muted-foreground">Vincule um perfil de criança para enviar desafios</p>
            </CardContent>
          </Card>
        )}

        {challenges.length === 0 && (profileType === 'child' || childProfiles.length > 0) && (
          <Card className="border-primary/10">
            <CardContent className="p-8 text-center">
              <Swords className="h-10 w-10 text-primary/30 mx-auto mb-3" />
              <h3 className="font-display font-bold text-foreground mb-1">Nenhum desafio ainda</h3>
              <p className="text-sm text-muted-foreground">
                {profileType === 'parent' ? 'Crie um desafio para seus filhos!' : 'Aguarde desafios dos seus pais!'}
              </p>
            </CardContent>
          </Card>
        )}

        {challenges.length > 0 && (
          <Tabs defaultValue="pendentes">
            <TabsList className="w-full grid grid-cols-2 h-auto gap-1 bg-card border border-primary/15 p-1 rounded-xl">
              <TabsTrigger value="pendentes" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg py-2">
                Pendentes ({pendingChallenges.length})
              </TabsTrigger>
              <TabsTrigger value="concluidos" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg py-2">
                Concluídos ({completedChallenges.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pendentes" className="mt-4 space-y-2">
              {pendingChallenges.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">Nenhum desafio pendente</p>
              ) : (
                pendingChallenges.map((c) => {
                  const status = getStatusInfo(c.status);
                  const StatusIcon = status.icon;
                  return (
                    <Card key={c.id} className="border-primary/10 animate-fade-in">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-display font-bold text-foreground truncate">{c.subject}</p>
                            <p className="text-sm text-muted-foreground truncate">{c.topic}</p>
                            {c.message && (
                              <p className="text-xs text-muted-foreground mt-1 italic">"{c.message}"</p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className={cn('text-[10px] gap-1', status.color)}>
                                <StatusIcon className="h-3 w-3" /> {status.label}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground">{formatDate(c.created_at)}</span>
                            </div>
                            {profileType === 'parent' && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Para: {childNames[c.child_profile_id] || 'Filho'}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-1.5 shrink-0">
                            {profileType === 'child' && c.status === 'pending' && (
                              <Button size="sm" onClick={() => startChallenge(c)} className="gap-1.5 shrink-0">
                                <Swords className="h-3.5 w-3.5" /> Iniciar
                              </Button>
                            )}
                            {profileType === 'parent' && (
                              <>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => resendChallenge(c)} title="Reenviar no app">
                                  <RefreshCw className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-green-500" onClick={() => resendViaWhatsApp(c)} title="Reenviar via WhatsApp">
                                  <MessageCircle className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteChallenge(c.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </TabsContent>

            <TabsContent value="concluidos" className="mt-4 space-y-2">
              {completedChallenges.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">Nenhum desafio concluído</p>
              ) : (
                completedChallenges.map((c) => {
                  const pct = c.score && c.total ? Math.round((c.score / c.total) * 100) : 0;
                  return (
                    <Card key={c.id} className="border-primary/10 animate-fade-in cursor-pointer hover:border-primary/20 transition-colors"
                      onClick={() => navigate(`/desafio/${c.id}/revisao`)}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            'w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold shrink-0',
                            pct >= 70 ? 'bg-accent/15 text-accent' : pct >= 50 ? 'bg-primary/15 text-primary' : 'bg-destructive/15 text-destructive'
                          )}>
                            {pct}%
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-display font-bold text-foreground truncate">{c.subject}</p>
                            <p className="text-sm text-muted-foreground truncate">{c.topic}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-muted-foreground">{c.score}/{c.total} acertos</span>
                              <span className="text-[10px] text-muted-foreground">{formatDate(c.completed_at || c.created_at)}</span>
                            </div>
                            {profileType === 'parent' && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {childNames[c.child_profile_id] || 'Filho'}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-1.5 shrink-0">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); navigate(`/desafio/${c.id}/revisao`); }}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); resendChallenge(c); }}>
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); shareWhatsApp(c); }}>
                              <Share2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); deleteChallenge(c.id); }}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>

      {showCreate && (
        <CreateChallengeModal
          children={childProfiles}
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); loadData(); }}
        />
      )}

      {selectedChallenge && (
        <ChallengeResultModal
          challenge={selectedChallenge}
          childName={childNames[selectedChallenge.child_profile_id] || 'Filho'}
          onClose={() => setSelectedChallenge(null)}
        />
      )}
    </div>
  );
}
