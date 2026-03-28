import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useProfileStore } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { Plus, LogOut, Trash2, Pencil } from 'lucide-react';
import { YEAR_OPTIONS, getYearLabel } from '@/constants/years';

const AVATARS = ['🧑‍🎓', '👧', '👦', '🦸', '🧙', '🦊', '🐱', '🦄', '🚀', '⭐'];

interface Profile {
  id: string;
  name: string;
  avatar_emoji: string;
  school_year: string | null;
  xp: number;
  level: number;
  streak_days: number;
}

export default function Profiles() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const setActiveProfile = useProfileStore((s) => s.setActiveProfile);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('🧑‍🎓');
  const [selectedYear, setSelectedYear] = useState('');
  const [loadingProfiles, setLoadingProfiles] = useState(true);

  useEffect(() => {
    if (!loading && !user) navigate('/login');
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) fetchProfiles();
  }, [user]);

  const fetchProfiles = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, name, avatar_emoji, school_year, xp, level, streak_days')
      .order('created_at');
    setProfiles((data as Profile[]) || []);
    setLoadingProfiles(false);
  };

  const createProfile = async () => {
    if (!newName.trim() || !user) return;
    await supabase.from('profiles').insert({
      user_id: user.id,
      name: newName.trim(),
      avatar_emoji: selectedAvatar,
      school_year: selectedYear || null,
    });
    resetForm();
    fetchProfiles();
  };

  const startEditing = (p: Profile) => {
    setEditing(p.id);
    setNewName(p.name);
    setSelectedAvatar(p.avatar_emoji);
    setSelectedYear(p.school_year || '');
  };

  const saveEdit = async () => {
    if (!editing || !newName.trim()) return;
    await supabase.from('profiles').update({
      name: newName.trim(),
      avatar_emoji: selectedAvatar,
      school_year: selectedYear || null,
    }).eq('id', editing);
    resetForm();
    fetchProfiles();
  };

  const resetForm = () => {
    setNewName('');
    setSelectedAvatar('🧑‍🎓');
    setSelectedYear('');
    setCreating(false);
    setEditing(null);
  };

  const deleteProfile = async (id: string) => {
    await supabase.from('profiles').delete().eq('id', id);
    fetchProfiles();
  };

  const selectProfile = (id: string) => {
    setActiveProfile(id);
    navigate('/');
  };

  const handleSignOut = async () => {
    setActiveProfile(null);
    await signOut();
    navigate('/login');
  };

  if (loading || loadingProfiles) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-6 pb-24 md:py-12">
      <div className="mx-auto max-w-md">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">👋 Quem vai estudar?</h1>
            <p className="text-sm text-muted-foreground">Escolha ou crie um perfil</p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleSignOut}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>

        <div className="space-y-3 mb-6">
          {profiles.map((p, idx) => (
            <Card
              key={p.id}
              className="cursor-pointer hover:border-primary/50 transition-all animate-fade-in"
              style={{ animationDelay: `${idx * 80}ms` }}
            >
              <CardContent className="p-4 flex items-center gap-4">
                <button onClick={() => selectProfile(p.id)} className="flex-1 flex items-center gap-4 text-left">
                  <span className="text-4xl">{p.avatar_emoji}</span>
                  <div className="flex-1">
                    <p className="font-display font-bold text-foreground">{p.name}</p>
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
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-primary h-8 w-8"
                    onClick={(e) => { e.stopPropagation(); startEditing(p); }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive h-8 w-8"
                    onClick={(e) => { e.stopPropagation(); deleteProfile(p.id); }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {(creating || editing) ? (
          <Card className="animate-scale-in">
            <CardContent className="p-5 space-y-4">
              <h2 className="font-display font-bold text-foreground">
                {editing ? 'Editar perfil' : 'Novo perfil'}
              </h2>
              <Input
                placeholder="Nome do estudante"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                autoFocus
              />
              <div>
                <p className="text-sm text-muted-foreground mb-2">Série:</p>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a série" />
                  </SelectTrigger>
                  <SelectContent>
                    {YEAR_OPTIONS.map((y) => (
                      <SelectItem key={y.value} value={y.value}>{y.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Escolha um avatar:</p>
                <div className="flex flex-wrap gap-2">
                  {AVATARS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => setSelectedAvatar(emoji)}
                      className={`text-3xl p-1.5 rounded-lg transition-all ${
                        selectedAvatar === emoji
                          ? 'bg-primary/15 ring-2 ring-primary scale-110'
                          : 'hover:bg-muted'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button className="flex-1 font-display font-bold" onClick={editing ? saveEdit : createProfile} disabled={!newName.trim()}>
                  {editing ? 'Salvar' : 'Criar'}
                </Button>
                <Button variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => setCreating(true)}
          >
            <Plus className="h-4 w-4" />
            Adicionar perfil
          </Button>
        )}
      </div>
    </div>
  );
}
