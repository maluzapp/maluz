import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProfileStore } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Search, Copy, Users, Trophy, Star, Flame, Check, X, Clock, Heart } from 'lucide-react';
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

export function FriendsTab() {
  const { user } = useAuth();
  const profileId = useProfileStore((s) => s.activeProfileId);
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Friendship[]>([]);
  const [sentRequests, setSentRequests] = useState<Friendship[]>([]);
  const [myCode, setMyCode] = useState('');
  const [searchCode, setSearchCode] = useState('');
  const [searchName, setSearchName] = useState('');
  const [searchResults, setSearchResults] = useState<FriendProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectedIds, setConnectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!profileId || !user) return;
    loadData();
  }, [profileId, user]);

  const loadData = async () => {
    if (!profileId) return;

    const { data: myProfile } = await supabase
      .from('profiles')
      .select('friend_code')
      .eq('id', profileId)
      .single();
    if (myProfile?.friend_code) setMyCode(myProfile.friend_code);

    const { data: friendships } = await supabase
      .from('friendships' as any)
      .select('*')
      .or(`requester_profile_id.eq.${profileId},target_profile_id.eq.${profileId}`)
      .eq('status', 'accepted');

    const { data: pending } = await supabase
      .from('friendships' as any)
      .select('*')
      .eq('target_profile_id', profileId)
      .eq('status', 'pending');

    const { data: sent } = await supabase
      .from('friendships' as any)
      .select('*')
      .eq('requester_profile_id', profileId)
      .eq('status', 'pending');

    const friendIds = (friendships as any[] || []).map((f: any) =>
      f.requester_profile_id === profileId ? f.target_profile_id : f.requester_profile_id
    );
    const pendingIds = (pending as any[] || []).map((p: any) => p.requester_profile_id);
    const sentIds = (sent as any[] || []).map((s: any) => s.target_profile_id);
    const allIds = [...new Set([...friendIds, ...pendingIds, ...sentIds])];

    let profileMap: Record<string, FriendProfile> = {};
    if (allIds.length > 0) {
      const { data: profiles } = await supabase.rpc('get_profiles_by_ids', { _ids: allIds });
      for (const p of (profiles || [])) {
        profileMap[p.id] = p as FriendProfile;
      }
    }

    setFriends((friendships as any[] || []).map((f: any) => {
      const friendId = f.requester_profile_id === profileId ? f.target_profile_id : f.requester_profile_id;
      return { ...f, friend: profileMap[friendId] };
    }).filter((f: any) => f.friend));

    setPendingRequests((pending as any[] || []).map((p: any) => ({
      ...p, friend: profileMap[p.requester_profile_id]
    })).filter((p: any) => p.friend));

    setSentRequests((sent as any[] || []).map((s: any) => ({
      ...s, friend: profileMap[s.target_profile_id]
    })).filter((s: any) => s.friend));

    setConnectedIds(new Set([...friendIds, ...pendingIds, ...sentIds]));
    setLoading(false);
  };

  const copyMyCode = () => {
    navigator.clipboard.writeText(myCode);
    toast.success('Código copiado!');
  };

  const addByCode = async () => {
    if (!searchCode.trim() || !profileId) return;
    const code = searchCode.trim().toUpperCase();
    if (code === myCode) { toast.error('Este é o seu próprio código!'); return; }

    const { data: targets, error: findError } = await supabase.rpc('find_profile_by_friend_code', { _code: code });
    if (findError || !targets || targets.length === 0) { toast.error('Código não encontrado'); return; }

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
    setSearchResults((data || []).filter((p: any) => !connectedIds.has(p.id)) as FriendProfile[]);
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
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* My code */}
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
            Solicitações ({pendingRequests.length})
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

      {/* Friends list */}
      {friends.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-foreground mb-2 flex items-center gap-1.5">
            <Heart className="h-4 w-4 text-primary" />
            Amigos ({friends.length})
          </h2>
          <div className="space-y-2">
            {[...friends].sort((a, b) => b.friend.xp - a.friend.xp).map((f, i) => (
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
                      <span className="flex items-center gap-0.5"><Star className="h-3 w-3 text-primary" /> {f.friend.xp}</span>
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
        </div>
      )}

      {/* Add by code */}
      <Card className="border-primary/15">
        <CardContent className="p-4 space-y-3">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
            <Copy className="h-3.5 w-3.5 text-primary" /> Adicionar por código
          </h3>
          <div className="flex gap-2">
            <Input
              placeholder="Código do amigo"
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
              className="font-mono tracking-widest"
              maxLength={6}
            />
            <Button onClick={addByCode} disabled={!searchCode.trim()}>
              <UserPlus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search by name */}
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
            <div className="space-y-2">
              {searchResults.map((p) => (
                <Card key={p.id} className="border-primary/5">
                  <CardContent className="p-3 flex items-center gap-3">
                    <span className="text-2xl">{p.avatar_emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{p.name}</p>
                      <p className="text-xs text-muted-foreground">Nv.{p.level} · {p.xp} XP</p>
                    </div>
                    <Button size="sm" onClick={() => sendRequest(p.id)} className="gap-1">
                      <UserPlus className="h-3.5 w-3.5" /> Enviar
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sent requests */}
      {sentRequests.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-foreground mb-2 flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-muted-foreground" />
            Enviados ({sentRequests.length})
          </h2>
          <div className="space-y-2">
            {sentRequests.map((s) => (
              <Card key={s.id} className="border-muted">
                <CardContent className="p-3 flex items-center gap-3">
                  <span className="text-2xl">{s.friend.avatar_emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{s.friend.name}</p>
                    <p className="text-[10px] text-muted-foreground">Aguardando resposta</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {friends.length === 0 && pendingRequests.length === 0 && (
        <div className="text-center py-6">
          <Users className="h-10 w-10 text-primary/30 mx-auto mb-3" />
          <h3 className="font-display font-bold text-foreground mb-1">Sem amigos ainda</h3>
          <p className="text-sm text-muted-foreground">Use o código acima ou busque por nome!</p>
        </div>
      )}
    </div>
  );
}
