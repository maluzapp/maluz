import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ArrowLeft, Save, Palette, Type, Maximize, MessageCircle, FileText, Settings, Upload, Trash2,
  Share2, Users, Mail, Calendar, Shield, UserCheck, CreditCard, Crown, Star, Filter, X, Plus,
  ChevronRight, Zap, LayoutDashboard, Menu
} from 'lucide-react';
import { useBrandingByCategory, useUpdateBranding, useIsAdmin } from '@/hooks/useBrandingSettings';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ─── Field configs ──────────────────────────────────────────
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

const EMAIL_FIELDS: FieldConfig[] = [
  { key: 'email_sender_name', label: 'Nome do remetente', type: 'text', category: 'email' },
  { key: 'email_sender_address', label: 'Email remetente', type: 'text', category: 'email' },
  { key: 'email_footer_text', label: 'Texto do rodapé', type: 'text', category: 'email' },
  { key: 'email_primary_color', label: 'Cor principal (botões)', type: 'color', category: 'email' },
  { key: 'email_text_color', label: 'Cor do texto', type: 'color', category: 'email' },
  { key: 'email_welcome_subject', label: 'Assunto — Boas-vindas', type: 'text', category: 'email' },
  { key: 'email_payment_subject', label: 'Assunto — Confirmação pagamento', type: 'text', category: 'email' },
  { key: 'email_cancel_subject', label: 'Assunto — Cancelamento', type: 'text', category: 'email' },
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

// ─── Sidebar nav items ─────────────────────────────────────
const NAV_ITEMS = [
  { id: 'general', label: 'Geral', icon: Settings },
  { id: 'colors', label: 'Cores', icon: Palette },
  { id: 'typography', label: 'Fontes', icon: Type },
  { id: 'logos', label: 'Logos', icon: Maximize },
  { id: 'voice', label: 'Voz', icon: MessageCircle },
  { id: 'landing', label: 'Landing', icon: FileText },
  { id: 'share', label: 'Compartilhar', icon: Share2 },
  { id: 'email', label: 'Emails', icon: Mail },
  { id: 'users', label: 'Usuários', icon: Users },
  { id: 'plans', label: 'Planos', icon: CreditCard },
];

// ─── Color helpers ──────────────────────────────────────────
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

function getLogoUrl(key: string): string {
  const { data } = supabase.storage.from('logos').getPublicUrl(`${key}.png`);
  return data.publicUrl;
}

// ─── Features Tag Editor ────────────────────────────────────
function FeaturesTagEditor({ features, onChange }: { features: string[]; onChange: (f: string[]) => void }) {
  const [newTag, setNewTag] = useState('');
  const addTag = () => {
    const trimmed = newTag.trim();
    if (trimmed && !features.includes(trimmed)) {
      onChange([...features, trimmed]);
      setNewTag('');
    }
  };
  return (
    <div className="space-y-2">
      <Label className="text-xs text-foreground/70">Features do plano</Label>
      <div className="flex flex-wrap gap-1.5">
        {features.map((feat, i) => (
          <Badge key={i} variant="secondary" className="text-xs gap-1 pr-1">
            {feat}
            <button onClick={() => onChange(features.filter((_, j) => j !== i))} className="hover:text-destructive ml-0.5">
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={newTag}
          onChange={e => setNewTag(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
          placeholder="Nova feature..."
          className="bg-card border-primary/20 text-foreground text-sm flex-1"
        />
        <Button variant="outline" size="sm" onClick={addTag} className="shrink-0">
          <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar
        </Button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN ADMIN COMPONENT
// ═══════════════════════════════════════════════════════════
export default function Admin() {
  const navigate = useNavigate();
  const { data: allSettings, isLoading } = useBrandingByCategory();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const updateMutation = useUpdateBranding();
  const [localValues, setLocalValues] = useState<Record<string, string>>({});
  const [logoTimestamps, setLogoTimestamps] = useState<Record<string, number>>({});
  const [activeSection, setActiveSection] = useState('general');
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    if (error) { toast.error('Erro ao enviar: ' + error.message); } else {
      toast.success('Logo enviado!');
      setLogoTimestamps(prev => ({ ...prev, [key]: Date.now() }));
    }
  };

  const handleLogoDelete = async (key: string) => {
    const { error } = await supabase.storage.from('logos').remove([`${key}.png`]);
    if (error) { toast.error('Erro ao remover: ' + error.message); } else {
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
              <input type="color" value={hexVal} onChange={e => setValue(field.key, hexToHsl(e.target.value))} className="w-10 h-10 rounded-lg border border-primary/20 cursor-pointer bg-transparent" />
              <Input value={val} onChange={e => setValue(field.key, e.target.value)} className="bg-card border-primary/20 text-foreground font-mono text-xs flex-1" />
              <div className="w-10 h-10 rounded-lg border border-primary/20 shrink-0" style={{ backgroundColor: hexVal }} />
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
            <Slider value={[parseInt(val) || field.min || 32]} onValueChange={v => setValue(field.key, String(v[0]))} min={field.min} max={field.max} step={4} className="py-2" />
          </div>
        );
      case 'select':
        return (
          <div key={field.key} className="space-y-1.5">
            <Label className="text-xs text-foreground/70">{field.label}</Label>
            <select value={val} onChange={e => setValue(field.key, e.target.value)} className="w-full h-10 rounded-md border border-primary/20 bg-card text-foreground px-3 text-sm">
              {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            <p className="text-xs text-foreground/40 italic" style={{ fontFamily: val }}>{val}: Aa Bb Cc 123</p>
          </div>
        );
    }
  };

  const SectionPanel = ({ fields, icon, title }: { fields: FieldConfig[]; icon: React.ReactNode; title: string }) => (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <h2 className="font-display text-xl font-bold text-foreground">{title}</h2>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {fields.map(renderField)}
      </div>
      <Button onClick={() => saveCategory(fields[0]?.category || '', fields)} disabled={updateMutation.isPending} className="bg-primary text-primary-foreground font-display font-bold hover:opacity-90">
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
          <h2 className="font-display text-xl font-bold text-foreground">Logos & Símbolos</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
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
                <div className="flex items-center justify-center p-4 rounded-lg border border-primary/10 bg-background min-h-[80px]">
                  <img src={imgSrc} alt={field.label} style={{ height: `${Math.min(size, 120)}px` }} className="object-contain max-w-full" onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    const parent = (e.target as HTMLImageElement).parentElement;
                    if (parent && !parent.querySelector('.placeholder-text')) {
                      const span = document.createElement('span');
                      span.className = 'placeholder-text text-xs text-foreground/30 italic';
                      span.textContent = 'Nenhum logo enviado';
                      parent.appendChild(span);
                    }
                  }} />
                </div>
                <Slider value={[size]} onValueChange={v => setValue(field.sizeKey, String(v[0]))} min={field.min} max={field.max} step={4} className="py-2" />
                <div className="flex gap-2">
                  <input type="file" accept="image/*" className="hidden" ref={el => { fileInputRefs.current[field.key] = el; }} onChange={e => { const file = e.target.files?.[0]; if (file) handleLogoUpload(field.key, file); e.target.value = ''; }} />
                  <Button variant="outline" size="sm" className="flex-1 gap-1.5 text-xs" onClick={() => fileInputRefs.current[field.key]?.click()}>
                    <Upload className="h-3.5 w-3.5" /> Enviar logo
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs text-destructive hover:text-destructive" onClick={() => handleLogoDelete(field.key)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
        <Button onClick={() => { const sizeUpdates = LOGO_FIELDS.map(f => ({ key: f.sizeKey, value: getValue(f.sizeKey), category: 'sizes' })); updateMutation.mutate(sizeUpdates); }} disabled={updateMutation.isPending} className="bg-primary text-primary-foreground font-display font-bold hover:opacity-90">
          <Save className="h-4 w-4 mr-2" />
          {updateMutation.isPending ? 'Salvando...' : 'Salvar tamanhos'}
        </Button>
      </div>
    );
  };

  // ─── USERS SECTION ──────────────────────────────────────────
  const UsersSection = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [planFilter, setPlanFilter] = useState<string>('all');
    const [changingPlan, setChangingPlan] = useState<string | null>(null);

    const fetchUsers = async () => {
      setLoadingUsers(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await supabase.functions.invoke('admin-users', {
          headers: { Authorization: `Bearer ${session?.access_token}` },
        });
        if (res.data?.users) setUsers(res.data.users);
      } catch {
        toast.error('Erro ao carregar usuários');
      } finally {
        setLoadingUsers(false);
      }
    };

    useEffect(() => { fetchUsers(); }, []);

    const handleChangePlan = async (userId: string, planSlug: string) => {
      setChangingPlan(userId);
      try {
        // Get plans
        const { data: plans } = await supabase.from('subscription_plans').select('*').eq('slug', planSlug).single();
        if (!plans) { toast.error('Plano não encontrado'); return; }

        if (planSlug === 'free') {
          // Remove active subscription
          await supabase.from('user_subscriptions').update({ status: 'cancelled', cancelled_at: new Date().toISOString() }).eq('user_id', userId).eq('status', 'active');
        } else {
          // Cancel any existing active sub
          await supabase.from('user_subscriptions').update({ status: 'cancelled', cancelled_at: new Date().toISOString() }).eq('user_id', userId).eq('status', 'active');
          // Insert new subscription
          await supabase.from('user_subscriptions').insert({
            user_id: userId,
            plan_id: plans.id,
            status: 'active',
            billing_period: 'monthly',
            store_provider: 'admin_manual',
          });
        }
        toast.success(`Plano alterado para ${planSlug === 'free' ? 'Free' : plans.name}`);
        await fetchUsers();
      } catch (err: any) {
        toast.error('Erro ao alterar plano: ' + err.message);
      } finally {
        setChangingPlan(null);
      }
    };

    const filtered = users.filter(u => {
      const matchesSearch = (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.profiles?.some((p: any) => p.name?.toLowerCase().includes(searchTerm.toLowerCase()));
      if (planFilter === 'all') return matchesSearch;
      if (planFilter === 'free') return matchesSearch && !u.subscription;
      return matchesSearch && u.subscription?.plan_slug === planFilter;
    });

    const formatDate = (d: string | null) => {
      if (!d) return '—';
      return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const getPlanBadge = (sub: any) => {
      if (!sub) return <Badge variant="outline" className="text-[10px] font-mono border-foreground/20">Free</Badge>;
      const colors: Record<string, string> = {
        pro: 'bg-primary/20 text-primary',
        familia: 'bg-accent/20 text-accent-foreground',
      };
      const icons: Record<string, any> = { pro: Star, familia: Crown };
      const Icon = icons[sub.plan_slug] || Star;
      return (
        <Badge className={`${colors[sub.plan_slug] || 'bg-primary/20 text-primary'} text-[10px] font-mono`}>
          <Icon className="h-2.5 w-2.5 mr-0.5" /> {sub.plan_name}
        </Badge>
      );
    };

    const totalPro = users.filter(u => u.subscription?.plan_slug === 'pro').length;
    const totalFamilia = users.filter(u => u.subscription?.plan_slug === 'familia').length;
    const totalFree = users.filter(u => !u.subscription).length;

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-2">
          <Users className="h-5 w-5 text-primary" />
          <h2 className="font-display text-xl font-bold text-foreground">Usuários Cadastrados</h2>
          <Badge variant="secondary" className="ml-auto font-mono text-xs">{users.length} total</Badge>
        </div>

        {/* Counters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-xl border border-primary/15 bg-card/50 p-4 text-center">
            <div className="text-2xl font-bold text-foreground">{users.length}</div>
            <div className="text-[10px] text-foreground/50 uppercase tracking-wider">Total</div>
          </div>
          <div className="rounded-xl border border-primary/15 bg-card/50 p-4 text-center">
            <div className="text-2xl font-bold text-foreground/60">{totalFree}</div>
            <div className="text-[10px] text-foreground/50 uppercase tracking-wider">Free</div>
          </div>
          <div className="rounded-xl border border-primary/15 bg-card/50 p-4 text-center">
            <div className="text-2xl font-bold text-primary">{totalPro}</div>
            <div className="text-[10px] text-foreground/50 uppercase tracking-wider">Pro</div>
          </div>
          <div className="rounded-xl border border-primary/15 bg-card/50 p-4 text-center">
            <div className="text-2xl font-bold text-accent-foreground">{totalFamilia}</div>
            <div className="text-[10px] text-foreground/50 uppercase tracking-wider">Família</div>
          </div>
        </div>

        {/* Search + Filter */}
        <div className="flex gap-2">
          <Input placeholder="Buscar por email ou nome..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="bg-card border-primary/20 text-foreground flex-1" />
          <Select value={planFilter} onValueChange={setPlanFilter}>
            <SelectTrigger className="w-[140px] bg-card border-primary/20">
              <Filter className="h-3.5 w-3.5 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="free">Free</SelectItem>
              <SelectItem value="pro">Pro</SelectItem>
              <SelectItem value="familia">Família</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loadingUsers ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-foreground/50 text-sm">Nenhum usuário encontrado</div>
        ) : (
          <div className="space-y-3">
            {filtered.map(user => (
              <div key={user.id} className="rounded-xl border border-primary/15 bg-card/50 p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Mail className="h-3.5 w-3.5 text-primary/60 shrink-0" />
                      <span className="text-sm font-medium text-foreground truncate">{user.email || 'Sem email'}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-foreground/50">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Cadastro: {formatDate(user.created_at)}
                      </span>
                      <span className="flex items-center gap-1">
                        <UserCheck className="h-3 w-3" /> Último login: {formatDate(user.last_sign_in_at)}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0 flex-wrap">
                    {getPlanBadge(user.subscription)}
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

                {/* Subscription details */}
                {user.subscription && (
                  <div className="flex items-center gap-3 text-xs text-foreground/50 bg-background/30 rounded-lg px-3 py-1.5">
                    <CreditCard className="h-3 w-3 text-primary/60" />
                    <span>Período: <strong className="text-foreground/70">{user.subscription.billing_period === 'yearly' ? 'Anual' : user.subscription.billing_period === 'quarterly' ? 'Trimestral' : 'Mensal'}</strong></span>
                    {user.subscription.expires_at && (
                      <span>Expira: <strong className="text-foreground/70">{formatDate(user.subscription.expires_at)}</strong></span>
                    )}
                    <Badge variant={user.subscription.status === 'active' ? 'secondary' : 'destructive'} className="text-[9px]">
                      {user.subscription.status === 'active' ? '✓ Ativo' : user.subscription.status}
                    </Badge>
                  </div>
                )}

                {/* Profiles */}
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

                {/* Plan change */}
                <div className="flex items-center gap-2 pt-2 border-t border-primary/10">
                  <span className="text-xs text-foreground/50">Alterar plano:</span>
                  <div className="flex gap-1.5">
                    {['free', 'pro', 'familia'].map(slug => {
                      const currentSlug = user.subscription?.plan_slug || 'free';
                      const isCurrent = currentSlug === slug;
                      return (
                        <Button
                          key={slug}
                          size="sm"
                          variant={isCurrent ? 'default' : 'outline'}
                          disabled={isCurrent || changingPlan === user.id}
                          className={cn('text-[10px] h-7 px-2.5', isCurrent && 'pointer-events-none')}
                          onClick={() => handleChangePlan(user.id, slug)}
                        >
                          {slug === 'pro' && <Star className="h-2.5 w-2.5 mr-0.5" />}
                          {slug === 'familia' && <Crown className="h-2.5 w-2.5 mr-0.5" />}
                          {slug === 'free' && <Zap className="h-2.5 w-2.5 mr-0.5" />}
                          {slug === 'free' ? 'Free' : slug === 'pro' ? 'Pro' : 'Família'}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ─── PLANS SECTION ──────────────────────────────────────────
  const PlansSection = () => {
    const [plans, setPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editValues, setEditValues] = useState<Record<string, any>>({});

    useEffect(() => {
      const fetchPlans = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('subscription_plans').select('*').order('sort_order');
        if (error) { toast.error('Erro ao carregar planos'); } else {
          setPlans(data || []);
          const vals: Record<string, any> = {};
          (data || []).forEach(p => {
            vals[p.id] = {
              ...p,
              features: Array.isArray(p.features) ? p.features : [],
            };
          });
          setEditValues(vals);
        }
        setLoading(false);
      };
      fetchPlans();
    }, []);

    const updatePlan = async (planId: string) => {
      const vals = editValues[planId];
      if (!vals) return;
      const { error } = await supabase.from('subscription_plans').update({
        name: vals.name,
        price_monthly: parseFloat(vals.price_monthly) || 0,
        price_yearly: vals.price_yearly ? parseFloat(vals.price_yearly) : null,
        price_weekly: vals.price_weekly ? parseFloat(vals.price_weekly) : null,
        daily_session_limit: parseInt(vals.daily_session_limit) || 3,
        max_profiles: parseInt(vals.max_profiles) || 1,
        features: vals.features,
        store_product_id_google: vals.store_product_id_google || null,
        store_product_id_apple: vals.store_product_id_apple || null,
        is_active: vals.is_active,
      }).eq('id', planId);
      if (error) { toast.error('Erro ao salvar: ' + error.message); return; }

      // Sync to Stripe if it's a paid plan
      const priceMonthly = parseFloat(vals.price_monthly) || 0;
      if (priceMonthly > 0) {
        try {
          const { data: stripeResult, error: stripeError } = await supabase.functions.invoke('sync-plan-to-stripe', {
            body: {
              plan_slug: vals.slug,
              name: vals.name,
              price_monthly: priceMonthly,
              price_yearly: vals.price_yearly ? parseFloat(vals.price_yearly) : null,
            },
          });
          if (stripeError) {
            toast.error('Plano salvo, mas erro ao sincronizar com Stripe: ' + stripeError.message);
          } else if (stripeResult?.monthly_price_id) {
            // Update stripe_price_id in DB
            await supabase.from('subscription_plans').update({
              stripe_price_id: stripeResult.monthly_price_id,
            }).eq('id', planId);
            toast.success('Plano atualizado e sincronizado com Stripe!');
          } else {
            toast.success('Plano atualizado e sincronizado com Stripe!');
          }
        } catch (err: any) {
          toast.error('Plano salvo, mas erro Stripe: ' + (err.message || 'desconhecido'));
        }
      } else {
        toast.success('Plano atualizado!');
      }
    };

    const setVal = (planId: string, key: string, value: any) => {
      setEditValues(prev => ({ ...prev, [planId]: { ...prev[planId], [key]: value } }));
    };

    if (loading) {
      return <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-2">
          <CreditCard className="h-5 w-5 text-primary" />
          <h2 className="font-display text-xl font-bold text-foreground">Gestão de Planos</h2>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          {plans.map(plan => {
            const vals = editValues[plan.id] || { ...plan, features: [] };
            const featuresArr = Array.isArray(vals.features) ? vals.features as string[] : [];
            return (
              <div key={plan.id} className="rounded-xl border border-primary/15 bg-card/50 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {plan.slug === 'pro' ? <Star className="h-5 w-5 text-primary" /> : plan.slug === 'familia' ? <Crown className="h-5 w-5 text-primary" /> : <Zap className="h-5 w-5 text-foreground/40" />}
                    <h3 className="font-display font-bold text-foreground">{plan.name}</h3>
                    <Badge variant={vals.is_active ? 'secondary' : 'destructive'} className="text-[10px]">
                      {vals.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                  <label className="flex items-center gap-2 text-xs text-foreground/60">
                    Ativo
                    <input type="checkbox" checked={vals.is_active} onChange={e => setVal(plan.id, 'is_active', e.target.checked)} className="accent-primary" />
                  </label>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-foreground/70">Nome</Label>
                    <Input value={vals.name} onChange={e => setVal(plan.id, 'name', e.target.value)} className="bg-card border-primary/20 text-foreground text-sm" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-foreground/70">Slug</Label>
                    <Input value={vals.slug} disabled className="bg-card border-primary/10 text-foreground/40 text-sm" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs text-foreground/70">Mensal (R$)</Label>
                    <Input type="number" step="0.01" value={vals.price_monthly} onChange={e => setVal(plan.id, 'price_monthly', e.target.value)} className="bg-card border-primary/20 text-foreground text-sm font-mono" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-foreground/70">Anual (R$)</Label>
                    <Input type="number" step="0.01" value={vals.price_yearly ?? ''} onChange={e => setVal(plan.id, 'price_yearly', e.target.value)} className="bg-card border-primary/20 text-foreground text-sm font-mono" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-foreground/70">Semanal (R$)</Label>
                    <Input type="number" step="0.01" value={vals.price_weekly ?? ''} onChange={e => setVal(plan.id, 'price_weekly', e.target.value)} className="bg-card border-primary/20 text-foreground text-sm font-mono" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs text-foreground/70">Sessões/dia (-1 = ∞)</Label>
                    <Input type="number" value={vals.daily_session_limit} onChange={e => setVal(plan.id, 'daily_session_limit', e.target.value)} className="bg-card border-primary/20 text-foreground text-sm font-mono" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-foreground/70">Max Perfis</Label>
                    <Input type="number" value={vals.max_profiles} onChange={e => setVal(plan.id, 'max_profiles', e.target.value)} className="bg-card border-primary/20 text-foreground text-sm font-mono" />
                  </div>
                </div>

                {/* Friendly features editor */}
                <FeaturesTagEditor
                  features={featuresArr}
                  onChange={(f) => setVal(plan.id, 'features', f)}
                />

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs text-foreground/70">ID Google Play</Label>
                    <Input value={vals.store_product_id_google ?? ''} onChange={e => setVal(plan.id, 'store_product_id_google', e.target.value)} placeholder="com.maluz.pro.monthly" className="bg-card border-primary/20 text-foreground text-xs font-mono" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-foreground/70">ID Apple Store</Label>
                    <Input value={vals.store_product_id_apple ?? ''} onChange={e => setVal(plan.id, 'store_product_id_apple', e.target.value)} placeholder="com.maluz.pro.monthly" className="bg-card border-primary/20 text-foreground text-xs font-mono" />
                  </div>
                </div>

                <Button onClick={() => updatePlan(plan.id)} className="w-full bg-primary text-primary-foreground font-display font-bold hover:opacity-90">
                  <Save className="h-4 w-4 mr-2" /> Salvar {plan.name}
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════
  // RENDER — Sidebar + Content
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-background text-foreground flex relative">
      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center gap-3 px-4 py-3 bg-background/95 backdrop-blur-xl border-b border-primary/15">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 rounded-lg hover:bg-primary/10">
          <Menu className="h-5 w-5 text-primary" />
        </button>
        <div className="flex items-center gap-2">
          <LayoutDashboard className="h-4 w-4 text-primary" />
          <h1 className="font-display text-sm font-bold text-foreground">Painel Admin</h1>
        </div>
      </div>

      {/* Sidebar overlay on mobile */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'w-56 xl:w-64 shrink-0 border-r border-primary/15 bg-card flex flex-col h-screen',
        'fixed md:sticky top-0 z-50 md:z-auto transition-transform duration-200',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      )}>
        <div className="p-4 border-b border-primary/15">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity mb-3">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-xs font-mono">Voltar</span>
          </button>
          <div className="flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5 text-primary" />
            <div>
              <h1 className="font-display text-sm font-bold text-foreground">Painel Admin</h1>
              <p className="font-mono text-[0.55rem] tracking-[0.15em] uppercase text-primary/70">Maluz</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 py-2 overflow-y-auto">
          {NAV_ITEMS.map(item => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setActiveSection(item.id); setSidebarOpen(false); }}
                className={cn(
                  'w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-all',
                  isActive
                    ? 'bg-primary/10 text-primary border-r-2 border-primary font-semibold'
                    : 'text-foreground/60 hover:text-foreground hover:bg-primary/5'
                )}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
                {isActive && <ChevronRight className="h-3.5 w-3.5 ml-auto" />}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Content area */}
      <main className="flex-1 min-h-screen overflow-y-auto pt-14 md:pt-0 md:ml-0">
        <div className="p-4 md:p-6 lg:p-8 xl:p-10 max-w-6xl">
          {activeSection === 'general' && <SectionPanel fields={GENERAL_FIELDS} icon={<Settings className="h-5 w-5 text-primary" />} title="Configurações Gerais" />}
          {activeSection === 'colors' && <SectionPanel fields={COLOR_FIELDS} icon={<Palette className="h-5 w-5 text-primary" />} title="Paleta de Cores" />}
          {activeSection === 'typography' && <SectionPanel fields={TYPO_FIELDS} icon={<Type className="h-5 w-5 text-primary" />} title="Tipografia" />}
          {activeSection === 'logos' && <LogoSizeSection />}
          {activeSection === 'voice' && <SectionPanel fields={VOICE_FIELDS} icon={<MessageCircle className="h-5 w-5 text-primary" />} title="Tom de Voz" />}
          {activeSection === 'landing' && <SectionPanel fields={LANDING_FIELDS} icon={<FileText className="h-5 w-5 text-primary" />} title="Textos da Landing Page" />}
          {activeSection === 'share' && <SectionPanel fields={SHARE_FIELDS} icon={<Share2 className="h-5 w-5 text-primary" />} title="Mensagem de Compartilhamento" />}
          {activeSection === 'email' && <SectionPanel fields={EMAIL_FIELDS} icon={<Mail className="h-5 w-5 text-primary" />} title="Configuração de Emails" />}
          {activeSection === 'users' && <UsersSection />}
          {activeSection === 'plans' && <PlansSection />}
        </div>
      </main>
    </div>
  );
}
