import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProfileStore } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserPlus, Search, Copy, Users, Trophy, Star, Flame, Check, X, Clock } from 'lucide-react';
import { ReactionBar } from '@/components/ReactionBar';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface FriendProfile {
  id: string;
  name: string;
  avatar_emoji: string;
  xp: number;
  level: number;
  streak_days: number;
  friend_code: string | null;
}

interface Friendship {
  id: string;
  requester_profile_id: string;
  target_profile_id: string;
  status: string;
  created_at: string;
  friend: FriendProfile;
}

interface FriendActivity {
  id: string;
  subject: string;
  topic: string;
  score: number;
  total: number;
  xp_earned: number;
  created_at: string;
  profile: FriendProfile;
}

function formatRelativeDate(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffH = Math.floor(diffMs / 3600000);
  if (diffH < 1) return 'Agora';
  if (diffH < 24) return `${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return 'Ontem';
  if (diffD < 7) return `${diffD}d`;
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

export default function Friends() {
  const { user } = useAuth();
  const profileId = useProfileStore((s) => s.activeProfileId);
  const [activeTab, setActiveTab] = useState('feed');
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Friendship[]>([]);
  const [sentRequests, setSentRequests] = useState<Friendship[]>([]);
  const [activities, setActivities] = useState<FriendActivity[]>([]);
  const [myCode, setMyCode] = useState('');
  const [searchCode, setSearchCode] = useState('');
  const [searchName, setSearchName] = useState('');
  const [searchResults, setSearchResults] = useState<FriendProfile[]>([]);
  const [loading, setLoading] = useState(true);
  // Track IDs already connected (friends + pending sent/received)
  const [connectedIds, setConnectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!profileId || !user) return;
    loadData();
  }, [profileId, user]);

  const loadData = async () => {
    if (!profileId) return;

    // Get my friend code
    const { data: myProfile } = await supabase
      .from('profiles')
      .select('friend_code')
      .eq('id', profileId)
      .single();
    if (myProfile?.friend_code) setMyCode(myProfile.friend_code);

    // Get accepted friendships
    const { data: friendships } = await supabase
      .from('friendships' as any)
      .select('*')
      .or(`requester_profile_id.eq.${profileId},target_profile_id.eq.${profileId}`)
      .eq('status', 'accepted');

    // Get pending requests targeting me
    const { data: pending } = await supabase
      .from('friendships' as any)
      .select('*')
      .eq('target_profile_id', profileId)
      .eq('status', 'pending');

    // Get requests I sent (pending)
    const { data: sent } = await supabase
      .from('friendships' as any)
      .select('*')
      .eq('requester_profile_id', profileId)
      .eq('status', 'pending');

    // Get friend profile IDs
    const friendIds = (friendships as any[] || []).map((f: any) =>
      f.requester_profile_id === profileId ? f.target_profile_id : f.requester_profile_id
    );
    const pendingIds = (pending as any[] || []).map((p: any) => p.requester_profile_id);
    const sentIds = (sent as any[] || []).map((s: any) => s.target_profile_id);
    const allIds = [...new Set([...friendIds, ...pendingIds, ...sentIds])];

    let profileMap: Record<string, FriendProfile> = {};
    if (allIds.length > 0) {
      const { data: profiles } = await supabase
        .rpc('get_profiles_by_ids', { _ids: allIds });
      for (const p of (profiles || [])) {
        profileMap[p.id] = p as FriendProfile;
      }
    }

    const mappedFriends = (friendships as any[] || []).map((f: any) => {
      const friendId = f.requester_profile_id === profileId ? f.target_profile_id : f.requester_profile_id;
      return { ...f, friend: profileMap[friendId] };
    }).filter((f: any) => f.friend);

    const mappedPending = (pending as any[] || []).map((p: any) => ({
      ...p, friend: profileMap[p.requester_profile_id]
    })).filter((p: any) => p.friend);

    const mappedSent = (sent as any[] || []).map((s: any) => ({
      ...s, friend: profileMap[s.target_profile_id]
    })).filter((s: any) => s.friend);

    setFriends(mappedFriends);
    setPendingRequests(mappedPending);
    setSentRequests(mappedSent);
    setConnectedIds(new Set([...friendIds, ...pendingIds, ...sentIds]));

    // Get friends' recent sessions
    if (friendIds.length > 0) {
      const { data: sessions } = await supabase
        .from('study_sessions')
        .select('id, subject, topic, score, total, xp_earned, created_at, profile_id')
        .in('profile_id', friendIds)
        .order('created_at', { ascending: false })
        .limit(30);

      const mappedActivities = (sessions || []).map((s: any) => ({
        ...s,
        profile: profileMap[s.profile_id],
      })).filter((a: any) => a.profile);

      setActivities(mappedActivities as FriendActivity[]);
    }

    setLoading(false);
  };

  const copyMyCode = () => {
    navigator.clipboard.writeText(myCode);
    toast.success('Código copiado!');
  };

  const addByCode = async () => {
    if (!searchCode.trim() || !profileId) return;
    const code = searchCode.trim().toUpperCase();
    if (code === myCode) {
      toast.error('Este é o seu próprio código!');
      return;
    }

    const { data: targets, error: findError } = await supabase
      .rpc('find_profile_by_friend_code', { _code: code });

    if (findError || !targets || targets.length === 0) {
      toast.error('Código não encontrado');
      return;
    }

    const target = targets[0];

    const { error } = await supabase.from('friendships' as any).insert({
      requester_profile_id: profileId,
      target_profile_id: target.id,
    });

    if (error) {
      if (error.code === '23505') toast.error('Solicitação já enviada!');
      else toast.error('Erro ao enviar solicitação');
      return;
    }

    toast.success(`Solicitação enviada para ${target.name}!`);
    setSearchCode('');
    loadData();
  };

  const searchByName = async () => {
    if (!searchName.trim() || !profileId) return;
    const { data } = await supabase
      .from('profiles')
      .select('id, name, avatar_emoji, xp, level, streak_days, friend_code')
      .ilike('name', `%${searchName.trim()}%`)
      .neq('id', profileId)
      .eq('profile_type', 'child')
      .limit(20);

    // Filter out already connected profiles
    const filtered = (data || []).filter((p: any) => !connectedIds.has(p.id));
    setSearchResults(filtered as FriendProfile[]);
  };

  const sendRequest = async (targetId: string) => {
    if (!profileId) return;
    const { error } = await supabase.from('friendships' as any).insert({
      requester_profile_id: profileId,
      target_profile_id: targetId,
    });
    if (error) {
      if (error.code === '23505') toast.error('Solicitação já enviada!');
      else toast.error('Erro ao enviar solicitação');
      return;
    }
    toast.success('Solicitação enviada!');
    setSearchResults(prev => prev.filter(p => p.id !== targetId));
  };

  const respondRequest = async (friendshipId: string, accept: boolean) => {
    if (accept) {
      await supabase.from('friendships' as any).update({ status: 'accepted' }).eq('id', friendshipId);
      toast.success('Amigo adicionado!');
    } else {
      await supabase.from('friendships' as any).delete().eq('id', friendshipId);
      toast('Solicitação recusada');
    }
    loadData();
  };

  const removeFriend = async (friendshipId: string) => {
    await supabase.from('friendships' as any).delete().eq('id', friendshipId);
    toast('Amigo removido');
    loadData();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-6 pb-28 md:pb-36 animate-fade-in">
      <div className="mx-auto max-w-lg space-y-5">
        {/* Header */}
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" /> Amigos
          </h1>
          <p className="text-sm text-muted-foreground">Acompanhe seus amigos e compare resultados</p>
        </div>

        {/* My friend code */}
        <Card className="border-primary/20">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1.5 font-mono uppercase">Meu código de amigo</p>
            <div className="flex items-center gap-2">
              <span className="font-mono text-2xl font-bold text-primary tracking-[0.3em] flex-1">{myCode}</span>
              <Button variant="outline" size="sm" onClick={copyMyCode} className="gap-1.5">
                <Copy className="h-3.5 w-3.5" /> Copiar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Pending requests */}
        {pendingRequests.length > 0 && (
          <div>
            <h2 className="text-sm font-bold text-foreground mb-2 flex items-center gap-1.5">
              <UserPlus className="h-4 w-4 text-primary" />
              Solicitações pendentes ({pendingRequests.length})
            </h2>
            <div className="space-y-2">
              {pendingRequests.map((req) => (
                <Card key={req.id} className="border-primary/15">
                  <CardContent className="p-3 flex items-center gap-3">
                    <span className="text-3xl">{req.friend.avatar_emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground text-sm">{req.friend.name}</p>
                      <p className="text-xs text-muted-foreground">Nv.{req.friend.level} · {req.friend.xp} XP</p>
                    </div>
                    <div className="flex gap-1.5">
                      <Button size="icon" variant="default" className="h-8 w-8" onClick={() => respondRequest(req.id, true)}>
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground" onClick={() => respondRequest(req.id, false)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-3 h-auto gap-1 bg-card border border-primary/15 p-1 rounded-xl">
            <TabsTrigger value="feed" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg py-2">
              Feed
            </TabsTrigger>
            <TabsTrigger value="ranking" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg py-2">
              Ranking
            </TabsTrigger>
            <TabsTrigger value="adicionar" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg py-2">
              Adicionar
            </TabsTrigger>
          </TabsList>

          {/* Feed tab */}
          <TabsContent value="feed" className="mt-4 space-y-2">
            {activities.length === 0 ? (
              <Card className="border-primary/10">
                <CardContent className="p-8 text-center">
                  <Users className="h-10 w-10 text-primary/30 mx-auto mb-3" />
                  <h3 className="font-display font-bold text-foreground mb-1">Nenhuma atividade</h3>
                  <p className="text-sm text-muted-foreground">Adicione amigos para ver o que estão estudando!</p>
                </CardContent>
              </Card>
            ) : (
              activities.map((a) => {
                const pct = Math.round((a.score / a.total) * 100);
                return (
                  <Card key={a.id} className="border-primary/5">
                    <CardContent className="p-3 flex items-start gap-3">
                      <span className="text-2xl mt-0.5">{a.profile.avatar_emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-semibold text-foreground">{a.profile.name}</p>
                          <span className="text-[10px] text-muted-foreground">{formatRelativeDate(a.created_at)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Estudou <span className="text-foreground font-medium">{a.subject}</span> — {a.topic}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <Badge variant={pct >= 70 ? 'default' : 'secondary'} className={cn(
                            'text-[10px]',
                            pct >= 70 ? 'bg-accent text-accent-foreground' : pct >= 50 ? '' : 'bg-destructive/15 text-destructive border-0'
                          )}>
                            {pct}% acerto
                          </Badge>
                          <span className="text-xs text-primary font-mono">+{a.xp_earned} XP</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>

          {/* Ranking tab */}
          <TabsContent value="ranking" className="mt-4">
            {friends.length === 0 ? (
              <Card className="border-primary/10">
                <CardContent className="p-8 text-center">
                  <Trophy className="h-10 w-10 text-primary/30 mx-auto mb-3" />
                  <h3 className="font-display font-bold text-foreground mb-1">Sem amigos ainda</h3>
                  <p className="text-sm text-muted-foreground">Adicione amigos para comparar!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {[...friends]
                  .sort((a, b) => b.friend.xp - a.friend.xp)
                  .map((f, i) => (
                    <Card key={f.id} className="border-primary/10">
                      <CardContent className="p-3 flex items-center gap-3">
                        <span className={cn(
                          'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                          i === 0 ? 'bg-primary text-primary-foreground' : i === 1 ? 'bg-accent/20 text-accent' : 'bg-muted text-muted-foreground'
                        )}>
                          {i + 1}
                        </span>
                        <span className="text-2xl">{f.friend.avatar_emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground">{f.friend.name}</p>
                          <div className="flex gap-2 text-[10px] text-muted-foreground mt-0.5">
                            <span className="flex items-center gap-0.5"><Star className="h-3 w-3 text-primary" /> {f.friend.xp} XP</span>
                            <span className="flex items-center gap-0.5"><Flame className="h-3 w-3 text-destructive" /> {f.friend.streak_days}d</span>
                            <span>Nv.{f.friend.level}</span>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => removeFriend(f.id)}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )}
          </TabsContent>

          {/* Add friends tab */}
          <TabsContent value="adicionar" className="mt-4 space-y-4">
            <p className="text-xs text-muted-foreground">
              Ao enviar um convite, o amigo precisa aceitar antes de vocês serem conectados.
            </p>

            {/* By code */}
            <Card className="border-primary/15">
              <CardContent className="p-4 space-y-3">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  <Copy className="h-3.5 w-3.5 text-primary" /> Enviar convite por código
                </h3>
                <p className="text-[10px] text-muted-foreground">Peça o código de 6 dígitos do seu amigo</p>
                <div className="flex gap-2">
                  <Input
                    placeholder="Código do amigo"
                    value={searchCode}
                    onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
                    className="font-mono tracking-widest uppercase"
                    maxLength={6}
                  />
                  <Button onClick={addByCode} disabled={searchCode.length < 4}>
                    <UserPlus className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* By name */}
            <Card className="border-primary/15">
              <CardContent className="p-4 space-y-3">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  <Search className="h-3.5 w-3.5 text-primary" /> Buscar por nome
                </h3>
                <div className="flex gap-2">
                  <Input
                    placeholder="Nome do amigo"
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                  />
                  <Button onClick={searchByName} disabled={!searchName.trim()}>
                    <Search className="h-4 w-4" />
                  </Button>
                </div>

                {searchResults.length > 0 && (
                  <div className="space-y-2 mt-2">
                    <p className="text-[10px] text-muted-foreground">{searchResults.length} resultado(s) encontrado(s)</p>
                    {searchResults.map((p) => (
                      <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 border border-primary/5">
                        <span className="text-2xl">{p.avatar_emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground">{p.name}</p>
                          <p className="text-[10px] text-muted-foreground">Nv.{p.level} · {p.xp} XP · {p.friend_code}</p>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => sendRequest(p.id)} className="gap-1 text-xs">
                          <UserPlus className="h-3.5 w-3.5" /> Enviar convite
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Sent requests */}
            {sentRequests.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-foreground mb-2 flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  Convites enviados ({sentRequests.length})
                </h3>
                <div className="space-y-2">
                  {sentRequests.map((req) => (
                    <Card key={req.id} className="border-muted">
                      <CardContent className="p-3 flex items-center gap-3">
                        <span className="text-2xl">{req.friend.avatar_emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground">{req.friend.name}</p>
                          <p className="text-[10px] text-muted-foreground">Aguardando aceitação...</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => removeFriend(req.id)}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
