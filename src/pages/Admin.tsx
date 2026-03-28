import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { ArrowLeft, Save, Palette, Type, Maximize, MessageCircle, FileText, Settings } from 'lucide-react';
import { useBrandingByCategory, useUpdateBranding, useIsAdmin } from '@/hooks/useBrandingSettings';
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

const SIZE_FIELDS: FieldConfig[] = [
  { key: 'logo_height_landing_hero', label: 'Logo Hero (Landing)', type: 'slider', category: 'sizes', min: 32, max: 256 },
  { key: 'logo_height_landing_footer', label: 'Logo Footer', type: 'slider', category: 'sizes', min: 24, max: 128 },
  { key: 'logo_height_login', label: 'Logo Login', type: 'slider', category: 'sizes', min: 64, max: 512 },
  { key: 'logo_height_nav', label: 'Logo Nav', type: 'slider', category: 'sizes', min: 16, max: 64 },
  { key: 'logo_height_index', label: 'Logo Index', type: 'slider', category: 'sizes', min: 32, max: 128 },
  { key: 'symbol_height_landing_hero', label: 'Símbolo Hero (Landing)', type: 'slider', category: 'sizes', min: 32, max: 256 },
  { key: 'symbol_height_index', label: 'Símbolo Index', type: 'slider', category: 'sizes', min: 32, max: 128 },
  { key: 'symbol_height_login', label: 'Símbolo Login', type: 'slider', category: 'sizes', min: 32, max: 256 },
];

const VOICE_FIELDS: FieldConfig[] = [
  { key: 'phrase_1', label: 'Frase de acerto 1', type: 'text', category: 'voice' },
  { key: 'phrase_2', label: 'Frase de acerto 2', type: 'text', category: 'voice' },
  { key: 'phrase_3', label: 'Frase de incentivo 1', type: 'text', category: 'voice' },
  { key: 'phrase_4', label: 'Frase de incentivo 2', type: 'text', category: 'voice' },
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

function hslStringToHex(hsl: string): string {
  const parts = hsl.split(/\s+/).map(Number);
  if (parts.length < 3) return '#d4a843';
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

export default function Admin() {
  const navigate = useNavigate();
  const { data: allSettings, isLoading } = useBrandingByCategory();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const updateMutation = useUpdateBranding();
  const [localValues, setLocalValues] = useState<Record<string, string>>({});

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
        <Button variant="outline" onClick={() => navigate('/')}>Voltar ao início</Button>
      </div>
    );
  }

  const getValue = (key: string) => localValues[key] ?? '';
  const setValue = (key: string, value: string) => setLocalValues(prev => ({ ...prev, [key]: value }));

  const saveCategory = (fields: FieldConfig[]) => {
    const updates = fields.map(f => ({ key: f.key, value: getValue(f.key), category: f.category }));
    updateMutation.mutate(updates);
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
      case 'color':
        return (
          <div key={field.key} className="space-y-1.5">
            <Label className="text-xs text-foreground/70">{field.label}</Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={hslStringToHex(val)}
                onChange={e => setValue(field.key, hexToHsl(e.target.value))}
                className="w-10 h-10 rounded-lg border border-primary/20 cursor-pointer bg-transparent"
              />
              <Input value={val} onChange={e => setValue(field.key, e.target.value)} className="bg-card border-primary/20 text-foreground font-mono text-xs flex-1" />
              <div className="w-10 h-10 rounded-lg border border-primary/20" style={{ backgroundColor: `hsl(${val})` }} />
            </div>
          </div>
        );
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
            <div className="flex items-center justify-center p-3 rounded-lg border border-primary/10 bg-card/50">
              <div className="bg-primary/20 rounded" style={{ width: `${Math.min(parseInt(val) || field.min || 32, 200)}px`, height: `${Math.min(parseInt(val) || field.min || 32, 80)}px` }} />
            </div>
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
        onClick={() => saveCategory(fields)}
        disabled={updateMutation.isPending}
        className="w-full bg-primary text-primary-foreground font-display font-bold hover:opacity-90"
      >
        <Save className="h-4 w-4 mr-2" />
        {updateMutation.isPending ? 'Salvando...' : 'Salvar alterações'}
      </Button>
    </div>
  );

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
          <TabsList className="w-full grid grid-cols-3 md:grid-cols-6 h-auto gap-1 bg-card border border-primary/15 p-1 rounded-xl">
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
              <Maximize className="h-3.5 w-3.5 mr-1" /> Tamanhos
            </TabsTrigger>
            <TabsTrigger value="voice" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg py-2">
              <MessageCircle className="h-3.5 w-3.5 mr-1" /> Voz
            </TabsTrigger>
            <TabsTrigger value="landing" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg py-2">
              <FileText className="h-3.5 w-3.5 mr-1" /> Landing
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
              <TabSection fields={SIZE_FIELDS} icon={<Maximize className="h-5 w-5 text-primary" />} title="Tamanhos de Logo / Símbolo" />
            </TabsContent>
            <TabsContent value="voice">
              <TabSection fields={VOICE_FIELDS} icon={<MessageCircle className="h-5 w-5 text-primary" />} title="Tom de Voz" />
            </TabsContent>
            <TabsContent value="landing">
              <TabSection fields={LANDING_FIELDS} icon={<FileText className="h-5 w-5 text-primary" />} title="Textos da Landing Page" />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
