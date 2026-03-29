import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { lovable } from '@/integrations/lovable/index';
import { Download } from 'lucide-react';
import logoMaluz from '@/assets/logo_maluz.png';

export default function Login() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/perfis');
    }
  }, [user, loading, navigate]);

  const handleGoogleLogin = async () => {
    const { error } = await lovable.auth.signInWithOAuth('google', {
      redirect_uri: window.location.origin,
    });
    if (error) {
      console.error('Login error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 relative overflow-hidden">
      {/* Glow + stars */}
      <div className="absolute inset-0 pointer-events-none hero-glow" />
      <div className="absolute inset-0 pointer-events-none stars-bg" />

      <div className="w-full max-w-sm text-center relative z-10">
        <div className="mb-10 animate-fade-in">
          <img src={logoMaluz} alt="Maluz" className="h-64 mx-auto mb-4" />
          <p className="text-foreground/70 font-display text-sm italic">
            O conhecimento que ilumina ✨
          </p>
        </div>

        <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
          <Button
            size="lg"
            className="w-full gap-3 font-display font-bold rounded-full h-14 text-base"
            onClick={handleGoogleLogin}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Entrar com Google
          </Button>
        </div>

        <div className="mt-8 flex items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: '400ms' }}>
          <Link to="/instalar" className="inline-flex items-center gap-2 text-sm text-foreground/50 hover:text-primary transition-colors">
            <Download className="h-4 w-4" />
            Instalar
          </Link>
          <span className="text-foreground/20">·</span>
          <Link to="/" className="text-sm text-foreground/50 hover:text-primary transition-colors">
            Conheça o Maluz
          </Link>
        </div>
      </div>
    </div>
  );
}
