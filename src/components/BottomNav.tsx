import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Users, Trophy, Swords } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProfileStore } from '@/hooks/useProfile';
import { usePendingFriendRequests } from '@/hooks/usePendingFriendRequests';
import { usePendingChallenges } from '@/hooks/usePendingChallenges';
import lampadaIcon from '@/assets/lampada-2.png';

const NAV_ITEMS_LEFT = [
  { path: '/inicio', icon: Home, label: 'Início' },
  { path: '/perfis', icon: Users, label: 'Perfis' },
];

const NAV_ITEMS_RIGHT = [
  { path: '/resultado', icon: Trophy, label: 'Resultado' },
  { path: '/desafios', icon: Swords, label: 'Desafios' },
];

const HIDDEN_ROUTES = ['/exercicios', '/confirmacao', '/login', '/'];
const HIDDEN_PREFIXES = ['/desafio/'];

export function BottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [lampLit, setLampLit] = useState(false);
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

  const renderItem = ({ path, icon: Icon, label }: { path: string; icon: typeof Home; label: string }) => {
    const active = pathname === path;
    const badgeCount = path === '/desafios' ? pendingChallenges + pendingFriends : 0;
    const showBadge = badgeCount > 0;
    return (
      <button
        key={path}
        onClick={() => navigate(path)}
        className={cn(
          'flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors font-mono relative',
          active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <div className="relative">
          <Icon className={cn('h-5 w-5 transition-transform', active && 'scale-110')} />
          {showBadge && (
            <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold animate-pulse">
              {badgeCount > 9 ? '9+' : badgeCount}
            </span>
          )}
        </div>
        <span>{label}</span>
        {active && <span className="absolute top-0 h-0.5 w-8 rounded-b-full bg-primary" />}
      </button>
    );
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-primary/15 bg-card/95 backdrop-blur-md safe-bottom">
      <div className="mx-auto flex max-w-lg items-stretch justify-around relative">
        {NAV_ITEMS_LEFT.map(renderItem)}

        {/* Center lamp button */}
        <div className="flex items-center justify-center" style={{ width: '72px' }}>
          <button
            onClick={handleLampClick}
            className={cn(
              'absolute -top-6 flex items-center justify-center w-14 h-14 rounded-full border-4 border-card/95 transition-all duration-300',
              isGeneratePage || lampLit
                ? 'bg-primary shadow-[0_0_20px_hsl(var(--primary)/0.5)] scale-110'
                : 'bg-card hover:bg-primary/20 shadow-lg'
            )}
          >
            <img
              src={lampadaIcon}
              alt="Gerar exercícios"
              className={cn(
                'h-9 w-9 object-contain transition-all duration-300',
                (isGeneratePage || lampLit) ? 'brightness-150 drop-shadow-[0_0_8px_rgba(245,200,66,0.8)]' : 'opacity-70'
              )}
            />
          </button>
        </div>

        {NAV_ITEMS_RIGHT.map(renderItem)}
      </div>
    </nav>
  );
}
