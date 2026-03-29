import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, Share, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function Install() {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(ua));

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setIsInstalled(true);
      setDeferredPrompt(null);
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <div className="max-w-sm mx-auto">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
        </Button>

        <div className="text-center mb-6">
          <div className="text-5xl mb-3">📲</div>
          <h1 className="font-display text-2xl font-bold text-foreground">Instalar Maluz</h1>
          <p className="text-muted-foreground mt-2">
            Instale no celular para usar como um app de verdade!
          </p>
        </div>

        {isInstalled ? (
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-4xl mb-3">✅</div>
              <p className="font-display font-bold text-foreground">App já instalado!</p>
              <p className="text-sm text-muted-foreground mt-1">
                Procure o ícone do StudyApp na tela inicial.
              </p>
            </CardContent>
          </Card>
        ) : deferredPrompt ? (
          <Card>
            <CardContent className="p-6">
              <Button size="lg" className="w-full gap-2 font-display font-bold" onClick={handleInstall}>
                <Download className="h-5 w-5" />
                Instalar agora
              </Button>
            </CardContent>
          </Card>
        ) : isIOS ? (
          <Card>
            <CardContent className="p-6 space-y-4">
              <p className="font-display font-bold text-foreground text-center">No iPhone / iPad:</p>
              <ol className="space-y-3 text-sm text-muted-foreground">
                <li className="flex gap-3 items-start">
                  <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">1</span>
                  <span>Toque no botão <Share className="inline h-4 w-4 text-primary" /> <strong>Compartilhar</strong> na barra do Safari</span>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">2</span>
                  <span>Role para baixo e toque em <strong>"Adicionar à Tela de Início"</strong></span>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">3</span>
                  <span>Toque em <strong>"Adicionar"</strong> no canto superior direito</span>
                </li>
              </ol>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6 space-y-4">
              <p className="font-display font-bold text-foreground text-center">No Android:</p>
              <ol className="space-y-3 text-sm text-muted-foreground">
                <li className="flex gap-3 items-start">
                  <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">1</span>
                  <span>Toque no menu <strong>⋮</strong> (três pontos) do Chrome</span>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">2</span>
                  <span>Toque em <strong>"Adicionar à tela inicial"</strong></span>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">3</span>
                  <span>Confirme tocando em <strong>"Adicionar"</strong></span>
                </li>
              </ol>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
