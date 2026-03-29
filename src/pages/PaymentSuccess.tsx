import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStripeSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/hooks/useAuth';
import { CheckCircle, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: stripeStatus, refetch } = useStripeSubscription();
  const [countdown, setCountdown] = useState(5);
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    refetch();
  }, [refetch]);

  // Send payment confirmation email
  useEffect(() => {
    if (!user?.email || emailSent || !stripeStatus?.subscribed) return;
    const planSlug = stripeStatus?.plan_slug;
    const planName = planSlug === 'familia' ? 'Família' : 'Pro';

    supabase.functions.invoke('send-email', {
      body: {
        template: 'payment-success',
        to: user.email,
        variables: {
          name: user.user_metadata?.full_name || '',
          plan_name: planName,
          app_url: window.location.origin,
        },
      },
    }).then(() => setEmailSent(true))
      .catch(console.error);
  }, [user, stripeStatus, emailSent]);

  useEffect(() => {
    if (countdown <= 0) {
      navigate('/perfis');
      return;
    }
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, navigate]);

  const priceInfo = stripeStatus?.price_id ? STRIPE_PRICES[stripeStatus.price_id] : null;
  const planName = priceInfo?.slug === 'familia' ? 'Família' : 'Pro';

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none hero-glow" />
      <div className="w-full max-w-md text-center relative z-10 space-y-6 animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center mx-auto">
          <CheckCircle className="h-10 w-10 text-accent" />
        </div>
        
        <div className="space-y-2">
          <h1 className="font-display text-2xl font-bold text-foreground flex items-center justify-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Pagamento confirmado!
          </h1>
          <p className="text-sm text-foreground/60">
            {stripeStatus?.subscribed
              ? `Seu plano ${planName} está ativo. Aproveite todos os recursos!`
              : 'Processando sua assinatura...'}
          </p>
        </div>

        <Button
          onClick={() => navigate('/perfis')}
          size="lg"
          className="font-display font-bold rounded-full gap-2"
        >
          Ir para meus perfis
          <ArrowRight className="h-4 w-4" />
        </Button>

        <p className="text-xs text-foreground/40">
          Redirecionando em {countdown}s...
        </p>
      </div>
    </div>
  );
}
