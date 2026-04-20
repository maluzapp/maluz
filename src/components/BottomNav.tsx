import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useProfileStore } from '@/hooks/useProfile';
import { usePendingFriendRequests } from '@/hooks/usePendingFriendRequests';
import { usePendingChallenges } from '@/hooks/usePendingChallenges';
import { supabase } from '@/integrations/supabase/client';
import lampadaFallback from '@/assets/lampada-logo.png';

const centralButtonUrl = (() => {
  const { data } = supabase.storage.from('logos').getPublicUrl('icon_central_button.png');
  return data.publicUrl;
})();

interface NavItem {
  path: string;
  label: string;
  emoji: string;
  /** classes de cor para texto ativo */
  activeColor: string;
  /** glow para o emoji ativo (CSS color) */
  glowColor: string;
}

const NAV_ITEMS_LEFT: NavItem[] = [
  { path: '/inicio', label: 'Início', emoji: '🏡', activeColor: 'text-[hsl(160,94%,64%)]', glowColor: 'hsl(160 94% 58% / 0.7)' },
  { path: '/ranking', label: 'Ranking', emoji: '🌍', activeColor: 'text-[#22d3ee]', glowColor: 'rgba(6,182,212,0.7)' },
];

const NAV_ITEMS_RIGHT: NavItem[] = [
  { path: '/desafios', label: 'Desafios', emoji: '⚔️', activeColor: 'text-[hsl(42,91%,68%)]', glowColor: 'hsl(42 91% 61% / 0.7)' },
  { path: '/perfis', label: 'Perfil', emoji: '🧑‍🚀', activeColor: 'text-[#e879f9]', glowColor: 'rgba(217,70,239,0.7)' },
];

const HIDDEN_ROUTES = ['/exercicios', '/confirmacao', '/login', '/', '/admin'];
const HIDDEN_PREFIXES = ['/desafio/'];

export function BottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [lampLit, setLampLit] = useState(false);
  const [useRemoteLogo, setUseRemoteLogo] = useState(true);
  const profileId = useProfileStore((s) => s.activeProfileId);
  const pendingFriends = usePendingFriendRequests();
  const pendingChallenges = usePendingChallenges();

  if (HIDDEN_ROUTES.includes(pathname) || HIDDEN_PREFIXES.some(p => pathname.startsWith(p)) || !profileId) return null;

  const handleLampClick = () => {
    setLampLit(true);
    setTimeout(() => {
      navigate('/gerar');
      setLampLit(false);
    }, 400);
  };

  const isGeneratePage = pathname === '/gerar';

  const renderItem = (item: NavItem) => {
    // Considera ativo: rota exata OU /resultado quando estiver no Início (resultados embutidos)
    const active =
      pathname === item.path ||
      (item.path === '/inicio' && pathname === '/resultado') ||
      (item.path === '/ranking' && pathname === '/amigos');

    let badgeCount = 0;
    if (item.path === '/desafios') badgeCount = pendingChallenges;
    if (item.path === '/ranking') badgeCount = pendingFriends;
    const showBadge = badgeCount > 0;

    return (
      <button
        key={item.path}
        onClick={() => navigate(item.path)}
        className={cn(
          // gap-1.5 = 6px conforme escolha do usuário
          'flex flex-1 flex-col items-center gap-1.5 py-2 text-[10px] font-bold transition-all font-mono relative',
          active ? item.activeColor : 'text-muted-foreground/70 hover:text-foreground',
        )}
      >
        <div className="relative">
          <span
            className={cn(
              'block text-[30px] leading-none transition-all duration-300',
              active ? 'scale-110' : 'grayscale opacity-60 hover:grayscale-0 hover:opacity-90',
            )}
            style={
              active
                ? {
                    filter: `drop-shadow(0 2px 0 rgba(0,0,0,0.4)) drop-shadow(0 4px 8px rgba(0,0,0,0.5)) drop-shadow(0 0 14px ${item.glowColor})`,
                  }
                : undefined
            }
          >
            {item.emoji}
          </span>
          {showBadge && (
            <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-black animate-pulse ring-2 ring-card">
              {badgeCount > 9 ? '9+' : badgeCount}
            </span>
          )}
        </div>
        <span className={cn('uppercase tracking-wider', active && 'animate-pulse')}>
          {item.label}
        </span>
      </button>
    );
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-primary/15 bg-card/95 backdrop-blur-md safe-bottom">
      <div className="mx-auto flex max-w-lg items-stretch justify-around relative">
        {NAV_ITEMS_LEFT.map(renderItem)}

        {/* Center lamp button — INTACTO conforme solicitado */}
        <div className="flex items-center justify-center" style={{ width: '88px' }}>
          <button
            onClick={handleLampClick}
            className={cn(
              'absolute -top-10 flex items-center justify-center w-[72px] h-[72px] rounded-full border-4 border-card/95 transition-all duration-300',
              isGeneratePage || lampLit
                ? 'bg-primary shadow-[0_0_24px_hsl(var(--primary)/0.5)] scale-110'
                : 'bg-card hover:bg-primary/20 shadow-lg'
            )}
          >
            <img
              src={useRemoteLogo ? centralButtonUrl : lampadaFallback}
              alt="Gerar exercícios"
              onError={() => setUseRemoteLogo(false)}
              className={cn(
                'h-12 w-12 object-contain transition-all duration-300',
                (isGeneratePage || lampLit) ? 'brightness-150 drop-shadow-[0_0_10px_rgba(245,200,66,0.8)]' : 'opacity-70'
              )}
            />
          </button>
        </div>

        {NAV_ITEMS_RIGHT.map(renderItem)}
      </div>
    </nav>
  );
}
