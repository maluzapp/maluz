import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RefreshCw, Download } from 'lucide-react';

const CHECK_INTERVAL = 60 * 1000; // 60s
const VERSION_KEY = 'maluz_build_hash';

/**
 * Detecta nova versão do app comparando o hash do bundle no index.html.
 * Quando encontra, abre um MODAL bloqueante (não toast) pedindo atualização.
 */
export function NewVersionModal() {
  const [open, setOpen] = useState(false);
  const newHashRef = useRef<string | null>(null);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (!isStandalone && !isMobile) return;

    let cancelled = false;

    const extractHash = (html: string): string => {
      const match = html.match(/\/assets\/index-([a-zA-Z0-9]+)\.js/);
      return match?.[1] ?? '';
    };

    const checkUpdate = async () => {
      if (cancelled || open) return;
      try {
        const res = await fetch('/?_t=' + Date.now(), {
          cache: 'no-store',
          headers: { Accept: 'text/html' },
        });
        if (!res.ok) return;
        const html = await res.text();
        const newHash = extractHash(html);
        if (!newHash) return;

        const stored = localStorage.getItem(VERSION_KEY);
        if (!stored) {
          localStorage.setItem(VERSION_KEY, newHash);
          return;
        }
        if (stored !== newHash) {
          newHashRef.current = newHash;
          setOpen(true);
        }
      } catch {
        // silencioso
      }
    };

    const initialTimer = setTimeout(checkUpdate, 5000);
    const interval = setInterval(checkUpdate, CHECK_INTERVAL);
    return () => {
      cancelled = true;
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [open]);

  const handleUpdate = () => {
    if (newHashRef.current) {
      localStorage.setItem(VERSION_KEY, newHashRef.current);
    }
    // limpa caches do SW (se houver) antes de recarregar
    if ('caches' in window) {
      caches.keys().then((keys) => keys.forEach((k) => caches.delete(k))).finally(() => {
        window.location.reload();
      });
    } else {
      window.location.reload();
    }
  };

  const handleLater = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleLater(); }}>
      <DialogContent
        className="max-w-sm mx-auto rounded-3xl border-primary/30 p-0 overflow-hidden"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <div className="bg-gradient-to-br from-primary/25 via-primary/10 to-transparent p-8 text-center">
          <div className="relative w-24 h-24 mx-auto mb-4">
            <span className="absolute inset-0 rounded-full bg-primary/30 blur-xl animate-pulse" />
            <div className="relative w-full h-full rounded-full bg-primary/20 ring-4 ring-primary/15 flex items-center justify-center">
              <span
                className="text-5xl"
                style={{
                  filter:
                    'drop-shadow(0 2px 0 rgba(0,0,0,0.35)) drop-shadow(0 0 16px hsl(var(--primary) / 0.7))',
                }}
              >
                🚀
              </span>
            </div>
          </div>
          <DialogHeader className="items-center gap-2">
            <DialogTitle className="font-display text-2xl font-bold text-foreground">
              Nova versão disponível!
            </DialogTitle>
            <DialogDescription className="text-base text-muted-foreground">
              Atualize agora para ter as últimas melhorias, correções e novidades do Maluz.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 pb-6 pt-2 space-y-3">
          <Button
            onClick={handleUpdate}
            size="lg"
            className="w-full font-display font-bold rounded-full gap-2 h-12 text-base shadow-[0_0_20px_hsl(var(--primary)/0.5)]"
          >
            <Download className="h-5 w-5" />
            Atualizar agora
          </Button>
          <Button
            onClick={handleLater}
            variant="ghost"
            size="lg"
            className="w-full font-display font-bold rounded-full gap-2 h-11 text-sm text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="h-4 w-4" />
            Mais tarde
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
