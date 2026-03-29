import { useCanStartSession } from '@/hooks/useSubscription';
import { Link } from 'react-router-dom';
import { Sparkles, Lock } from 'lucide-react';

export function UpgradePrompt() {
  const { canStart, sessionsUsed, limit } = useCanStartSession();

  if (canStart || limit === -1) return null;

  return (
    <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-card p-5 text-center animate-fade-in">
      <Lock className="h-8 w-8 text-primary mx-auto mb-3" />
      <h3 className="font-display text-lg font-bold text-foreground mb-2">
        Limite diário atingido
      </h3>
      <p className="text-sm text-foreground/60 mb-1">
        Você usou {sessionsUsed} de {limit} sessões gratuitas hoje.
      </p>
      <p className="text-xs text-foreground/45 mb-4">
        Desbloqueie sessões ilimitadas e relatórios completos com o Maluz Pro.
      </p>
      <Link
        to="/#planos"
        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary text-primary-foreground font-display font-bold text-sm hover:opacity-90 transition-all hover:scale-105"
      >
        <Sparkles className="h-4 w-4" />
        Ver planos
      </Link>
    </div>
  );
}
