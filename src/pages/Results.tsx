import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, XCircle, CheckCircle, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useStudyStore } from '@/store/study-store';

function getEmoji(pct: number) {
  if (pct >= 90) return '🏆';
  if (pct >= 70) return '🎉';
  if (pct >= 50) return '💪';
  return '📖';
}

function getMessage(pct: number) {
  if (pct >= 90) return 'Excelente! Você arrasou!';
  if (pct >= 70) return 'Muito bem! Continue assim!';
  if (pct >= 50) return 'Bom trabalho! Pode melhorar!';
  return 'Vamos revisar e tentar de novo!';
}

export default function Results() {
  const navigate = useNavigate();
  const { exercises, answers, config, reset } = useStudyStore();

  useEffect(() => {
    if (!config || exercises.length === 0) {
      navigate('/');
    }
  }, []);

  if (!config || exercises.length === 0) return null;

  const score = answers.filter((a) => a.isCorrect).length;
  const total = exercises.length;
  const pct = Math.round((score / total) * 100);

  const handleNewSession = () => {
    reset();
    navigate('/');
  };

  const handleRetry = () => {
    navigate('/confirmacao');
  };

  const handleShareWhatsApp = () => {
    const text = `📚 *StudyApp — Resultado do Estudo*\n\n📖 ${config.subject} — ${config.topic} (${config.year})\n🏆 Acertei *${score} de ${total}* (${pct}%)\n\n${getMessage(pct)}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-background px-4 py-6 md:py-12">
      <div className="mx-auto max-w-lg">
        {/* Score card */}
        <Card className="mb-6 overflow-hidden">
          <div className="bg-primary px-6 py-8 text-center text-primary-foreground">
            <div className="mb-2 text-5xl">{getEmoji(pct)}</div>
            <h1 className="font-display text-3xl font-bold">{pct}%</h1>
            <p className="mt-1 text-primary-foreground/80">{getMessage(pct)}</p>
            <div className="mt-4 flex justify-center gap-6 text-sm">
              <div className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4" />
                <span>{score} certas</span>
              </div>
              <div className="flex items-center gap-1">
                <XCircle className="h-4 w-4" />
                <span>{total - score} erradas</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Review wrong answers */}
        {answers.some((a) => !a.isCorrect) && (
          <div className="mb-6">
            <h2 className="mb-3 font-display text-lg font-bold text-foreground">
              📝 Revise seus erros
            </h2>
            <div className="space-y-3">
              {answers.filter((a) => !a.isCorrect).map((a) => {
                const ex = exercises[a.exerciseIndex];
                return (
                  <Card key={a.exerciseIndex}>
                    <CardContent className="p-4">
                      <p className="mb-1 text-sm font-semibold text-destructive">
                        ❌ Questão {a.exerciseIndex + 1}
                      </p>
                      <p className="mb-2 text-sm text-foreground">
                        {ex.type === 'multiple_choice' && ex.question}
                        {ex.type === 'true_false' && ex.statement}
                        {ex.type === 'fill_blank' && ex.sentence}
                        {ex.type === 'matching' && 'Associação de conceitos'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {ex.explanation}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <Button size="lg" className="w-full gap-2 font-display font-bold" onClick={handleRetry}>
            <RefreshCw className="h-4 w-4" />
            Gerar mais exercícios
          </Button>
          <Button size="lg" variant="outline" className="w-full gap-2" onClick={handleNewSession}>
            <ArrowLeft className="h-4 w-4" />
            Novo estudo
          </Button>
        </div>
      </div>
    </div>
  );
}
