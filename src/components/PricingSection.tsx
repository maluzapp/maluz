import { useState } from 'react';
import { usePlans, useStripeSubscription, startCheckout, STRIPE_PRICES, STRIPE_YEARLY_PRICES } from '@/hooks/useSubscription';
import { useAuth } from '@/hooks/useAuth';
import { Check, Star, Crown, Sparkles, Zap, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const PLAN_ICONS: Record<string, React.ReactNode> = {
  free: <Zap className="h-6 w-6" />,
  pro: <Star className="h-6 w-6" />,
  familia: <Crown className="h-6 w-6" />,
};

const PLAN_COLORS: Record<string, string> = {
  free: 'border-primary/20 bg-card',
  pro: 'border-primary bg-gradient-to-br from-primary/15 to-card ring-2 ring-primary/30',
  familia: 'border-accent/40 bg-gradient-to-br from-accent/10 to-card',
};

const PLAN_BADGES: Record<string, string | null> = {
  free: null,
  pro: '⚡ Mais popular',
  familia: null,
};

export default function PricingSection() {
  const { data: plans, isLoading } = usePlans();
  const { data: stripeStatus } = useStripeSubscription();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  if (isLoading || !plans?.length) return null;

  // Determine current plan from Stripe
  const currentPlanSlug = stripeStatus?.subscribed && stripeStatus.price_id
    ? STRIPE_PRICES[stripeStatus.price_id]?.slug
    : 'free';

  const handleSubscribe = async (plan: typeof plans[0]) => {
    if (!user) {
      navigate('/login');
      return;
    }

    const priceId = billingPeriod === 'yearly'
      ? STRIPE_YEARLY_PRICES[plan.slug]
      : plan.stripe_price_id;

    if (!priceId) {
      toast.error('Preço não configurado para este plano');
      return;
    }

    setLoadingPlan(plan.id);
    try {
      await startCheckout(priceId);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao iniciar checkout');
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <section className="py-16 md:py-24 px-5" id="planos">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <p className="font-mono text-[0.64rem] tracking-[0.22em] uppercase text-primary/70 mb-3">
            Planos
          </p>
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4 text-foreground">
            Invista na <em className="text-primary">luz</em> do seu filho
          </h2>
          <p className="text-sm text-foreground/60 max-w-lg mx-auto mb-6">
            O aprendizado básico é um direito. Pague pela <strong className="text-primary">clareza, velocidade e profundidade</strong> que fazem a diferença.
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center bg-card border border-primary/20 rounded-full p-1 gap-1">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-4 py-1.5 rounded-full text-xs font-display font-bold transition-all ${
                billingPeriod === 'monthly'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground/60 hover:text-foreground'
              }`}
            >
              Mensal
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`px-4 py-1.5 rounded-full text-xs font-display font-bold transition-all flex items-center gap-1.5 ${
                billingPeriod === 'yearly'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground/60 hover:text-foreground'
              }`}
            >
              Anual
              <span className={`text-[0.6rem] px-1.5 py-0.5 rounded-full ${
                billingPeriod === 'yearly'
                  ? 'bg-primary-foreground/20 text-primary-foreground'
                  : 'bg-accent/20 text-accent'
              }`}>
                -44%
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6 items-start">
          {plans.map((plan) => {
            const isPro = plan.slug === 'pro';
            const badge = PLAN_BADGES[plan.slug];
            const isCurrent = plan.slug === currentPlanSlug;
            const isLoading = loadingPlan === plan.id;

            const displayPrice = billingPeriod === 'yearly' && plan.price_yearly
              ? plan.price_yearly
              : plan.price_monthly;
            const monthlyEquiv = billingPeriod === 'yearly' && plan.price_yearly
              ? plan.price_yearly / 12
              : null;

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl border p-6 md:p-7 transition-all hover:scale-[1.02] ${PLAN_COLORS[plan.slug] ?? 'border-primary/20 bg-card'} ${isPro ? 'md:-mt-4 md:mb-4 shadow-[0_0_40px_hsla(42,91%,61%,0.15)]' : ''} ${isCurrent ? 'ring-2 ring-accent' : ''}`}
              >
                {isCurrent && (
                  <span className="absolute -top-3 right-4 bg-accent text-accent-foreground text-[0.6rem] font-bold px-3 py-1 rounded-full font-mono uppercase tracking-wider">
                    Seu plano
                  </span>
                )}
                {badge && !isCurrent && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[0.65rem] font-bold px-4 py-1 rounded-full font-mono uppercase tracking-wider whitespace-nowrap flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3" />
                    {badge}
                  </span>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isPro ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'}`}>
                    {PLAN_ICONS[plan.slug] ?? <Star className="h-6 w-6" />}
                  </div>
                  <h3 className="font-display text-lg font-bold text-foreground">{plan.name}</h3>
                </div>

                {/* Price */}
                <div className="mb-5">
                  {displayPrice > 0 ? (
                    <>
                      <div className="flex items-baseline gap-1">
                        <span className="text-xs text-foreground/50">R$</span>
                        <span className="font-display text-4xl font-black text-foreground">
                          {displayPrice.toFixed(2).replace('.', ',')}
                        </span>
                        <span className="text-xs text-foreground/50">
                          /{billingPeriod === 'yearly' ? 'ano' : 'mês'}
                        </span>
                      </div>
                      {monthlyEquiv && (
                        <p className="text-[0.7rem] text-accent mt-1 font-mono">
                          R$ {monthlyEquiv.toFixed(2).replace('.', ',')}/mês
                        </p>
                      )}
                      <p className="text-[0.65rem] text-foreground/40 mt-1">
                        Menos de R$ {((billingPeriod === 'yearly' && plan.price_yearly ? plan.price_yearly / 365 : plan.price_monthly / 30)).toFixed(2).replace('.', ',')} por dia
                      </p>
                    </>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <span className="font-display text-4xl font-black text-foreground">Grátis</span>
                      <span className="text-xs text-foreground/50">para sempre</span>
                    </div>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-2.5 mb-6">
                  {(plan.features as string[]).map((feat, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-foreground/80">
                      <Check className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                {plan.price_monthly > 0 ? (
                  <button
                    onClick={() => handleSubscribe(plan)}
                    disabled={isLoading || isCurrent}
                    className={`block w-full text-center py-3 rounded-full font-display font-bold text-sm tracking-wide transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 ${
                      isPro
                        ? 'bg-primary text-primary-foreground hover:opacity-90'
                        : 'border border-primary/30 text-primary hover:bg-primary/10'
                    }`}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Processando...
                      </span>
                    ) : isCurrent ? (
                      'Plano atual'
                    ) : (
                      'Começar agora'
                    )}
                  </button>
                ) : (
                  <Link
                    to="/login"
                    className="block text-center py-3 rounded-full font-display font-bold text-sm tracking-wide transition-all hover:scale-105 border border-primary/30 text-primary hover:bg-primary/10"
                  >
                    {isCurrent ? 'Plano atual' : 'Criar conta grátis'}
                  </Link>
                )}
              </div>
            );
          })}
        </div>

        {/* Trust signals */}
        <div className="mt-10 text-center space-y-3">
          <div className="flex flex-wrap items-center justify-center gap-4 text-[0.7rem] text-foreground/45">
            <span className="flex items-center gap-1.5">🔒 Pagamento seguro via Stripe</span>
            <span className="flex items-center gap-1.5">💳 Cartão, Pix, Google Pay, Apple Pay</span>
            <span className="flex items-center gap-1.5">❌ Cancele quando quiser</span>
          </div>
          <p className="text-[0.65rem] text-foreground/30 max-w-md mx-auto">
            Preço de lançamento por tempo limitado. Quem assina agora garante o valor vitalício.
          </p>
        </div>
      </div>
    </section>
  );
}
