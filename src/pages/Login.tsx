import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { lovable } from '@/integrations/lovable/index';
import { supabase } from '@/integrations/supabase/client';
import { Download, Mail, Lock, ArrowRight, Eye, EyeOff, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import logoMaluz from '@/assets/logo_maluz.png';

type View = 'main' | 'email-login' | 'email-signup' | 'forgot-password';

export default function Login() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState<View>('main');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      navigate('/perfis');
    }
  }, [user, loading, navigate]);

  const handleGoogleLogin = async () => {
    const { error } = await lovable.auth.signInWithOAuth('google', {
      redirect_uri: window.location.origin,
    });
    if (error) toast.error('Erro ao entrar com Google');
  };

  const handleAppleLogin = async () => {
    const { error } = await lovable.auth.signInWithOAuth('apple', {
      redirect_uri: window.location.origin,
    });
    if (error) toast.error('Erro ao entrar com Apple');
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (error) {
      if (error.message.includes('Invalid login')) {
        toast.error('Email ou senha incorretos');
      } else if (error.message.includes('Email not confirmed')) {
        toast.error('Confirme seu email antes de entrar. Verifique sua caixa de entrada.');
      } else {
        toast.error(error.message);
      }
    }
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name) return;
    if (password.length < 6) { toast.error('Senha deve ter no mínimo 6 caracteres'); return; }
    if (password !== confirmPassword) { toast.error('As senhas não coincidem'); return; }
    setSubmitting(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: name },
        emailRedirectTo: window.location.origin,
      },
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Conta criada! Verifique seu email para confirmar o cadastro.');
      setView('email-login');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { toast.error('Informe seu email'); return; }
    setSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Link de recuperação enviado! Verifique seu email.');
      setView('email-login');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const BackButton = () => (
    <button onClick={() => setView('main')} className="absolute top-6 left-6 p-2 rounded-full hover:bg-primary/10 transition-colors text-foreground/60 hover:text-primary z-20">
      <ChevronLeft className="h-5 w-5" />
    </button>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none hero-glow" />
      <div className="absolute inset-0 pointer-events-none stars-bg" />

      {view !== 'main' && <BackButton />}

      <div className="w-full max-w-sm text-center relative z-10">
        {/* Logo */}
        <div className={`mb-8 animate-fade-in ${view !== 'main' ? 'mb-6' : ''}`}>
          <img src={logoMaluz} alt="Maluz" className={`mx-auto mb-3 transition-all ${view !== 'main' ? 'h-32' : 'h-48'}`} />
          {view === 'main' && (
            <p className="text-foreground/70 font-display text-sm italic">
              O conhecimento que ilumina ✨
            </p>
          )}
        </div>

        {/* ─── MAIN VIEW ─── */}
        {view === 'main' && (
          <div className="space-y-3 animate-fade-in" style={{ animationDelay: '200ms' }}>
            {/* Google */}
            <Button size="lg" className="w-full gap-3 font-display font-bold rounded-full h-13 text-sm bg-card text-foreground border border-primary/20 hover:bg-primary/10 hover:border-primary/40" onClick={handleGoogleLogin}>
              <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continuar com Google
            </Button>

            {/* Apple */}
            <Button size="lg" className="w-full gap-3 font-display font-bold rounded-full h-13 text-sm bg-card text-foreground border border-primary/20 hover:bg-primary/10 hover:border-primary/40" onClick={handleAppleLogin}>
              <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
              </svg>
              Continuar com Apple
            </Button>

            {/* Divider */}
            <div className="flex items-center gap-3 py-2">
              <div className="flex-1 h-px bg-foreground/10" />
              <span className="text-xs text-foreground/40 font-mono">ou</span>
              <div className="flex-1 h-px bg-foreground/10" />
            </div>

            {/* Email */}
            <Button size="lg" variant="outline" className="w-full gap-3 font-display font-bold rounded-full h-13 text-sm border-primary/20 hover:bg-primary/10 hover:border-primary/40" onClick={() => setView('email-login')}>
              <Mail className="h-5 w-5 shrink-0" />
              Entrar com Email
            </Button>

            {/* Sign up link */}
            <p className="text-xs text-foreground/50 pt-2">
              Não tem conta?{' '}
              <button onClick={() => setView('email-signup')} className="text-primary hover:underline font-semibold">
                Criar conta grátis
              </button>
            </p>
          </div>
        )}

        {/* ─── EMAIL LOGIN ─── */}
        {view === 'email-login' && (
          <form onSubmit={handleEmailLogin} className="space-y-4 animate-fade-in text-left">
            <h2 className="font-display text-lg font-bold text-foreground text-center mb-1">Entrar com Email</h2>
            <div className="space-y-1.5">
              <Label className="text-xs text-foreground/70">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/30" />
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" className="pl-10 bg-card border-primary/20 rounded-xl h-12" required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-foreground/70">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/30" />
                <Input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="pl-10 pr-10 bg-card border-primary/20 rounded-xl h-12" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/30 hover:text-foreground/60">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <button type="button" onClick={() => setView('forgot-password')} className="text-xs text-primary hover:underline">
              Esqueci minha senha
            </button>
            <Button type="submit" size="lg" disabled={submitting} className="w-full font-display font-bold rounded-full h-13 gap-2">
              {submitting ? 'Entrando...' : 'Entrar'}
              <ArrowRight className="h-4 w-4" />
            </Button>
            <p className="text-xs text-foreground/50 text-center">
              Não tem conta?{' '}
              <button type="button" onClick={() => setView('email-signup')} className="text-primary hover:underline font-semibold">
                Criar conta
              </button>
            </p>
          </form>
        )}

        {/* ─── EMAIL SIGNUP ─── */}
        {view === 'email-signup' && (
          <form onSubmit={handleEmailSignup} className="space-y-4 animate-fade-in text-left">
            <h2 className="font-display text-lg font-bold text-foreground text-center mb-1">Criar conta</h2>
            <div className="space-y-1.5">
              <Label className="text-xs text-foreground/70">Seu nome</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Como quer ser chamado(a)?" className="bg-card border-primary/20 rounded-xl h-12" required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-foreground/70">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/30" />
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" className="pl-10 bg-card border-primary/20 rounded-xl h-12" required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-foreground/70">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/30" />
                <Input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Mín. 6 caracteres" className="pl-10 pr-10 bg-card border-primary/20 rounded-xl h-12" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/30 hover:text-foreground/60">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-foreground/70">Confirmar senha</Label>
              <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repita a senha" className="bg-card border-primary/20 rounded-xl h-12" required />
            </div>
            <Button type="submit" size="lg" disabled={submitting} className="w-full font-display font-bold rounded-full h-13 gap-2">
              {submitting ? 'Criando...' : 'Criar conta grátis'}
              <ArrowRight className="h-4 w-4" />
            </Button>
            <p className="text-xs text-foreground/50 text-center">
              Já tem conta?{' '}
              <button type="button" onClick={() => setView('email-login')} className="text-primary hover:underline font-semibold">
                Entrar
              </button>
            </p>
          </form>
        )}

        {/* ─── FORGOT PASSWORD ─── */}
        {view === 'forgot-password' && (
          <form onSubmit={handleForgotPassword} className="space-y-4 animate-fade-in text-left">
            <h2 className="font-display text-lg font-bold text-foreground text-center mb-1">Recuperar senha</h2>
            <p className="text-xs text-foreground/50 text-center">Enviaremos um link para redefinir sua senha.</p>
            <div className="space-y-1.5">
              <Label className="text-xs text-foreground/70">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/30" />
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" className="pl-10 bg-card border-primary/20 rounded-xl h-12" required />
              </div>
            </div>
            <Button type="submit" size="lg" disabled={submitting} className="w-full font-display font-bold rounded-full h-13 gap-2">
              {submitting ? 'Enviando...' : 'Enviar link de recuperação'}
            </Button>
          </form>
        )}

        {/* Trust signals */}
        {view === 'main' && (
          <div className="mt-8 space-y-4 animate-fade-in" style={{ animationDelay: '400ms' }}>
            <div className="flex items-center justify-center gap-4">
              <Link to="/instalar" className="inline-flex items-center gap-2 text-sm text-foreground/50 hover:text-primary transition-colors">
                <Download className="h-4 w-4" /> Instalar
              </Link>
              <span className="text-foreground/20">·</span>
              <Link to="/" className="text-sm text-foreground/50 hover:text-primary transition-colors">
                Conheça o Maluz
              </Link>
            </div>
            <div className="flex items-center justify-center gap-3 text-[0.65rem] text-foreground/30">
              <span>🔒 Dados protegidos</span>
              <span>·</span>
              <span>🇧🇷 Feito no Brasil</span>
              <span>·</span>
              <span>⚡ Grátis para começar</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
