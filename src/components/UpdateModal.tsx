import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, RefreshCw } from 'lucide-react';

const APP_VERSION_KEY = 'maluz_app_version';
const CURRENT_VERSION = '1.1.0';

const CHANGELOG: Record<string, string[]> = {
  '1.1.0': [
    '🎨 Visual renovado e mais fluido',
    '👫 Aba social: veja atividades dos amigos',
    '🏅 Badge Pro no perfil',
    '📧 Emails personalizados com sua marca',
    '⚡ Melhorias de performance',
  ],
};

export function UpdateModal() {
  const [open, setOpen] = useState(false);
  const [isNew, setIsNew] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(APP_VERSION_KEY);
    if (!stored) {
      // First visit — don't show modal, just store version
      localStorage.setItem(APP_VERSION_KEY, CURRENT_VERSION);
      return;
    }
    if (stored !== CURRENT_VERSION) {
      setIsNew(true);
      setOpen(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(APP_VERSION_KEY, CURRENT_VERSION);
    setOpen(false);
  };

  if (!isNew) return null;

  const changes = CHANGELOG[CURRENT_VERSION] ?? [];

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleDismiss(); }}>
      <DialogContent className="max-w-sm mx-auto rounded-2xl border-primary/20">
        <DialogHeader className="text-center items-center gap-2">
          <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-1">
            <Sparkles className="h-7 w-7 text-primary" />
          </div>
          <DialogTitle className="font-display text-xl font-bold text-foreground">
            Maluz atualizado! ✨
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Versão {CURRENT_VERSION} — veja o que há de novo
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-2 py-3">
          {changes.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
              <span className="shrink-0 mt-0.5">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <Button
          onClick={handleDismiss}
          size="lg"
          className="w-full font-display font-bold rounded-full gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Entendi, vamos lá!
        </Button>
      </DialogContent>
    </Dialog>
  );
}
