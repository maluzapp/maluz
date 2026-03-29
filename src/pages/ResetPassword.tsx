import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import logoMaluz from '@/assets/logo_maluz.png';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Check for recovery event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true);
      }
    });
    // Also check hash for type=recovery
    const hash = window.location.hash;
    if (hash.includes('type=recovery')) {
      setReady(true);
    }
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast.error('Senha deve ter no mínimo 6 caracteres'); return; }
    if (password !== confirmPassword) { toast.error('As senhas não coincidem'); return; }
    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Senha atualizada com sucesso!');
      navigate('/perfis');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none hero-glow" />
      <div className="absolute inset-0 pointer-events-none stars-bg" />

      <div className="w-full max-w-sm text-center relative z-10">
        <img src={logoMaluz} alt="Maluz" className="h-32 mx-auto mb-6" />

        {!ready ? (
          <div className="space-y-4 animate-fade-in">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
            <p className="text-sm text-foreground/60">Verificando link de recuperação...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in text-left">
            <h2 className="font-display text-lg font-bold text-foreground text-center mb-1">Nova senha</h2>
            <p className="text-xs text-foreground/50 text-center mb-2">Escolha uma nova senha para sua conta.</p>
            <div className="space-y-1.5">
              <Label className="text-xs text-foreground/70">Nova senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/30" />
                <Input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Mín. 6 caracteres" className="pl-10 pr-10 bg-card border-primary/20 rounded-xl h-12" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/30 hover:text-foreground/60">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-foreground/70">Confirmar nova senha</Label>
              <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repita a senha" className="bg-card border-primary/20 rounded-xl h-12" required />
            </div>
            <Button type="submit" size="lg" disabled={submitting} className="w-full font-display font-bold rounded-full h-13 gap-2">
              {submitting ? 'Salvando...' : 'Salvar nova senha'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
