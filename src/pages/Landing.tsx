import { Link } from 'react-router-dom';
import { useBrandingByCategory } from '@/hooks/useBrandingSettings';
import logoMaluz from '@/assets/logo_maluz.png';
import lampadaIcon from '@/assets/lampada-2.png';

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

export default function Landing() {
  const { data: settings } = useBrandingByCategory();
  const t = (key: string, fallback: string) => settings?.landing?.[key]?.value ?? settings?.general?.[key]?.value ?? fallback;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 py-3 bg-background/93 backdrop-blur-xl border-b border-primary/15">
        <span className="font-display text-xl font-bold text-foreground">Ma<span className="text-primary italic">luz</span></span>
        <div className="flex items-center gap-4">
          <Link to="/admin" className="text-[0.6rem] font-mono tracking-[0.1em] uppercase text-foreground/30 hover:text-primary transition-colors">⚙</Link>
          <Link to="/login" className="text-xs font-mono tracking-[0.12em] uppercase text-primary hover:text-primary/80 transition-colors">
            Entrar
          </Link>
        </div>
      </nav>

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
        </div>
        {/* Scroll indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-primary/55 animate-scroll-bounce">
          <span className="font-mono text-[0.58rem] tracking-[0.18em] uppercase">Scroll</span>
          <div className="w-px h-6 bg-gradient-to-b from-primary to-transparent" />
        </div>
      </section>

      <hr className="border-primary/15" />

      {/* Story */}
      <section className="py-16 md:py-20 px-5">
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
      <section className="py-16 md:py-20 px-5">
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
      <section className="py-16 md:py-20 px-5">
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
      <section className="py-16 md:py-20 px-5">
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

      {/* Mockup Preview */}
      <section className="py-16 md:py-20 px-5">
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

      {/* CTA */}
      <section className="py-20 px-5 text-center">
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

      {/* Footer */}
      <footer className="py-10 border-t border-primary/10 text-center">
        <img src={logoMaluz} alt="Maluz" className="h-16 mx-auto mb-3" />
        <p className="text-xs tracking-widest uppercase text-foreground/40 mb-4">{t('app_tagline', 'O conhecimento que ilumina')}</p>
        <div className="w-8 h-px bg-primary mx-auto mb-4 opacity-40" />
        <p className="text-[0.65rem] text-foreground/25 tracking-wide">
          {t('footer_text', `© ${new Date().getFullYear()} Maluz · Iluminando mentes, um exercício por vez`)}
        </p>
      </footer>
    </div>
  );
}
