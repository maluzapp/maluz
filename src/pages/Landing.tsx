import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useBrandingByCategory } from '@/hooks/useBrandingSettings';
import logoMaluz from '@/assets/logo_maluz.png';
import lampadaIcon from '@/assets/lampada-2.png';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import PricingSection from '@/components/PricingSection';
import { Button } from '@/components/ui/button';
import { Download, X, Share, ChevronUp } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const FEATURES = [
  { icon: '📸', title: 'Entrada por Foto', desc: 'A criança fotografa a página do seu livro. O exercício é 100% alinhado ao que está sendo estudado naquele momento.' },
  { icon: '🧠', title: 'Personalização Profunda', desc: 'Conteúdo gerado sob demanda conforme ano, matéria, assunto e livro. Cada sessão é única e contextualizada.' },
  { icon: '🎯', title: 'Formatos Variados', desc: 'Múltipla escolha, lacunas, verdadeiro ou falso. Correção instantânea com feedback encorajador em cada resposta.' },
  { icon: '🤖', title: 'Aprendizado Adaptativo', desc: 'A Maluz ajusta a dificuldade com base no desempenho, mantendo o desafio sempre na zona ideal de aprendizado.' },
  { icon: '💛', title: 'Afeto na Tecnologia', desc: 'A Maluz tem uma história real. O nome carrega uma homenagem verdadeira que cria conexão emocional única.' },
  { icon: '📶', title: 'Funciona Offline', desc: 'Exercícios previamente gerados ficam disponíveis sem internet. O estudo nunca é interrompido.' },
];

const PERSONAS = [
  { badge: 'Primário', icon: '👧', name: 'A Estudante', sub: 'Criança · 1º ao 9º ano do EF · 6 a 15 anos', desc: 'Curiosa, ativa e digital nativa. Aprende melhor quando o conteúdo é personalizado e divertido. Quer ser reconhecida pelo esforço.', tags: ['Exercícios do seu livro', 'Feedback imediato', 'Conquistas visíveis'] },
  { badge: 'Secundário', icon: '👨‍👩‍👧', name: 'Os Responsáveis', sub: 'Pais & Mães · 30 a 50 anos', desc: 'Preocupados com o aprendizado e sem tempo para ajudar diariamente. Querem solução prática, segura e alinhada à escola.', tags: ['Acompanhar progresso', 'Conteúdo da escola', 'Segurança digital'] },
  { badge: 'Terciário', icon: '👩‍🏫', name: 'Os Professores', sub: 'Educadores do EF · Todas as matérias', desc: 'Buscam ferramentas que complementem suas aulas. Valorizam tecnologia que respeita o currículo e o ritmo da turma.', tags: ['Alinhamento curricular', 'Atividade complementar', 'Fácil de usar'] },
];

const UX_STEPS = [
  { title: 'Simplicidade de Entrada', desc: 'Em poucos toques a criança insere as informações ou tira a foto. O caminho do desejo é sempre o mais curto.' },
  { title: 'Encantamento na Chegada', desc: 'Interface alegre e acolhedora que diz "você está no lugar certo". Cores vibrantes e voz amigável criam o tom imediatamente.' },
  { title: 'Gratificação Constante', desc: '"Brilhou!" com partículas douradas após cada acerto. Cada conquista é um momento, não apenas uma estatística.' },
  { title: 'Controle para os Pais', desc: 'Progresso, matérias, tempo de estudo e desempenho por assunto. Transparência total, sem esforço.' },
];

/* Store badge SVGs */
function GooglePlayBadge({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 135 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="135" height="40" rx="5" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeOpacity="0.3" strokeWidth="0.8"/>
      <text x="67.5" y="16" textAnchor="middle" fill="currentColor" fillOpacity="0.6" fontSize="7" fontFamily="system-ui">DISPONÍVEL NO</text>
      <text x="67.5" y="28" textAnchor="middle" fill="currentColor" fontSize="11" fontWeight="bold" fontFamily="system-ui">Google Play</text>
    </svg>
  );
}

function AppStoreBadge({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 135 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="135" height="40" rx="5" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeOpacity="0.3" strokeWidth="0.8"/>
      <text x="67.5" y="16" textAnchor="middle" fill="currentColor" fillOpacity="0.6" fontSize="7" fontFamily="system-ui">BAIXE NA</text>
      <text x="67.5" y="28" textAnchor="middle" fill="currentColor" fontSize="11" fontWeight="bold" fontFamily="system-ui">App Store</text>
    </svg>
  );
}

/* Small store icons for hero */
function SmallGooglePlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 20.5V3.5C3 2.91 3.34 2.39 3.84 2.15L13.69 12L3.84 21.85C3.34 21.61 3 21.09 3 20.5ZM16.81 15.12L6.05 21.34L14.54 12.85L16.81 15.12ZM20.16 10.81C20.5 11.08 20.75 11.5 20.75 12C20.75 12.5 20.5 12.92 20.16 13.19L17.89 14.5L15.39 12L17.89 9.5L20.16 10.81ZM6.05 2.66L16.81 8.88L14.54 11.15L6.05 2.66Z" fill="currentColor"/>
    </svg>
  );
}

function SmallAppleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.1 22C7.79 22.05 6.8 20.68 5.96 19.47C4.25 16.56 2.93 11.3 4.7 7.72C5.57 5.94 7.36 4.86 9.28 4.84C10.56 4.81 11.78 5.72 12.57 5.72C13.36 5.72 14.85 4.62 16.4 4.8C17.06 4.83 18.89 5.09 20.05 6.82C19.95 6.89 17.76 8.16 17.79 10.81C17.82 14.03 20.59 15.09 20.63 15.11C20.59 15.21 20.14 16.72 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z" fill="currentColor"/>
    </svg>
  );
}

export default function Landing() {
  const { data: settings } = useBrandingByCategory();
  const t = (key: string, fallback: string) => settings?.landing?.[key]?.value ?? settings?.general?.[key]?.value ?? settings?.share?.[key]?.value ?? fallback;

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const footerLogoHeight = settings?.landing?.['logo_height_landing_footer']?.value
    ? `${settings.landing['logo_height_landing_footer'].value}px`
    : '96px';

  useEffect(() => {
    const ua = navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(ua));

    // Check if already installed as PWA (multiple signals)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || (navigator as any).standalone === true;
    const wasInstalled = localStorage.getItem('maluz_installed') === '1';

    if (isStandalone || wasInstalled) {
      setIsInstalled(true);
      localStorage.setItem('maluz_installed', '1');
      return;
    }

    // Check via getInstalledRelatedApps (Chrome 80+)
    if ('getInstalledRelatedApps' in navigator) {
      (navigator as any).getInstalledRelatedApps().then((apps: any[]) => {
        if (apps && apps.length > 0) {
          setIsInstalled(true);
          localStorage.setItem('maluz_installed', '1');
        }
      }).catch(() => {});
    }

    // Check if banner was dismissed this session
    if (sessionStorage.getItem('install_banner_dismissed')) {
      setBannerDismissed(true);
    }

    // Show banner after a short delay
    const timer = setTimeout(() => setShowInstallBanner(true), 2000);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // Listen for successful installation
    const installedHandler = () => {
      setIsInstalled(true);
      setShowInstallBanner(false);
      setDeferredPrompt(null);
      localStorage.setItem('maluz_installed', '1');
    };
    window.addEventListener('appinstalled', installedHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
      clearTimeout(timer);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        localStorage.setItem('maluz_installed', '1');
      }
      setDeferredPrompt(null);
      setShowInstallBanner(false);
    }
  };

  const dismissBanner = () => {
    setShowInstallBanner(false);
    setBannerDismissed(true);
    sessionStorage.setItem('install_banner_dismissed', '1');
  };

  const showBanner = showInstallBanner && !isInstalled && !bannerDismissed;

  // Scroll-reveal observer
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const els = root.querySelectorAll('.scroll-reveal');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 py-3 bg-background/95 backdrop-blur-xl border-b border-primary/15">
        <a href="#" className="font-display text-xl font-bold text-foreground">Ma<span className="text-primary italic">luz</span></a>
        <div className="hidden md:flex items-center gap-6">
          <a href="#diferenciais" className="text-xs font-mono tracking-[0.1em] uppercase text-foreground/50 hover:text-primary transition-colors">Diferenciais</a>
          <a href="#experiencia" className="text-xs font-mono tracking-[0.1em] uppercase text-foreground/50 hover:text-primary transition-colors">Experiência</a>
          <a href="#planos" className="text-xs font-mono tracking-[0.1em] uppercase text-foreground/50 hover:text-primary transition-colors">Planos</a>
        </div>
        <div className="flex items-center gap-3">
          {!isInstalled && (
            <Link to="/instalar" className="hidden sm:inline-flex items-center gap-1.5 text-xs font-mono tracking-[0.1em] uppercase text-primary hover:text-primary/80 transition-colors">
              <Download className="h-3.5 w-3.5" /> Instalar
            </Link>
          )}
          <Link to="/login" className="text-xs font-mono tracking-[0.12em] uppercase bg-primary text-primary-foreground px-4 py-1.5 rounded-full hover:opacity-90 transition-all">
            Entrar
          </Link>
        </div>
      </nav>

      {/* Install banner */}
      {showBanner && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-fade-in">
          <div className="max-w-lg mx-auto bg-card border border-primary/30 rounded-2xl p-4 shadow-2xl shadow-primary/10 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
              <img src={lampadaIcon} alt="Maluz" className="h-8 w-8 object-contain" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display font-bold text-foreground text-sm">Instale o Maluz!</p>
              <p className="text-xs text-muted-foreground">
                {isIOS
                  ? 'Toque em Compartilhar → Adicionar à Tela de Início'
                  : 'Acesse como um app direto do celular'}
              </p>
            </div>
            {deferredPrompt ? (
              <Button size="sm" onClick={handleInstall} className="shrink-0 gap-1.5 rounded-full font-display font-bold">
                <Download className="h-3.5 w-3.5" /> Instalar
              </Button>
            ) : (
              <Link to="/instalar">
                <Button size="sm" className="shrink-0 gap-1.5 rounded-full font-display font-bold">
                  <Download className="h-3.5 w-3.5" /> Como instalar
                </Button>
              </Link>
            )}
            <button onClick={dismissBanner} className="shrink-0 text-muted-foreground hover:text-foreground p-1">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Hero */}
      <section className="min-h-screen flex items-center justify-center relative overflow-hidden pt-14">
        <div className="absolute inset-0 pointer-events-none hero-glow" />
        <div className="absolute inset-0 pointer-events-none stars-bg" />
        <div className="text-center relative z-10 px-5 animate-fade-in">
          <img src={lampadaIcon} alt="Maluz símbolo" className="h-24 mx-auto mb-6 animate-float" />
          <p className="font-mono text-[0.6rem] tracking-[0.2em] uppercase text-primary/80 mb-4">
            {t('hero_subtitle', 'Estudos personalizados pela Maluz')}
          </p>
          <h1 className="font-display text-6xl md:text-8xl font-black leading-[0.9] mb-4 text-foreground">
            Ma<span className="text-primary italic">luz</span>
          </h1>
          <div className="w-12 h-0.5 bg-primary mx-auto mb-4 opacity-60" />
          <p className="font-display text-lg md:text-xl italic text-foreground/70 mb-4">
            {t('app_tagline', 'O conhecimento que ilumina')}
          </p>
          <p className="text-xs tracking-widest uppercase text-foreground/42 flex items-center justify-center gap-2 flex-wrap">
            <span>Exercícios</span>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_6px_hsl(42,91%,61%)]" />
            <span>Personalização Inteligente</span>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_6px_hsl(42,91%,61%)]" />
            <span>Gamificação</span>
          </p>
          <Link to="/login" className="inline-block mt-8 px-8 py-3 rounded-full bg-primary text-primary-foreground font-display font-bold text-sm tracking-wide hover:opacity-90 transition-all hover:scale-105">
            {t('cta_button', 'Começar agora ✨')}
          </Link>

          {/* Small store icons in hero */}
          <div className="flex items-center justify-center gap-3 mt-5">
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-primary/20 bg-primary/[0.06] text-foreground/40 hover:text-primary hover:border-primary/40 transition-all cursor-default">
                  <SmallGooglePlayIcon className="h-4 w-4" />
                </span>
              </TooltipTrigger>
              <TooltipContent><p className="text-xs">Em breve no Google Play</p></TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-primary/20 bg-primary/[0.06] text-foreground/40 hover:text-primary hover:border-primary/40 transition-all cursor-default">
                  <SmallAppleIcon className="h-4 w-4" />
                </span>
              </TooltipTrigger>
              <TooltipContent><p className="text-xs">Em breve na App Store</p></TooltipContent>
            </Tooltip>
          </div>
        </div>
        {/* Scroll indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-primary/55 animate-scroll-bounce">
          <span className="font-mono text-[0.58rem] tracking-[0.18em] uppercase">Scroll</span>
          <div className="w-px h-6 bg-gradient-to-b from-primary to-transparent" />
        </div>
      </section>

      <hr className="border-primary/15" />

      {/* Story */}
      <section className="py-16 md:py-20 px-5 scroll-reveal">
        <div className="max-w-4xl mx-auto md:grid md:grid-cols-5 md:gap-12 md:items-center">
          <div className="md:col-span-3">
            <p className="font-mono text-[0.64rem] tracking-[0.22em] uppercase text-primary/70 mb-3">01 — Brand Story</p>
            <h2 className="font-display text-3xl md:text-5xl font-bold mb-6 text-foreground">
              Uma luz chamada <em className="text-primary">Malu</em>
            </h2>
            <blockquote className="font-display text-lg md:text-xl italic leading-relaxed border-l-[3px] border-primary pl-5 mb-6 text-foreground/90">
              "{t('brand_story', 'Malu era uma menina curiosa que adorava estudar, mas às vezes sentia dificuldade em revisar sozinha.')}"
            </blockquote>
            <p className="text-sm leading-relaxed text-foreground/70">
              {t('brand_story_detail', 'Seu pai, inspirado por ela, criou um app onde bastava tirar uma foto do livro para ganhar exercícios feitos sob medida. Com o tempo, percebeu que o app não apenas ajudava Malu — trazia uma luz nova: mais autonomia, mais diversão e mais brilho nos olhos a cada acerto. Assim nasceu o Maluz — a fusão de "Malu" com "Luz". A luz do conhecimento que cabe na palma da mão.')}
            </p>
          </div>
          {/* Animated visual */}
          <div className="md:col-span-2 flex items-center justify-center relative h-64 mt-8 md:mt-0">
            <div className="absolute w-[230px] h-[230px] rounded-full border border-dashed border-primary/20 animate-orbit">
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-primary opacity-70" />
            </div>
            <div className="absolute w-[260px] h-[260px] rounded-full border border-dashed border-primary/20 animate-orbit-reverse">
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-primary opacity-50" />
            </div>
            <div className="w-[200px] h-[200px] rounded-full bg-gradient-to-br from-primary/20 to-background border border-primary/20 flex items-center justify-center">
              <div className="w-[140px] h-[140px] rounded-full bg-gradient-to-br from-primary/25 to-background/60 border border-primary/30 flex items-center justify-center">
                <img src={lampadaIcon} alt="" className="h-16 animate-glow-pulse" />
              </div>
            </div>
          </div>
        </div>

        {/* Mission / Vision / Essence */}
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 mt-12">
          <div className="p-5 rounded-2xl border border-primary/15 bg-primary/[0.04]">
            <p className="font-mono text-[0.62rem] tracking-[0.18em] uppercase text-primary/70 mb-2">Missão</p>
            <p className="font-display text-sm leading-relaxed text-foreground/85">{t('mission_text', 'Iluminar a jornada de estudos das crianças, transformando dúvidas em entendimento de forma leve e motivadora.')}</p>
          </div>
          <div className="p-5 rounded-2xl bg-primary text-primary-foreground">
            <p className="font-mono text-[0.62rem] tracking-[0.18em] uppercase opacity-60 mb-2">Visão</p>
            <p className="font-display text-sm leading-relaxed">{t('vision_text', 'Ser o companheiro digital mais querido para o estudo personalizado, unindo tecnologia e afeto.')}</p>
          </div>
          <div className="p-5 rounded-2xl border border-primary/15 bg-primary/[0.04]">
            <p className="font-mono text-[0.62rem] tracking-[0.18em] uppercase text-primary/70 mb-2">Essência</p>
            <p className="font-display text-sm leading-relaxed text-foreground/85">{t('essence_text', 'Tecnologia com afeto. Por trás de cada exercício existe uma relação real de cuidado e incentivo.')}</p>
          </div>
        </div>
      </section>

      <hr className="border-primary/15" />

      {/* Differentials / Features */}
      <section id="diferenciais" className="py-16 md:py-20 px-5 scroll-mt-16 scroll-reveal">
        <div className="max-w-4xl mx-auto">
          <p className="font-mono text-[0.64rem] tracking-[0.22em] uppercase text-primary/70 mb-3">Diferenciais</p>
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-10 text-foreground">
            Por que a <em className="text-primary">Maluz</em>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className="p-6 rounded-2xl border border-primary/12 bg-card relative overflow-hidden hover:bg-primary/[0.06] transition-all hover:scale-[1.02] animate-fade-in"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-primary to-transparent" />
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-display text-lg text-primary mb-2">{f.title}</h3>
                <p className="text-sm leading-relaxed text-foreground/65">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <hr className="border-primary/15" />

      {/* Personas */}
      <section className="py-16 md:py-20 px-5 scroll-reveal">
        <div className="max-w-4xl mx-auto">
          <p className="font-mono text-[0.64rem] tracking-[0.22em] uppercase text-primary/70 mb-3">Público-Alvo</p>
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-10 text-foreground">
            Para quem a <em className="text-primary">luz</em> brilha
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {PERSONAS.map((p, i) => (
              <div
                key={p.name}
                className="p-6 rounded-2xl border border-primary/12 bg-gradient-to-br from-primary/[0.06] to-card animate-fade-in"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <span className="inline-block font-mono text-[0.58rem] tracking-[0.14em] uppercase text-primary bg-primary/12 px-2.5 py-1 rounded-full mb-3">{p.badge}</span>
                <div className="text-3xl mb-2">{p.icon}</div>
                <h3 className="font-display text-lg text-foreground mb-1">{p.name}</h3>
                <p className="text-xs text-primary/80 mb-3">{p.sub}</p>
                <p className="text-sm leading-relaxed text-foreground/63 mb-4">{p.desc}</p>
                <div className="flex flex-wrap gap-1.5">
                  {p.tags.map((t) => (
                    <span key={t} className="text-[0.68rem] px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <hr className="border-primary/15" />

      {/* UX Principles */}
      <section id="experiencia" className="py-16 md:py-20 px-5 scroll-mt-16 scroll-reveal">
        <div className="max-w-3xl mx-auto">
          <p className="font-mono text-[0.64rem] tracking-[0.22em] uppercase text-primary/70 mb-3">Experiência</p>
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-10 text-foreground">
            A experiência <em className="text-primary">Maluz</em>
          </h2>
          <div className="relative pl-7">
            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary to-transparent" />
            {UX_STEPS.map((s, i) => (
              <div key={i} className="relative pl-6 pb-8 border-b border-primary/8 last:border-b-0 animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
                <div className="absolute -left-[1.85rem] top-4 w-3 h-3 rounded-full bg-primary shadow-[0_0_0_3px_hsla(42,91%,61%,0.14)]" />
                <h3 className="font-display text-base text-primary mb-1">{i + 1}. {s.title}</h3>
                <p className="text-sm leading-relaxed text-foreground/63">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <hr className="border-primary/15" />

      {/* Pricing */}
      <PricingSection />

      <hr className="border-primary/15" />

      {/* Mockup Preview */}
      <section className="py-16 md:py-20 px-5 scroll-reveal">
        <div className="max-w-4xl mx-auto text-center">
          <p className="font-mono text-[0.64rem] tracking-[0.22em] uppercase text-primary/70 mb-3">App</p>
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4 text-foreground">
            A <em className="text-primary">Maluz</em> na tela
          </h2>
          <p className="text-sm text-foreground/60 mb-10 max-w-lg mx-auto">
            Prévia das principais telas demonstrando como a identidade visual se traduz em interface.
          </p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-8">
            {/* Splash */}
            <div className="w-[220px] rounded-[24px] border-2 border-primary/25 bg-background overflow-hidden shadow-[0_24px_50px_rgba(0,0,0,0.5)] animate-fade-in">
              <div className="h-5 flex items-center justify-center"><div className="w-12 h-1.5 bg-primary/20 rounded-full" /></div>
              <div className="px-4 py-8 flex flex-col items-center justify-center min-h-[300px] hero-glow">
                <img src={lampadaIcon} alt="" className="h-12 mb-4 animate-glow-pulse" />
                <p className="font-display text-3xl font-black text-foreground">Ma<span className="text-primary italic">luz</span></p>
                <p className="font-mono text-[0.6rem] tracking-[0.13em] uppercase text-primary/70 mt-2">Acenda a luz do saber</p>
              </div>
            </div>

            {/* Home */}
            <div className="w-[220px] rounded-[24px] border-2 border-primary/25 bg-background overflow-hidden shadow-[0_24px_50px_rgba(0,0,0,0.5)] animate-fade-in" style={{ animationDelay: '150ms' }}>
              <div className="h-5 flex items-center justify-center"><div className="w-12 h-1.5 bg-primary/20 rounded-full" /></div>
              <div className="px-3 py-4 flex flex-col gap-2.5 min-h-[300px]">
                <p className="font-display text-sm text-foreground">Olá, <span className="text-primary">Ana!</span> ✨</p>
                <p className="text-[0.6rem] text-foreground/48">Pronta para brilhar hoje?</p>
                <div className="rounded-xl p-3 bg-primary/8 border border-primary/15">
                  <p className="font-mono text-[0.55rem] tracking-[0.13em] uppercase text-primary/80 mb-0.5">Última sessão</p>
                  <p className="font-display text-xs text-foreground">Matemática · 4º ano</p>
                  <p className="text-[0.6rem] text-primary/80 mt-0.5">8 de 10 corretas ⭐</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl p-3 bg-primary/8 border border-primary/15 text-center">
                    <p className="font-mono text-[0.55rem] tracking-[0.13em] uppercase text-primary/80">Exercícios</p>
                    <p className="font-mono text-lg font-bold text-primary">47</p>
                  </div>
                  <div className="rounded-xl p-3 bg-primary/8 border border-primary/15 text-center">
                    <p className="font-mono text-[0.55rem] tracking-[0.13em] uppercase text-primary/80">Acertos</p>
                    <p className="font-mono text-lg font-bold text-accent">82%</p>
                  </div>
                </div>
                <div className="rounded-full py-2 bg-primary text-primary-foreground text-center text-xs font-bold">📷 Nova sessão</div>
                <div className="rounded-full py-2 border border-primary/30 text-primary text-center text-xs font-bold">📚 Continuar</div>
              </div>
            </div>

            {/* Exercise */}
            <div className="w-[220px] rounded-[24px] border-2 border-primary/25 bg-background overflow-hidden shadow-[0_24px_50px_rgba(0,0,0,0.5)] animate-fade-in" style={{ animationDelay: '300ms' }}>
              <div className="h-5 flex items-center justify-center"><div className="w-12 h-1.5 bg-primary/20 rounded-full" /></div>
              <div className="px-3 py-4 flex flex-col gap-2.5 min-h-[300px]">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-[0.56rem] text-primary tracking-[0.1em]">QUESTÃO 3 / 5</span>
                  <span className="font-mono text-[0.56rem] text-accent">+120 pts</span>
                </div>
                <div className="bg-primary/8 rounded-lg h-1.5"><div className="bg-primary h-full w-3/5 rounded-lg" /></div>
                <p className="text-xs text-foreground/85 leading-relaxed">
                  Qual é o resultado:<br />
                  <strong className="text-primary text-sm">4 × 7 + 3 = ?</strong>
                </p>
                <div className="rounded-lg border border-primary/20 px-3 py-2 text-xs text-foreground/80">A) 25</div>
                <div className="rounded-lg border border-accent px-3 py-2 text-xs text-accent bg-accent/8">B) 31 ✓</div>
                <div className="rounded-lg border border-primary/20 px-3 py-2 text-xs text-foreground/36">C) 28</div>
                <div className="rounded-lg border border-primary/20 px-3 py-2 text-xs text-foreground/36">D) 34</div>
                <p className="text-center font-display text-lg italic text-primary">Brilhou! 🌟</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <hr className="border-primary/15" />

      {/* App Stores */}
      <section className="py-16 md:py-20 px-5 scroll-reveal">
        <div className="max-w-3xl mx-auto text-center">
          <p className="font-mono text-[0.64rem] tracking-[0.22em] uppercase text-primary/70 mb-3">Disponibilidade</p>
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4 text-foreground">
            Em breve nas <em className="text-primary">melhores lojas</em>
          </h2>
          <p className="text-sm text-foreground/60 mb-8 max-w-md mx-auto">
            {t('stores_description', 'A Maluz está sendo preparada com carinho para chegar ao Google Play e à App Store. Enquanto isso, acesse pelo navegador!')}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <div className="relative group cursor-default">
              <GooglePlayBadge className="w-[160px] h-[48px] text-foreground opacity-50 group-hover:opacity-80 transition-opacity" />
              <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[9px] font-bold px-2 py-0.5 rounded-full font-mono uppercase tracking-wider">
                Em breve
              </span>
            </div>
            <div className="relative group cursor-default">
              <AppStoreBadge className="w-[160px] h-[48px] text-foreground opacity-50 group-hover:opacity-80 transition-opacity" />
              <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[9px] font-bold px-2 py-0.5 rounded-full font-mono uppercase tracking-wider">
                Em breve
              </span>
            </div>
          </div>
        </div>
      </section>

      <hr className="border-primary/15" />

      {/* CTA */}
      <section className="py-20 px-5 text-center scroll-reveal">
        <div className="max-w-lg mx-auto">
          <img src={lampadaIcon} alt="Maluz" className="h-20 mx-auto mb-6 animate-float" />
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4 text-foreground">
            {t('app_slogan', 'Acenda a luz do saber')}
          </h2>
          <p className="text-sm text-foreground/60 mb-8">
            {t('cta_text', 'Comece agora e transforme o estudo do seu filho em uma jornada iluminada.')}
          </p>
          <Link to="/login" className="inline-block px-10 py-4 rounded-full bg-primary text-primary-foreground font-display font-bold text-base tracking-wide hover:opacity-90 transition-all hover:scale-105">
            {t('cta_button', 'Criar conta grátis ✨')}
          </Link>
        </div>
      </section>

      {/* Scroll to top button */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-50 w-11 h-11 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-200"
          aria-label="Voltar ao topo"
        >
          <ChevronUp className="h-5 w-5" />
        </button>
      )}

      {/* Footer */}
      <footer className="py-10 border-t border-primary/10 text-center">
        <img src={logoMaluz} alt="Maluz" className="mx-auto mb-3" style={{ height: footerLogoHeight }} />
        <p className="text-xs tracking-widest uppercase text-foreground/40 mb-4">{t('app_tagline', 'O conhecimento que ilumina')}</p>
        <button
          onClick={() => {
            const msg = t('share_whatsapp_text', 'Conhece o Maluz? Exercícios personalizados por IA para crianças do 2º ao 9º ano! \u2728\uD83D\uDCDA Confira: https://maluz.app');
            const text = encodeURIComponent(msg);
            const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
            const url = isMobile ? `https://api.whatsapp.com/send?text=${text}` : `https://web.whatsapp.com/send?text=${text}`;
            window.open(url, '_blank', 'noopener,noreferrer');
          }}
          className="inline-flex items-center gap-2 text-xs text-foreground/40 hover:text-foreground/70 transition-colors mb-4 cursor-pointer"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          Compartilhar via WhatsApp
        </a>
        <div className="w-8 h-px bg-primary mx-auto mb-4 opacity-40" />
        <p className="text-[0.65rem] text-foreground/25 tracking-wide">
          {t('footer_text', `© ${new Date().getFullYear()} Maluz · Iluminando mentes, um exercício por vez`)}
        </p>
      </footer>
    </div>
  );
}
