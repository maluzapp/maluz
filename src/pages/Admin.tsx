import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Palette, Type, Maximize, MessageCircle, FileText, Settings, Upload, Trash2, Share2, Users, Mail, Calendar, Shield, UserCheck, CreditCard, Crown, Star, Filter } from 'lucide-react';
import { useBrandingByCategory, useUpdateBranding, useIsAdmin } from '@/hooks/useBrandingSettings';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface FieldConfig {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'color' | 'slider' | 'select';
  category: string;
  min?: number;
  max?: number;
  options?: string[];
}

const GENERAL_FIELDS: FieldConfig[] = [
  { key: 'app_name', label: 'Nome do App', type: 'text', category: 'general' },
  { key: 'app_tagline', label: 'Tagline', type: 'text', category: 'general' },
  { key: 'app_slogan', label: 'Slogan', type: 'text', category: 'general' },
];

const COLOR_FIELDS: FieldConfig[] = [
  { key: 'color_navy', label: 'Navy (fundo)', type: 'color', category: 'colors' },
  { key: 'color_gold', label: 'Gold (primária)', type: 'color', category: 'colors' },
  { key: 'color_cream', label: 'Cream', type: 'color', category: 'colors' },
  { key: 'color_mint', label: 'Mint (accent)', type: 'color', category: 'colors' },
  { key: 'color_coral', label: 'Coral', type: 'color', category: 'colors' },
  { key: 'color_lilac', label: 'Lilac', type: 'color', category: 'colors' },
  { key: 'color_sky_blue', label: 'Sky Blue', type: 'color', category: 'colors' },
];

const TYPO_FIELDS: FieldConfig[] = [
  { key: 'font_display', label: 'Fonte Display', type: 'select', category: 'typography', options: ['Playfair Display', 'Merriweather', 'Lora', 'Libre Baskerville', 'Cormorant Garamond'] },
  { key: 'font_body', label: 'Fonte Body', type: 'select', category: 'typography', options: ['DM Sans', 'Inter', 'Nunito', 'Open Sans', 'Lato'] },
  { key: 'font_mono', label: 'Fonte Mono', type: 'select', category: 'typography', options: ['Space Mono', 'JetBrains Mono', 'Fira Code', 'Source Code Pro'] },
];

interface LogoFieldConfig {
  key: string;
  label: string;
  sizeKey: string;
  min: number;
  max: number;
}

const LOGO_FIELDS: LogoFieldConfig[] = [
  { key: 'logo_landing_hero', label: 'Logo Hero (Landing)', sizeKey: 'logo_height_landing_hero', min: 32, max: 256 },
  { key: 'logo_landing_footer', label: 'Logo Footer', sizeKey: 'logo_height_landing_footer', min: 24, max: 128 },
  { key: 'logo_login', label: 'Logo Login', sizeKey: 'logo_height_login', min: 64, max: 512 },
  { key: 'logo_nav', label: 'Logo Nav', sizeKey: 'logo_height_nav', min: 16, max: 64 },
  { key: 'logo_index', label: 'Logo Index', sizeKey: 'logo_height_index', min: 32, max: 128 },
  { key: 'symbol_landing_hero', label: 'Símbolo Hero (Landing)', sizeKey: 'symbol_height_landing_hero', min: 32, max: 256 },
  { key: 'symbol_index', label: 'Símbolo Index', sizeKey: 'symbol_height_index', min: 32, max: 128 },
  { key: 'symbol_login', label: 'Símbolo Login', sizeKey: 'symbol_height_login', min: 32, max: 256 },
  { key: 'icon_pwa', label: 'Ícone do App (PWA)', sizeKey: 'icon_pwa_size', min: 128, max: 512 },
];

const VOICE_FIELDS: FieldConfig[] = [
  { key: 'phrase_1', label: 'Frase de acerto 1', type: 'text', category: 'voice' },
  { key: 'phrase_2', label: 'Frase de acerto 2', type: 'text', category: 'voice' },
  { key: 'phrase_3', label: 'Frase de incentivo 1', type: 'text', category: 'voice' },
  { key: 'phrase_4', label: 'Frase de incentivo 2', type: 'text', category: 'voice' },
];

const SHARE_FIELDS: FieldConfig[] = [
  { key: 'share_header', label: 'Cabeçalho do compartilhamento', type: 'text', category: 'share' },
  { key: 'share_cta', label: 'CTA para amigos experimentarem', type: 'textarea', category: 'share' },
  { key: 'share_app_url', label: 'Link do app no compartilhamento', type: 'text', category: 'share' },
];

const LANDING_FIELDS: FieldConfig[] = [
  { key: 'hero_title', label: 'Título Hero', type: 'text', category: 'landing' },
  { key: 'hero_subtitle', label: 'Subtítulo Hero', type: 'text', category: 'landing' },
  { key: 'brand_story', label: 'Brand Story (citação)', type: 'textarea', category: 'landing' },
  { key: 'brand_story_detail', label: 'Brand Story (detalhe)', type: 'textarea', category: 'landing' },
  { key: 'mission_text', label: 'Missão', type: 'textarea', category: 'landing' },
  { key: 'vision_text', label: 'Visão', type: 'textarea', category: 'landing' },
  { key: 'essence_text', label: 'Essência', type: 'textarea', category: 'landing' },
  { key: 'cta_text', label: 'Texto CTA', type: 'textarea', category: 'landing' },
  { key: 'cta_button', label: 'Botão CTA', type: 'text', category: 'landing' },
  { key: 'footer_text', label: 'Texto Footer', type: 'text', category: 'landing' },
];

// --- Color conversion helpers ---

function isHex(val: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(val.trim());
}

function hslStringToHex(hsl: string): string {
  if (isHex(hsl)) return hsl.trim();
  const cleaned = hsl.replace(/%/g, '').trim();
  const parts = cleaned.split(/[\s,]+/).map(Number);
  if (parts.length < 3 || parts.some(isNaN)) return '#d4a843';
  const [h, s, l] = [parts[0], parts[1] / 100, parts[2] / 100];
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function hexToHsl(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) * 60; break;
      case g: h = ((b - r) / d + 2) * 60; break;
      case b: h = ((r - g) / d + 4) * 60; break;
    }
  }
  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function getDisplayColor(val: string): string {
  if (isHex(val)) return val.trim();
  return hslStringToHex(val);
}

// --- Logo upload helper ---
function getLogoUrl(key: string): string {
  const { data } = supabase.storage.from('logos').getPublicUrl(`${key}.png`);
  return data.publicUrl;
}

export default function Admin() {
  const navigate = useNavigate();
  const { data: allSettings, isLoading } = useBrandingByCategory();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const updateMutation = useUpdateBranding();
  const [localValues, setLocalValues] = useState<Record<string, string>>({});
  const [logoTimestamps, setLogoTimestamps] = useState<Record<string, number>>({});

  useEffect(() => {
    if (allSettings) {
      const flat: Record<string, string> = {};
      for (const cat of Object.values(allSettings)) {
        for (const item of Object.values(cat)) {
          flat[item.key] = item.value;
        }
      }
      setLocalValues(flat);
    }
  }, [allSettings]);

  if (adminLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground gap-4 px-6">
        <div className="text-6xl">🔒</div>
        <h1 className="font-display text-2xl font-bold text-primary">Acesso Restrito</h1>
        <p className="text-sm text-foreground/60 text-center">Você precisa de permissão de administrador para acessar este painel.</p>
        <Button variant="outline" onClick={() => navigate('/inicio')}>Voltar ao início</Button>
      </div>
    );
  }

  const getValue = (key: string) => localValues[key] ?? '';
  const setValue = (key: string, value: string) => setLocalValues(prev => ({ ...prev, [key]: value }));

  const saveCategory = (category: string, fields: { key: string; category: string }[]) => {
    const updates = fields.map(f => ({ key: f.key, value: getValue(f.key), category: f.category || category }));
    updateMutation.mutate(updates);
  };

  const handleLogoUpload = async (key: string, file: File) => {
    const path = `${key}.png`;
    const { error } = await supabase.storage.from('logos').upload(path, file, { upsert: true, contentType: file.type });
    if (error) {
      toast.error('Erro ao enviar: ' + error.message);
    } else {
      toast.success('Logo enviado!');
      setLogoTimestamps(prev => ({ ...prev, [key]: Date.now() }));
    }
  };

  const handleLogoDelete = async (key: string) => {
    const { error } = await supabase.storage.from('logos').remove([`${key}.png`]);
    if (error) {
      toast.error('Erro ao remover: ' + error.message);
    } else {
      toast.success('Logo removido!');
      setLogoTimestamps(prev => ({ ...prev, [key]: Date.now() }));
    }
  };

  const renderField = (field: FieldConfig) => {
    const val = getValue(field.key);
    switch (field.type) {
      case 'text':
        return (
          <div key={field.key} className="space-y-1.5">
            <Label className="text-xs text-foreground/70">{field.label}</Label>
            <Input value={val} onChange={e => setValue(field.key, e.target.value)} className="bg-card border-primary/20 text-foreground" />
          </div>
        );
      case 'textarea':
        return (
          <div key={field.key} className="space-y-1.5">
            <Label className="text-xs text-foreground/70">{field.label}</Label>
            <Textarea value={val} onChange={e => setValue(field.key, e.target.value)} rows={3} className="bg-card border-primary/20 text-foreground resize-y" />
          </div>
        );
      case 'color': {
        const hexVal = getDisplayColor(val);
        return (
          <div key={field.key} className="space-y-1.5">
            <Label className="text-xs text-foreground/70">{field.label}</Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={hexVal}
                onChange={e => {
                  // Store as HSL for consistency with CSS vars
                  setValue(field.key, hexToHsl(e.target.value));
                }}
                className="w-10 h-10 rounded-lg border border-primary/20 cursor-pointer bg-transparent"
              />
              <Input
                value={val}
                onChange={e => setValue(field.key, e.target.value)}
                className="bg-card border-primary/20 text-foreground font-mono text-xs flex-1"
              />
              <div
                className="w-10 h-10 rounded-lg border border-primary/20 shrink-0"
                style={{ backgroundColor: hexVal }}
              />
            </div>
          </div>
        );
      }
      case 'slider':
        return (
          <div key={field.key} className="space-y-1.5">
            <div className="flex justify-between items-center">
              <Label className="text-xs text-foreground/70">{field.label}</Label>
              <span className="font-mono text-xs text-primary">{val || field.min}px</span>
            </div>
            <Slider
              value={[parseInt(val) || field.min || 32]}
              onValueChange={v => setValue(field.key, String(v[0]))}
              min={field.min} max={field.max} step={4}
              className="py-2"
            />
          </div>
        );
      case 'select':
        return (
          <div key={field.key} className="space-y-1.5">
            <Label className="text-xs text-foreground/70">{field.label}</Label>
            <select
              value={val}
              onChange={e => setValue(field.key, e.target.value)}
              className="w-full h-10 rounded-md border border-primary/20 bg-card text-foreground px-3 text-sm"
            >
              {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            <p className="text-xs text-foreground/40 italic" style={{ fontFamily: val }}>{val}: Aa Bb Cc 123</p>
          </div>
        );
    }
  };

  const TabSection = ({ fields, icon, title }: { fields: FieldConfig[]; icon: React.ReactNode; title: string }) => (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <h2 className="font-display text-lg font-bold text-foreground">{title}</h2>
      </div>
      <div className="space-y-4">
        {fields.map(renderField)}
      </div>
      <Button
        onClick={() => saveCategory(fields[0]?.category || '', fields)}
        disabled={updateMutation.isPending}
        className="w-full bg-primary text-primary-foreground font-display font-bold hover:opacity-90"
      >
        <Save className="h-4 w-4 mr-2" />
        {updateMutation.isPending ? 'Salvando...' : 'Salvar alterações'}
      </Button>
    </div>
  );

  const LogoSizeSection = () => {
    const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-2">
          <Maximize className="h-5 w-5 text-primary" />
          <h2 className="font-display text-lg font-bold text-foreground">Logos & Símbolos</h2>
        </div>
        <div className="space-y-6">
          {LOGO_FIELDS.map(field => {
            const sizeVal = getValue(field.sizeKey);
            const size = parseInt(sizeVal) || field.min;
            const logoUrl = getLogoUrl(field.key);
            const ts = logoTimestamps[field.key] || 0;
            const imgSrc = `${logoUrl}?t=${ts}`;

            return (
              <div key={field.key} className="rounded-xl border border-primary/15 bg-card/50 p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="text-sm font-semibold text-foreground">{field.label}</Label>
                  <span className="font-mono text-xs text-primary">{size}px</span>
                </div>

                {/* Logo preview */}
                <div className="flex items-center justify-center p-4 rounded-lg border border-primary/10 bg-background min-h-[80px]">
                  <img
                    src={imgSrc}
                    alt={field.label}
                    style={{ height: `${Math.min(size, 120)}px` }}
                    className="object-contain max-w-full"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      const parent = (e.target as HTMLImageElement).parentElement;
                      if (parent && !parent.querySelector('.placeholder-text')) {
                        const span = document.createElement('span');
                        span.className = 'placeholder-text text-xs text-foreground/30 italic';
                        span.textContent = 'Nenhum logo enviado';
                        parent.appendChild(span);
                      }
                    }}
                  />
                </div>

                {/* Size slider */}
                <Slider
                  value={[size]}
                  onValueChange={v => setValue(field.sizeKey, String(v[0]))}
                  min={field.min} max={field.max} step={4}
                  className="py-2"
                />

                {/* Upload / Delete actions */}
                <div className="flex gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={el => { fileInputRefs.current[field.key] = el; }}
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) handleLogoUpload(field.key, file);
                      e.target.value = '';
                    }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-1.5 text-xs"
                    onClick={() => fileInputRefs.current[field.key]?.click()}
                  >
                    <Upload className="h-3.5 w-3.5" />
                    Enviar logo
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs text-destructive hover:text-destructive"
                    onClick={() => handleLogoDelete(field.key)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
        <Button
          onClick={() => {
            const sizeUpdates = LOGO_FIELDS.map(f => ({ key: f.sizeKey, value: getValue(f.sizeKey), category: 'sizes' }));
            updateMutation.mutate(sizeUpdates);
          }}
          disabled={updateMutation.isPending}
          className="w-full bg-primary text-primary-foreground font-display font-bold hover:opacity-90"
        >
          <Save className="h-4 w-4 mr-2" />
          {updateMutation.isPending ? 'Salvando...' : 'Salvar tamanhos'}
        </Button>
      </div>
    );
  };

  const UsersSection = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
      const fetchUsers = async () => {
        setLoadingUsers(true);
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const res = await supabase.functions.invoke('admin-users', {
            headers: { Authorization: `Bearer ${session?.access_token}` },
          });
          if (res.data?.users) setUsers(res.data.users);
        } catch (err) {
          toast.error('Erro ao carregar usuários');
        } finally {
          setLoadingUsers(false);
        }
      };
      fetchUsers();
    }, []);

    const filtered = users.filter(u =>
      (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.profiles?.some((p: any) => p.name?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const formatDate = (d: string | null) => {
      if (!d) return '—';
      return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-2">
          <Users className="h-5 w-5 text-primary" />
          <h2 className="font-display text-lg font-bold text-foreground">Usuários Cadastrados</h2>
          <Badge variant="secondary" className="ml-auto font-mono text-xs">{users.length} total</Badge>
        </div>

        <Input
          placeholder="Buscar por email ou nome..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="bg-card border-primary/20 text-foreground"
        />

        {loadingUsers ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-foreground/50 text-sm">Nenhum usuário encontrado</div>
        ) : (
          <div className="space-y-3">
            {filtered.map(user => (
              <div key={user.id} className="rounded-xl border border-primary/15 bg-card/50 p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Mail className="h-3.5 w-3.5 text-primary/60 shrink-0" />
                      <span className="text-sm font-medium text-foreground truncate">{user.email || 'Sem email'}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-foreground/50">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Cadastro: {formatDate(user.created_at)}
                      </span>
                      <span className="flex items-center gap-1">
                        <UserCheck className="h-3 w-3" />
                        Último login: {formatDate(user.last_sign_in_at)}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {user.roles?.includes('admin') && (
                      <Badge className="bg-primary/20 text-primary text-[10px] font-mono">
                        <Shield className="h-2.5 w-2.5 mr-0.5" /> Admin
                      </Badge>
                    )}
                    {user.email_confirmed_at ? (
                      <Badge variant="secondary" className="text-[10px]">✓ Verificado</Badge>
                    ) : (
                      <Badge variant="destructive" className="text-[10px]">Pendente</Badge>
                    )}
                  </div>
                </div>
                {user.profiles?.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1 border-t border-primary/10">
                    {user.profiles.map((p: any) => (
                      <div key={p.id} className="flex items-center gap-1.5 bg-background/50 rounded-lg px-2.5 py-1 text-xs">
                        <span>{p.avatar_emoji}</span>
                        <span className="text-foreground/80">{p.name}</span>
                        <Badge variant="outline" className="text-[9px] px-1 py-0">
                          {p.profile_type === 'parent' ? '👨‍👩‍👧 Responsável' : '📚 Estudante'}
                        </Badge>
                        {p.school_year && <span className="text-foreground/40">{p.school_year}</span>}
                        <span className="text-primary/60 font-mono">Lv.{p.level} · {p.xp}xp</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b border-primary/15 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-primary/10 transition-colors">
            <ArrowLeft className="h-5 w-5 text-primary" />
          </button>
          <div>
            <h1 className="font-display text-lg font-bold text-foreground">Painel Admin</h1>
            <p className="font-mono text-[0.6rem] tracking-[0.15em] uppercase text-primary/70">Customização Maluz</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="w-full grid grid-cols-4 md:grid-cols-8 h-auto gap-1 bg-card border border-primary/15 p-1 rounded-xl">
            <TabsTrigger value="general" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg py-2">
              <Settings className="h-3.5 w-3.5 mr-1" /> Geral
            </TabsTrigger>
            <TabsTrigger value="colors" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg py-2">
              <Palette className="h-3.5 w-3.5 mr-1" /> Cores
            </TabsTrigger>
            <TabsTrigger value="typography" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg py-2">
              <Type className="h-3.5 w-3.5 mr-1" /> Fontes
            </TabsTrigger>
            <TabsTrigger value="sizes" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg py-2">
              <Maximize className="h-3.5 w-3.5 mr-1" /> Logos
            </TabsTrigger>
            <TabsTrigger value="voice" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg py-2">
              <MessageCircle className="h-3.5 w-3.5 mr-1" /> Voz
            </TabsTrigger>
            <TabsTrigger value="landing" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg py-2">
              <FileText className="h-3.5 w-3.5 mr-1" /> Landing
            </TabsTrigger>
            <TabsTrigger value="share" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg py-2">
              <Share2 className="h-3.5 w-3.5 mr-1" /> Compartilhar
            </TabsTrigger>
            <TabsTrigger value="users" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg py-2">
              <Users className="h-3.5 w-3.5 mr-1" /> Usuários
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="general">
              <TabSection fields={GENERAL_FIELDS} icon={<Settings className="h-5 w-5 text-primary" />} title="Configurações Gerais" />
            </TabsContent>
            <TabsContent value="colors">
              <TabSection fields={COLOR_FIELDS} icon={<Palette className="h-5 w-5 text-primary" />} title="Paleta de Cores" />
            </TabsContent>
            <TabsContent value="typography">
              <TabSection fields={TYPO_FIELDS} icon={<Type className="h-5 w-5 text-primary" />} title="Tipografia" />
            </TabsContent>
            <TabsContent value="sizes">
              <LogoSizeSection />
            </TabsContent>
            <TabsContent value="voice">
              <TabSection fields={VOICE_FIELDS} icon={<MessageCircle className="h-5 w-5 text-primary" />} title="Tom de Voz" />
            </TabsContent>
            <TabsContent value="landing">
              <TabSection fields={LANDING_FIELDS} icon={<FileText className="h-5 w-5 text-primary" />} title="Textos da Landing Page" />
            </TabsContent>
            <TabsContent value="share">
              <TabSection fields={SHARE_FIELDS} icon={<Share2 className="h-5 w-5 text-primary" />} title="Mensagem de Compartilhamento (WhatsApp)" />
            </TabsContent>
            <TabsContent value="users">
              <UsersSection />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
