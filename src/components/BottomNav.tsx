import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useProfileStore } from '@/hooks/useProfile';
import { usePendingFriendRequests } from '@/hooks/usePendingFriendRequests';
import { usePendingChallenges } from '@/hooks/usePendingChallenges';
import navHome from '@/assets/icons-game/nav-home.png';
import navProfiles from '@/assets/icons-game/nav-profiles.png';
import navTrophy from '@/assets/icons-game/nav-trophy.png';
import navSwords from '@/assets/icons-game/nav-swords.png';
import centralLamp from '@/assets/icons-game/central-lamp-glow.png';

const NAV_ITEMS_LEFT = [
  { path: '/inicio', icon: navHome, label: 'Início' },
  { path: '/perfis', icon: navProfiles, label: 'Família' },
];

const NAV_ITEMS_RIGHT = [
  { path: '/resultado', icon: navTrophy, label: 'Ranking' },
  { path: '/desafios', icon: navSwords, label: 'Desafios' },
];

const HIDDEN_ROUTES = ['/exercicios', '/confirmacao', '/login', '/', '/admin'];
const HIDDEN_PREFIXES = ['/desafio/'];

export function BottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [lampLit, setLampLit] = useState(false);
  const profileId = useProfileStore((s) => s.activeProfileId);
  const pendingFriends = usePendingFriendRequests();
  const pendingChallenges = usePendingChallenges();

  if (HIDDEN_ROUTES.includes(pathname) || HIDDEN_PREFIXES.some((p) => pathname.startsWith(p)) || !profileId) return null;

  const handleLampClick = () => {
    setLampLit(true);
    setTimeout(() => {
      navigate('/gerar');
      setLampLit(false);
    }, 350);
  };

  const isGeneratePage = pathname === '/gerar';

  const renderItem = ({ path, icon, label }: { path: string; icon: string; label: string }) => {
    const active = pathname === path;
    const badgeCount = path === '/desafios' ? pendingChallenges + pendingFriends : 0;
    const showBadge = badgeCount > 0;
    return (
      <button
        key={path}
        onClick={() => navigate(path)}
        className={cn(
          'flex flex-1 flex-col items-center gap-0.5 pt-2.5 pb-1.5 text-[10px] font-mono font-bold transition-all relative press-down',
          active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
        )}
      >
        {/* Active indicator: curved gold blade on top */}
        {active && (
          <span
            className="absolute top-0 left-1/2 -translate-x-1/2 h-1.5 w-10 rounded-b-full bg-gradient-to-b from-primary to-gold-deep"
            style={{ boxShadow: '0 0 12px hsl(var(--primary) / 0.75)' }}
          />
        )}
        <div className="relative">
          <img
            src={icon}
            alt={label}
            loading="lazy"
            width={56}
            height={56}
            className={cn(
              'h-9 w-9 object-contain transition-all duration-300',
              active
                ? 'scale-110 drop-shadow-[0_4px_10px_hsl(var(--primary)/0.55)]'
                : 'opacity-75 saturate-75 hover:opacity-100 hover:saturate-100'
            )}
          />
          {showBadge && (
            <span
              className={cn(
                'absolute -top-1 -right-2 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-gradient-coral text-white text-[10px] font-mono font-black shadow-bevel-coral animate-badge-pop ring-2 ring-card',
              )}
            >
              {badgeCount > 9 ? '9+' : badgeCount}
            </span>
          )}
        </div>
        <span className={cn('mt-0.5 tracking-wide', active && 'text-stroke-navy')}>{label}</span>
      </button>
    );
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 safe-bottom"
      style={{ filter: 'drop-shadow(0 -4px 20px hsl(213 70% 2% / 0.5))' }}
    >
      {/* Top gold rim */}
      <div className="h-[2px] bg-gradient-to-r from-transparent via-primary/70 to-transparent" />
      <div className="bg-gradient-to-b from-card to-background-deep border-t border-gold-deep/40 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-stretch justify-around relative h-[78px]">
          {NAV_ITEMS_LEFT.map(renderItem)}

          {/* Center lamp button */}
          <div className="flex items-center justify-center" style={{ width: '92px' }}>
            <button
              onClick={handleLampClick}
              aria-label="Gerar exercícios"
              className={cn(
                'absolute -top-9 flex items-center justify-center w-[80px] h-[80px] rounded-full border-[5px] border-card transition-all duration-300 press-down overflow-hidden',
                'bg-gradient-gold shadow-bevel-gold',
                (isGeneratePage || lampLit) && 'animate-glow-breathe scale-105'
              )}
            >
              {/* Pulsing rings when idle */}
              {!isGeneratePage && !lampLit && (
                <>
                  <span className="animate-ring-pulse" />
                  <span className="animate-ring-pulse" style={{ animationDelay: '0.9s' }} />
                </>
              )}
              <img
                src={centralLamp}
                alt=""
                width={120}
                height={120}
                className={cn(
                  'h-16 w-16 object-contain transition-all duration-300 relative z-10',
                  (isGeneratePage || lampLit) ? 'scale-110 drop-shadow-[0_0_18px_hsl(48_100%_72%/0.85)]' : 'drop-shadow-[0_3px_6px_hsl(213_70%_2%/0.5)]'
                )}
              />
            </button>
          </div>

          {NAV_ITEMS_RIGHT.map(renderItem)}
        </div>
      </div>
    </nav>
  );
}
