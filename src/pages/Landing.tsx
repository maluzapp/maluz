import { Link } from 'react-router-dom';
import logoMaluz from '@/assets/logo_maluz.png';
import lampadaIcon from '@/assets/lampada.png';

const FEATURES = [
  { icon: '📸', title: 'Foto do livro', desc: 'Tire uma foto da página e ganhe exercícios sob medida, gerados por IA.' },
  { icon: '🧠', title: 'IA personalizada', desc: 'Exercícios adaptados à série, matéria e assunto — do 6º ano ao 3º médio.' },
  { icon: '🏆', title: 'Gamificação', desc: 'XP, níveis, streaks e rankings para manter a motivação sempre acesa.' },
  { icon: '👨‍👩‍👧', title: 'Para a família', desc: 'Pais criam perfis para cada filho e acompanham o progresso de perto.' },
];

const DIFFERENTIALS = [
  { num: '01', title: 'Exercícios que fazem sentido', text: 'Nada de questões genéricas. Cada exercício é gerado a partir do conteúdo real do aluno.' },
  { num: '02', title: 'Simplicidade radical', text: 'Três passos: escolha a série, tire a foto, estude. Sem complicação.' },
  { num: '03', title: 'Luz sobre o progresso', text: 'Histórico completo, estatísticas por matéria e tendências de evolução.' },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-secondary text-secondary-foreground">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 py-3 bg-secondary/95 backdrop-blur-md border-b border-primary/15">
        <span className="font-display text-xl font-bold">Ma<span className="text-primary italic">luz</span></span>
        <Link to="/login" className="text-xs font-mono tracking-widest uppercase text-primary hover:text-primary/80 transition-colors">
          Entrar
        </Link>
      </nav>

      {/* Hero */}
      <section className="min-h-screen flex items-center justify-center relative overflow-hidden pt-14">
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 40%, hsla(42, 91%, 61%, 0.12) 0%, transparent 70%)'
        }} />
        <div className="text-center relative z-10 px-5 animate-fade-in">
          <img src={lampadaIcon} alt="Maluz símbolo" className="h-24 mx-auto mb-6 animate-glow-pulse" />
          <p className="font-mono text-[0.6rem] tracking-[0.2em] uppercase text-primary/80 mb-4">
            Estudos personalizados por IA
          </p>
          <h1 className="font-display text-6xl md:text-8xl font-black leading-[0.9] mb-4">
            Ma<span className="text-primary italic">luz</span>
          </h1>
          <div className="w-12 h-0.5 bg-primary mx-auto mb-4 opacity-60" />
          <p className="font-display text-lg md:text-xl italic text-secondary-foreground/70 mb-4">
            O conhecimento que ilumina
          </p>
          <p className="text-xs tracking-widest uppercase text-secondary-foreground/40 flex items-center justify-center gap-2 flex-wrap">
            <span>Exercícios</span>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_6px_hsl(42,91%,61%)]" />
            <span>Inteligência Artificial</span>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_6px_hsl(42,91%,61%)]" />
            <span>Gamificação</span>
          </p>
          <Link to="/login" className="inline-block mt-8 px-8 py-3 rounded-full bg-primary text-primary-foreground font-display font-bold text-sm tracking-wide hover:opacity-90 transition-opacity">
            Começar agora ✨
          </Link>
        </div>
      </section>

      <hr className="border-primary/15" />

      {/* Story */}
      <section className="py-16 px-5">
        <div className="max-w-3xl mx-auto">
          <p className="font-mono text-[0.64rem] tracking-[0.22em] uppercase text-primary/70 mb-3">Nossa história</p>
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-6">
            Uma luz chamada <em className="text-primary">Malu</em>
          </h2>
          <blockquote className="font-display text-lg md:text-xl italic leading-relaxed border-l-[3px] border-primary pl-5 mb-6 text-secondary-foreground/90">
            "Malu era uma menina curiosa que adorava estudar, mas às vezes sentia dificuldade em revisar sozinha."
          </blockquote>
          <p className="text-sm leading-relaxed text-secondary-foreground/70">
            Seu pai, inspirado por ela, criou um app onde bastava tirar uma foto do livro para ganhar exercícios feitos sob medida. 
            Com o tempo, percebeu que o app não apenas ajudava Malu — trazia uma <strong className="text-primary">luz nova</strong>: mais autonomia, mais diversão e mais brilho nos olhos a cada acerto.
            <br /><br />
            Assim nasceu o <strong className="text-primary">Maluz</strong> — a fusão de "Malu" com "Luz". A luz do conhecimento que cabe na palma da mão.
          </p>
        </div>
      </section>

      <hr className="border-primary/15" />

      {/* Features */}
      <section className="py-16 px-5">
        <div className="max-w-3xl mx-auto">
          <p className="font-mono text-[0.64rem] tracking-[0.22em] uppercase text-primary/70 mb-3">Como funciona</p>
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-10">
            Brilhe nos <em className="text-primary">estudos</em>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {FEATURES.map((f) => (
              <div key={f.title} className="p-6 rounded-2xl border border-primary/15 bg-primary/[0.04] hover:bg-primary/[0.08] transition-colors">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-display text-lg text-primary mb-2">{f.title}</h3>
                <p className="text-sm leading-relaxed text-secondary-foreground/65">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <hr className="border-primary/15" />

      {/* Differentials */}
      <section className="py-16 px-5">
        <div className="max-w-3xl mx-auto">
          <p className="font-mono text-[0.64rem] tracking-[0.22em] uppercase text-primary/70 mb-3">Diferenciais</p>
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-10">
            Por que o <em className="text-primary">Maluz</em>?
          </h2>
          <div className="space-y-4">
            {DIFFERENTIALS.map((d) => (
              <div key={d.num} className="p-6 rounded-2xl border border-primary/12 bg-secondary/70 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: 'linear-gradient(90deg, hsl(42, 91%, 61%), transparent)' }} />
                <div className="font-display text-5xl text-primary/20 font-bold leading-none mb-2">{d.num}</div>
                <h3 className="font-display text-lg mb-2">{d.title}</h3>
                <p className="text-sm leading-relaxed text-secondary-foreground/65">{d.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <hr className="border-primary/15" />

      {/* CTA */}
      <section className="py-20 px-5 text-center">
        <div className="max-w-lg mx-auto">
          <img src={lampadaIcon} alt="Maluz" className="h-20 mx-auto mb-6 animate-glow-pulse" />
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Acenda a <em className="text-primary">luz</em> do saber
          </h2>
          <p className="text-sm text-secondary-foreground/60 mb-8">
            Comece agora e transforme o estudo do seu filho em uma jornada iluminada.
          </p>
          <Link to="/login" className="inline-block px-10 py-4 rounded-full bg-primary text-primary-foreground font-display font-bold text-base tracking-wide hover:opacity-90 transition-opacity">
            Criar conta grátis ✨
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 border-t border-primary/10 text-center">
        <img src={logoMaluz} alt="Maluz" className="h-16 mx-auto mb-3" />
        <p className="text-xs tracking-widest uppercase text-secondary-foreground/40 mb-4">O conhecimento que ilumina</p>
        <div className="w-8 h-px bg-primary mx-auto mb-4 opacity-40" />
        <p className="text-[0.65rem] text-secondary-foreground/25 tracking-wide">
          © {new Date().getFullYear()} Maluz · Iluminando mentes, um exercício por vez
        </p>
      </footer>
    </div>
  );
}
