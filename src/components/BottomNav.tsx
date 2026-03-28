import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Users, Trophy, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { path: '/', icon: Home, label: 'Início' },
  { path: '/perfis', icon: Users, label: 'Perfis' },
  { path: '/resultado', icon: Trophy, label: 'Resultado' },
  { path: '/instalar', icon: Download, label: 'Instalar' },
];

export function BottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  if (['/exercicios', '/confirmacao', '/login', '/landing'].includes(pathname)) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-primary/15 bg-card/95 backdrop-blur-md safe-bottom">
      <div className="mx-auto flex max-w-lg items-stretch justify-around">
        {NAV_ITEMS.map(({ path, icon: Icon, label }) => {
          const active = pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={cn(
                'flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors font-mono',
                active
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className={cn('h-5 w-5 transition-transform', active && 'scale-110')} />
              <span>{label}</span>
              {active && (
                <span className="absolute top-0 h-0.5 w-8 rounded-b-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
