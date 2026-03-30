import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import lampadaIcon from '@/assets/lampada-2.png';

export default function Credits() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background px-4 py-6 pb-28 md:pb-36">
      <div className="max-w-sm mx-auto">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
        </Button>

        <div className="text-center mb-6">
          <img src={lampadaIcon} alt="Maluz" className="h-16 w-16 mx-auto mb-3 object-contain" />
          <h1 className="font-display text-2xl font-bold text-foreground">Maluz</h1>
          <p className="text-primary text-sm font-medium mt-1">O conhecimento que ilumina</p>
        </div>

        <div className="space-y-4">
          <Card className="border-primary/10">
            <CardContent className="p-5 space-y-3">
              <h2 className="font-display font-bold text-foreground">Sobre o Maluz</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Maluz é uma plataforma educacional que gera exercícios personalizados para estudantes 
                do 6º ano do Ensino Fundamental ao 3º ano do Ensino Médio, ajudando cada aluno a 
                aprender no seu próprio ritmo.
              </p>
            </CardContent>
          </Card>

          <Card className="border-primary/10">
            <CardContent className="p-5 space-y-3">
              <h2 className="font-display font-bold text-foreground">Termos de Uso</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Ao utilizar o Maluz, você concorda com nossos termos de uso. O conteúdo gerado 
                tem caráter educacional complementar e não substitui o ensino formal. Os dados 
                dos usuários são protegidos conforme a LGPD (Lei Geral de Proteção de Dados).
              </p>
            </CardContent>
          </Card>

          <Card className="border-primary/10">
            <CardContent className="p-5 space-y-3">
              <h2 className="font-display font-bold text-foreground">Privacidade</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Respeitamos sua privacidade. Coletamos apenas os dados necessários para o 
                funcionamento da plataforma. Dados de menores são tratados com proteção 
                reforçada conforme legislação vigente. Não compartilhamos informações 
                pessoais com terceiros.
              </p>
            </CardContent>
          </Card>

          <Card className="border-primary/10">
            <CardContent className="p-5 space-y-3">
              <h2 className="font-display font-bold text-foreground">Créditos</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Desenvolvido com 💛 para transformar a educação brasileira.
              </p>
              <p className="text-xs text-muted-foreground">
                © {new Date().getFullYear()} Maluz. Todos os direitos reservados.
              </p>
            </CardContent>
          </Card>

          <a
            href="/"
            className="block text-center text-sm text-primary font-medium hover:underline transition-colors py-3"
          >
            Conheça mais sobre o Maluz →
          </a>
        </div>
      </div>
    </div>
  );
}
