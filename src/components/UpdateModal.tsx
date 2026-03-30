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
      <DialogContent className="max-w-md mx-auto rounded-2xl border-primary/30 p-0 overflow-hidden">
        <div className="bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-primary/25 flex items-center justify-center mx-auto mb-4 ring-4 ring-primary/10">
            <Sparkles className="h-10 w-10 text-primary" />
          </div>
          <DialogHeader className="items-center gap-2">
            <DialogTitle className="font-display text-2xl font-bold text-foreground">
              Maluz atualizado! ✨
            </DialogTitle>
            <DialogDescription className="text-base text-muted-foreground">
              Versão {CURRENT_VERSION} — veja o que há de novo
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-8 pb-8 pt-4">
          <ul className="space-y-3 mb-6">
            {changes.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-base text-foreground/85">
                <span className="shrink-0 mt-0.5 w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center text-[10px] font-bold text-primary">{i + 1}</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <Button
            onClick={handleDismiss}
            size="lg"
            className="w-full font-display font-bold rounded-full gap-2 h-12 text-base"
          >
            <RefreshCw className="h-5 w-5" />
            Entendi, vamos lá!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
