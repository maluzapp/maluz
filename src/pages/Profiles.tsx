import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useProfileStore } from '@/hooks/useProfile';
import { useStripeSubscription, useUserSubscription, usePlans, startCheckout, openCustomerPortal } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import { Plus, LogOut, Trash2, Pencil, Link2, Copy, UserPlus, Users, Baby, ShieldCheck, Eye, Crown, CreditCard, ArrowUpRight, Heart, Search, Check, X, Star, Flame, Clock } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { YEAR_OPTIONS, getYearLabel } from '@/constants/years';
import { toast } from 'sonner';

const AVATARS = ['🧑‍🎓', '👧', '👦', '🦸', '🧙', '🦊', '🐱', '🦄', '🚀', '⭐', '🐶', '🐼', '🦁', '🐸', '🦋', '🌟', '🎨', '🎮', '🏀', '🎸', '🧑‍🚀', '🧑‍💻', '👩‍🔬', '🧑‍🏫', '🦸‍♀️', '🧚', '🐉', '🌈', '🎯', '🏆'];

interface Profile {
  id: string;
  name: string;
  avatar_emoji: string;
  school_year: string | null;
  xp: number;
  level: number;
  streak_days: number;
  profile_type: string;
  total_exercises: number;
  total_correct: number;
}

interface LinkedChild {
  id: string;
  child: Profile;
}

export default function Profiles() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const setActiveProfile = useProfileStore((s) => s.setActiveProfile);
  const { data: stripeStatus, isLoading: stripeLoading } = useStripeSubscription();
  const { data: dbSub, isLoading: dbSubLoading } = useUserSubscription();
  const { data: plans } = usePlans();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [linkedChildren, setLinkedChildren] = useState<LinkedChild[]>([]);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('🧑‍🎓');
  const [selectedYear, setSelectedYear] = useState('');
  const [profileType, setProfileType] = useState<'child' | 'parent'>('child');
  const [loadingProfiles, setLoadingProfiles] = useState(true);

  // Invite code states
  const [generatedCode, setGeneratedCode] = useState('');
  const [linkingCode, setLinkingCode] = useState('');
  const [viewingChild, setViewingChild] = useState<Profile | null>(null);
  const [activeTab, setActiveTab] = useState('meus');
  const hasLoadedRef = useRef<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');

  useEffect(() => {
    if (!loading && !user) navigate('/login');
  }, [user, loading, navigate]);

  const syncActiveProfile = (list: Profile[]) => {
    const current = useProfileStore.getState().activeProfileId;

    if (current && list.length > 0 && !list.find((p) => p.id === current)) {
      setActiveProfile(list[0].id);
    } else if (!current && list.length > 0) {
      setActiveProfile(list[0].id);
    } else if (list.length === 0) {
      setActiveProfile(null);
    }
  };

  const fetchProfilesData = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, name, avatar_emoji, school_year, xp, level, streak_days, profile_type, total_exercises, total_correct')
      .order('created_at');

    return (data as Profile[]) || [];
  };

  const fetchLinkedChildrenData = async (profileList: Profile[]) => {
    const parentIds = profileList.filter((profile) => profile.profile_type === 'parent').map((profile) => profile.id);

    if (parentIds.length === 0) return [] as LinkedChild[];

    const { data: links } = await supabase
      .from('parent_child_links' as any)
      .select('id, child_profile_id')
      .in('parent_profile_id', parentIds);

    if (!links || links.length === 0) return [] as LinkedChild[];

    const childIds = (links as any[]).map((link: any) => link.child_profile_id);
    const { data: children } = await supabase
      .from('profiles')
      .select('id, name, avatar_emoji, school_year, xp, level, streak_days, profile_type, total_exercises, total_correct')
      .in('id', childIds);

    return (links as any[])
      .map((link: any) => ({
        id: link.id,
        child: (children as Profile[])?.find((child) => child.id === link.child_profile_id),
      }))
      .filter((link) => link.child) as LinkedChild[];
  };

  const loadPageData = async () => {
    const profileList = await fetchProfilesData();
    const childLinks = await fetchLinkedChildrenData(profileList);

    setProfiles(profileList);
    setLinkedChildren(childLinks);
    syncActiveProfile(profileList);
    setLoadingProfiles(false);
  };

  useEffect(() => {
    if (!user || loading) return;
    if (hasLoadedRef.current === user.id) return;

    hasLoadedRef.current = user.id;
    loadPageData();
  }, [user, loading]);

  const createProfile = async () => {
    if (!newName.trim() || !user) return;
    await supabase.from('profiles').insert({
      user_id: user.id,
      name: newName.trim(),
      avatar_emoji: selectedAvatar,
      school_year: profileType === 'child' ? (selectedYear || null) : null,
      profile_type: profileType,
    } as any);
    resetForm();
    await loadPageData();
  };

  const startEditing = (p: Profile) => {
    setEditing(p.id);
    setNewName(p.name);
    setSelectedAvatar(p.avatar_emoji);
    setSelectedYear(p.school_year || '');
    setProfileType(p.profile_type as 'child' | 'parent');
  };

  const saveEdit = async () => {
    if (!editing || !newName.trim()) return;
    await supabase.from('profiles').update({
      name: newName.trim(),
      avatar_emoji: selectedAvatar,
      school_year: profileType === 'child' ? (selectedYear || null) : null,
      profile_type: profileType,
    } as any).eq('id', editing);
    resetForm();
    await loadPageData();
  };

  const resetForm = () => {
    setNewName('');
    setSelectedAvatar('🧑‍🎓');
    setSelectedYear('');
    setProfileType('child');
    setCreating(false);
    setEditing(null);
  };

  const deleteProfile = async (id: string) => {
    // Clear active profile if it's the one being deleted
    const current = useProfileStore.getState().activeProfileId;
    if (current === id) {
      setActiveProfile(null);
    }
    await supabase.from('profiles').delete().eq('id', id);
    await loadPageData();
  };

  const selectProfile = (id: string) => {
    setActiveProfile(id);
    navigate('/inicio');
  };

  const handleSignOut = async () => {
    setActiveProfile(null);
    await signOut();
    navigate('/login');
  };

  // Generate invite code for a child profile
  const generateInviteCode = async (profileId: string) => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const { error } = await supabase.from('invite_codes' as any).insert({
      code,
      profile_id: profileId,
    });
    if (error) {
      toast.error('Erro ao gerar código');
      return;
    }
    setGeneratedCode(code);
    toast.success('Código gerado!');
  };

  const copyCode = () => {
    navigator.clipboard.writeText(generatedCode);
    toast.success('Código copiado!');
  };

  // Link child via code (for parent profiles)
  const linkChild = async (parentProfileId: string) => {
    if (!linkingCode.trim()) return;
    const { data: codeData } = await supabase
      .from('invite_codes' as any)
      .select('*')
      .eq('code', linkingCode.trim().toUpperCase())
      .eq('used', false)
      .single();

    if (!codeData) {
      toast.error('Código inválido ou já utilizado');
      return;
    }

    const { error: linkError } = await supabase.from('parent_child_links' as any).insert({
      parent_profile_id: parentProfileId,
      child_profile_id: (codeData as any).profile_id,
    });

    if (linkError) {
      toast.error('Erro ao vincular: ' + linkError.message);
      return;
    }

    await supabase.from('invite_codes' as any).update({
      used: true,
      used_by: parentProfileId,
    } as any).eq('id', (codeData as any).id);

    setLinkingCode('');
    toast.success('Filho vinculado com sucesso!');
    await loadPageData();
  };

  if (loading || loadingProfiles) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  
  const parentProfiles = profiles.filter(p => p.profile_type === 'parent');
  const hasParent = parentProfiles.length > 0;

  // Child detail view for parents
  if (viewingChild) {
    const accuracy = viewingChild.total_exercises > 0
      ? Math.round((viewingChild.total_correct / viewingChild.total_exercises) * 100)
      : 0;

    return (
      <div className="min-h-screen bg-background px-4 py-6 pb-28 md:pb-36">
        <div className="mx-auto max-w-md">
          <Button variant="ghost" className="mb-4 gap-2" onClick={() => setViewingChild(null)}>
            ← Voltar
          </Button>

          <div className="text-center mb-6 animate-fade-in">
            <span className="text-6xl block mb-2">{viewingChild.avatar_emoji}</span>
            <h1 className="font-display text-2xl font-bold text-foreground">{viewingChild.name}</h1>
            {viewingChild.school_year && (
              <p className="text-sm text-primary">{getYearLabel(viewingChild.school_year)}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 mb-5 animate-fade-in" style={{ animationDelay: '100ms' }}>
            <Card className="border-primary/10">
              <CardContent className="p-3 text-center">
                <p className="font-display font-bold text-2xl text-foreground">{viewingChild.xp}</p>
                <p className="text-xs text-muted-foreground">⭐ XP Total</p>
              </CardContent>
            </Card>
            <Card className="border-primary/10">
              <CardContent className="p-3 text-center">
                <p className="font-display font-bold text-2xl text-foreground">Nv.{viewingChild.level}</p>
                <p className="text-xs text-muted-foreground">📊 Nível</p>
              </CardContent>
            </Card>
            <Card className="border-primary/10">
              <CardContent className="p-3 text-center">
                <p className="font-display font-bold text-2xl text-foreground">{viewingChild.streak_days}</p>
                <p className="text-xs text-muted-foreground">🔥 Dias seguidos</p>
              </CardContent>
            </Card>
            <Card className="border-primary/10">
              <CardContent className="p-3 text-center">
                <p className="font-display font-bold text-2xl text-foreground">{accuracy}%</p>
                <p className="text-xs text-muted-foreground">🎯 Precisão</p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-primary/10 animate-fade-in" style={{ animationDelay: '200ms' }}>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">Total de exercícios</p>
              <p className="font-display font-bold text-3xl text-foreground">{viewingChild.total_exercises}</p>
              <p className="text-xs text-muted-foreground mt-1">{viewingChild.total_correct} acertos</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const subDataLoaded = !stripeLoading && !dbSubLoading;
  const isPro = subDataLoaded && !!(stripeStatus?.subscribed || (dbSub?.status === 'active' && dbSub?.plan?.slug !== 'free'));

  const ProfileCard = ({ p, idx }: { p: Profile; idx: number }) => (
    <Card
      key={p.id}
      className="cursor-pointer hover:border-primary/50 transition-all duration-300"
    >
      <CardContent className="p-4 flex items-center gap-4">
        <button onClick={() => selectProfile(p.id)} className="flex-1 flex items-center gap-4 text-left">
          <div className="relative">
            <span className="text-4xl">{p.avatar_emoji}</span>
            {isPro && (
              <span className="absolute -top-1 -right-2 bg-primary text-primary-foreground text-[8px] font-bold px-1 py-0.5 rounded-full leading-none">PRO</span>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-display font-bold text-foreground">{p.name}</p>
              {p.profile_type === 'parent' && (
                <span className="bg-primary/15 text-primary text-[10px] px-1.5 py-0.5 rounded-full font-mono">Pai/Mãe</span>
              )}
              {isPro && (
                <Badge className="bg-primary text-primary-foreground border-0 text-[10px] px-1.5 py-0 h-4"><Crown className="h-3 w-3 mr-0.5" /> PRO</Badge>
              )}
            </div>
            {p.school_year && (
              <p className="text-xs text-primary font-medium">{getYearLabel(p.school_year)}</p>
            )}
            <div className="flex gap-3 text-xs text-muted-foreground mt-1">
              <span>⭐ {p.xp} XP</span>
              <span>📊 Nível {p.level}</span>
              <span>🔥 {p.streak_days} dias</span>
            </div>
          </div>
        </button>
        <div className="flex flex-col gap-1 shrink-0">
          {p.profile_type === 'child' && (
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary h-8 w-8"
              onClick={(e) => { e.stopPropagation(); generateInviteCode(p.id); }}
              title="Gerar código de convite">
              <Link2 className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary h-8 w-8"
            onClick={(e) => { e.stopPropagation(); startEditing(p); }}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive h-8 w-8"
            onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(p.id); setDeleteConfirmName(p.name); }}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background px-4 py-6 pb-28 md:pb-36">
      <div className="mx-auto max-w-md">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">👋 Quem vai estudar?</h1>
            <p className="text-sm text-muted-foreground">Gerencie perfis e família</p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleSignOut}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>

        {/* Generated invite code display */}
        {generatedCode && (
          <Card className="mb-4 border-primary/30 animate-scale-in">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-2">Código de convite (24h):</p>
              <div className="flex items-center gap-2">
                <span className="font-mono text-2xl font-bold text-primary tracking-widest flex-1">{generatedCode}</span>
                <Button variant="outline" size="sm" onClick={copyCode}><Copy className="h-4 w-4" /></Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Envie este código para o pai/mãe vincular ao perfil</p>
              <Button variant="ghost" size="sm" className="mt-2 text-xs" onClick={() => setGeneratedCode('')}>Fechar</Button>
            </CardContent>
          </Card>
        )}

        {/* Meu Plano card */}
        {(() => {
          const isPro = subDataLoaded && !!(stripeStatus?.subscribed || (dbSub?.status === 'active' && dbSub?.plan?.slug !== 'free'));
          const hasStripePortal = !!stripeStatus?.subscribed;
          const currentPlanSlug = isPro
            ? (stripeStatus?.price_id
              ? (stripeStatus.price_id.includes('familia') ? 'familia' : 'pro')
              : dbSub?.plan?.slug ?? 'pro')
            : 'free';
          const planName = currentPlanSlug === 'familia' ? 'Família' : currentPlanSlug === 'pro' ? 'Pro' : 'Free';
          const endDate = stripeStatus?.subscription_end
            ? new Date(stripeStatus.subscription_end).toLocaleDateString('pt-BR')
            : dbSub?.expires_at
              ? new Date(dbSub.expires_at).toLocaleDateString('pt-BR')
              : null;

          return (
            <Card className={`mb-4 border-primary/20 ${isPro ? 'bg-primary/5' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Crown className={`h-5 w-5 ${isPro ? 'text-primary' : 'text-muted-foreground'}`} />
                    <h3 className="font-display font-bold text-foreground">Meu Plano</h3>
                  </div>
                  <Badge className={isPro
                    ? 'bg-primary text-primary-foreground border-0'
                    : 'bg-muted text-muted-foreground border-0'
                  }>
                    {planName}
                  </Badge>
                </div>

                {isPro && endDate && (
                  <p className="text-xs text-muted-foreground mb-3">
                    Válido até {endDate}
                  </p>
                )}

                {!isPro && (
                  <p className="text-xs text-muted-foreground mb-3">
                    3 sessões por dia · 1 perfil · Correções básicas
                  </p>
                )}

                <div className="flex gap-2">
                  {isPro ? (
                    hasStripePortal ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 flex-1"
                        onClick={async () => {
                          try {
                            const result = await openCustomerPortal();
                            if (!result?.url) {
                              toast.error('Não foi possível abrir o portal agora.');
                            }
                          } catch {
                            toast.error('Não foi possível abrir o portal agora.');
                          }
                        }}
                      >
                        <CreditCard className="h-3.5 w-3.5" /> Gerenciar assinatura
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 flex-1"
                        onClick={() => navigate('/#planos')}
                      >
                        <ArrowUpRight className="h-3.5 w-3.5" /> Ver planos
                      </Button>
                    )
                  ) : (
                    <>
                      <Button
                        size="sm"
                        className="gap-1.5 flex-1"
                        onClick={() => startCheckout('pro', 'yearly')}
                      >
                        <ArrowUpRight className="h-3.5 w-3.5" /> Upgrade Pro
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => navigate('/#planos')}
                      >
                        Ver planos
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })()}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-3 h-auto gap-1 bg-card border border-primary/15 p-1 rounded-xl mb-4">
            <TabsTrigger value="meus" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg py-2.5">
              <Baby className="h-3.5 w-3.5 mr-1" /> Perfis
            </TabsTrigger>
            <TabsTrigger value="familia" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg py-2.5">
              <Users className="h-3.5 w-3.5 mr-1" /> Família
            </TabsTrigger>
            <TabsTrigger value="amigos" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg py-2.5">
              <Heart className="h-3.5 w-3.5 mr-1" /> Amigos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="meus">
            <div className="space-y-3 mb-4">
              {profiles.map((p, idx) => <ProfileCard key={p.id} p={p} idx={idx} />)}
            </div>

            {(creating || editing) ? (
              <Card className="animate-scale-in">
                <CardContent className="p-5 space-y-4">
                  <h2 className="font-display font-bold text-foreground">
                    {editing ? 'Editar perfil' : 'Novo perfil'}
                  </h2>

                  {/* Profile type selector */}
                  {!editing && (
                    <div className="flex gap-2">
                      <Button
                        variant={profileType === 'child' ? 'default' : 'outline'}
                        size="sm"
                        className="flex-1 gap-1.5"
                        onClick={() => setProfileType('child')}
                      >
                        <Baby className="h-3.5 w-3.5" /> Estudante
                      </Button>
                      <Button
                        variant={profileType === 'parent' ? 'default' : 'outline'}
                        size="sm"
                        className="flex-1 gap-1.5"
                        onClick={() => setProfileType('parent')}
                      >
                        <ShieldCheck className="h-3.5 w-3.5" /> Pai/Mãe
                      </Button>
                    </div>
                  )}

                  <Input placeholder={profileType === 'parent' ? 'Nome do responsável' : 'Nome do estudante'} value={newName} onChange={(e) => setNewName(e.target.value)} autoFocus />

                  {profileType === 'child' && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Série:</p>
                      <Select value={selectedYear} onValueChange={setSelectedYear}>
                        <SelectTrigger><SelectValue placeholder="Selecione a série" /></SelectTrigger>
                        <SelectContent>
                          {YEAR_OPTIONS.map((y) => (
                            <SelectItem key={y.value} value={y.value}>{y.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Escolha um avatar:</p>
                    <div className="flex flex-wrap gap-2">
                      {AVATARS.map((emoji) => (
                        <button key={emoji} onClick={() => setSelectedAvatar(emoji)}
                          className={`text-3xl p-1.5 rounded-lg transition-all ${
                            selectedAvatar === emoji ? 'bg-primary/15 ring-2 ring-primary scale-110' : 'hover:bg-muted'
                          }`}>
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button className="flex-1 font-display font-bold" onClick={editing ? saveEdit : createProfile} disabled={!newName.trim()}>
                      {editing ? 'Salvar' : 'Criar'}
                    </Button>
                    <Button variant="outline" onClick={resetForm}>Cancelar</Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Button variant="outline" className="w-full gap-2" onClick={() => setCreating(true)}>
                <Plus className="h-4 w-4" /> Adicionar perfil
              </Button>
            )}
          </TabsContent>

          <TabsContent value="familia">
            {hasParent ? (
              <div className="space-y-4">
                {/* Link child section */}
                <Card className="border-primary/20">
                  <CardContent className="p-4 space-y-3">
                    <h3 className="font-display font-bold text-foreground flex items-center gap-2">
                      <UserPlus className="h-4 w-4 text-primary" />
                      Vincular filho
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Digite o código de convite gerado no perfil do seu filho
                    </p>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Ex: ABC123"
                        value={linkingCode}
                        onChange={(e) => setLinkingCode(e.target.value.toUpperCase())}
                        className="font-mono tracking-widest"
                      />
                      <Button
                        onClick={() => {
                          const parent = parentProfiles[0];
                          if (parent) linkChild(parent.id);
                        }}
                        disabled={!linkingCode.trim()}
                      >
                        Vincular
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Linked children */}
                {linkedChildren.length > 0 ? (
                  <div>
                    <h3 className="font-display font-bold text-foreground mb-3 flex items-center gap-2">
                      <Baby className="h-4 w-4 text-primary" />
                      Filhos vinculados
                    </h3>
                    <div className="space-y-2">
                      {linkedChildren.map((link) => {
                        const c = link.child;
                        const accuracy = c.total_exercises > 0 ? Math.round((c.total_correct / c.total_exercises) * 100) : 0;
                        return (
                          <Card key={link.id} className="border-primary/10 hover:border-primary/30 transition-all cursor-pointer"
                            onClick={() => setViewingChild(c)}>
                            <CardContent className="p-4 flex items-center gap-4">
                              <span className="text-3xl">{c.avatar_emoji}</span>
                              <div className="flex-1 min-w-0">
                                <p className="font-display font-bold text-foreground">{c.name}</p>
                                {c.school_year && (
                                  <p className="text-xs text-primary">{getYearLabel(c.school_year)}</p>
                                )}
                                <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                                  <span>⭐ {c.xp} XP</span>
                                  <span>🎯 {accuracy}%</span>
                                  <span>🔥 {c.streak_days}d</span>
                                </div>
                              </div>
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Nenhum filho vinculado ainda</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Use o código de convite para vincular</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <ShieldCheck className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                <h3 className="font-display font-bold text-foreground mb-2">Área dos pais</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Crie um perfil de "Pai/Mãe" para acompanhar o progresso dos seus filhos
                </p>
                <Button onClick={() => { setProfileType('parent'); setCreating(true); setActiveTab('meus'); }} className="gap-2">
                  <Plus className="h-4 w-4" /> Criar perfil de responsável
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="amigos">
            <FriendsTab />
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => { if (!open) setDeleteConfirmId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar perfil</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja apagar o perfil <strong>{deleteConfirmName}</strong>? Todos os dados, histórico de sessões e progresso serão perdidos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteConfirmId) deleteProfile(deleteConfirmId);
                setDeleteConfirmId(null);
              }}
            >
              Apagar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
