import { usePlans } from '@/hooks/useSubscription';
import { Check, Star, Crown, Sparkles, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

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

  if (isLoading || !plans?.length) return null;

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
          <p className="text-sm text-foreground/60 max-w-lg mx-auto">
            O aprendizado básico é um direito. Pague pela <strong className="text-primary">clareza, velocidade e profundidade</strong> que fazem a diferença.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6 items-start">
          {plans.map((plan) => {
            const isPro = plan.slug === 'pro';
            const badge = PLAN_BADGES[plan.slug];

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl border p-6 md:p-7 transition-all hover:scale-[1.02] ${PLAN_COLORS[plan.slug] ?? 'border-primary/20 bg-card'} ${isPro ? 'md:-mt-4 md:mb-4 shadow-[0_0_40px_hsla(42,91%,61%,0.15)]' : ''}`}
              >
                {badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[0.65rem] font-bold px-4 py-1 rounded-full font-mono uppercase tracking-wider whitespace-nowrap flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3" />
                    {badge}
                  </span>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isPro ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'}`}>
                    {PLAN_ICONS[plan.slug] ?? <Star className="h-6 w-6" />}
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold text-foreground">{plan.name}</h3>
                  </div>
                </div>

                {/* Price */}
                <div className="mb-5">
                  {plan.price_monthly > 0 ? (
                    <>
                      <div className="flex items-baseline gap-1">
                        <span className="text-xs text-foreground/50">R$</span>
                        <span className="font-display text-4xl font-black text-foreground">
                          {plan.price_monthly.toFixed(2).replace('.', ',')}
                        </span>
                        <span className="text-xs text-foreground/50">/mês</span>
                      </div>
                      {plan.price_yearly && (
                        <p className="text-[0.7rem] text-accent mt-1 font-mono">
                          ou R$ {plan.price_yearly.toFixed(2).replace('.', ',')}/ano{' '}
                          <span className="text-primary/60">
                            (R$ {(plan.price_yearly / 12).toFixed(2).replace('.', ',')}/mês)
                          </span>
                        </p>
                      )}
                      <p className="text-[0.65rem] text-foreground/40 mt-1">
                        Menos de R$ {(plan.price_monthly / 30).toFixed(2).replace('.', ',')} por dia
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
                <Link
                  to="/login"
                  className={`block text-center py-3 rounded-full font-display font-bold text-sm tracking-wide transition-all hover:scale-105 ${
                    isPro
                      ? 'bg-primary text-primary-foreground hover:opacity-90'
                      : 'border border-primary/30 text-primary hover:bg-primary/10'
                  }`}
                >
                  {plan.price_monthly > 0 ? 'Começar agora' : 'Criar conta grátis'}
                </Link>
              </div>
            );
          })}
        </div>

        {/* Trust signals */}
        <div className="mt-10 text-center space-y-3">
          <div className="flex flex-wrap items-center justify-center gap-4 text-[0.7rem] text-foreground/45">
            <span className="flex items-center gap-1.5">🔒 Pagamento seguro</span>
            <span className="flex items-center gap-1.5">📱 Google Play & App Store</span>
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
