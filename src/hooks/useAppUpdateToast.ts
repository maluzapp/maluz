import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

const CHECK_INTERVAL = 60 * 1000; // check every 60s
const VERSION_KEY = 'maluz_build_hash';

/**
 * Periodically fetches index.html to detect if the deployed app changed.
 * When a new version is found, shows a toast prompting the user to reload.
 */
export function useAppUpdateToast() {
  const shownRef = useRef(false);

  useEffect(() => {
    // Only run in standalone PWA or mobile browser
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true;

    // Also run on regular mobile browsers
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (!isStandalone && !isMobile) return;

    let cancelled = false;

    const extractHash = (html: string): string => {
      // Look for the main JS bundle hash in script tags
      const match = html.match(/\/assets\/index-([a-zA-Z0-9]+)\.js/);
      return match?.[1] ?? '';
    };

    const checkUpdate = async () => {
      if (cancelled || shownRef.current) return;
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
        if (stored !== newHash && !shownRef.current) {
          shownRef.current = true;
          toast('🆕 Nova versão disponível!', {
            description: 'Atualize para ter as últimas melhorias.',
            duration: Infinity,
            action: {
              label: 'Atualizar',
              onClick: () => {
                localStorage.setItem(VERSION_KEY, newHash);
                window.location.reload();
              },
            },
          });
        }
      } catch {
        // Network error — ignore silently
      }
    };

    // First check after a short delay
    const initialTimer = setTimeout(checkUpdate, 5000);
    const interval = setInterval(checkUpdate, CHECK_INTERVAL);

    return () => {
      cancelled = true;
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, []);
}
