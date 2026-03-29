import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Loader2, Sparkles, Plus, X, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useStudyStore } from '@/store/study-store';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function Confirmation() {
  const navigate = useNavigate();
  const { config, summary, setSummary, setExercises, isLoading, setLoading } = useStudyStore();
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editSummary, setEditSummary] = useState('');
  const [editKeyPoints, setEditKeyPoints] = useState<string[]>([]);
  const [newPoint, setNewPoint] = useState('');

  useEffect(() => {
    if (!config) {
      navigate('/inicio');
      return;
    }
    if (!summary) {
      analyzeTopic();
    }
  }, []);

  useEffect(() => {
    if (summary) {
      setEditTitle(summary.title);
      setEditSummary(summary.summary);
      setEditKeyPoints([...summary.keyPoints]);
    }
  }, [summary]);

  const analyzeTopic = async () => {
    if (!config) return;
    setLoading(true);
    try {
      const imageBase64s: string[] = [];
      for (const img of config.images) {
        const reader = new FileReader();
        const b64 = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(img);
        });
        imageBase64s.push(b64);
      }

      let audioBase64: string | undefined;
      if (config.audioBlob) {
        const reader = new FileReader();
        audioBase64 = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(config.audioBlob!);
        });
      }

      const { data, error } = await supabase.functions.invoke('analyze-content', {
        body: {
          year: config.year,
          subject: config.subject,
          topic: config.topic,
          images: imageBase64s,
          audio: audioBase64,
        },
      });

      if (error) throw error;
      setSummary(data.summary);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao analisar o conteúdo. Tente novamente.');
      setSummary({
        title: `${config!.subject} — ${config!.topic}`,
        summary: `Conteúdo sobre ${config!.topic} para o ${config!.year}º ano na matéria de ${config!.subject}.`,
        keyPoints: [config!.topic],
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdits = () => {
    setSummary({
      title: editTitle,
      summary: editSummary,
      keyPoints: editKeyPoints,
    });
    setEditing(false);
    toast.success('Conteúdo atualizado!');
  };

  const handleAddPoint = () => {
    if (!newPoint.trim()) return;
    setEditKeyPoints([...editKeyPoints, newPoint.trim()]);
    setNewPoint('');
  };

  const handleRemovePoint = (idx: number) => {
    setEditKeyPoints(editKeyPoints.filter((_, i) => i !== idx));
  };

  const handleGenerate = async () => {
    if (!config || !summary) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-exercises', {
        body: {
          year: config.year,
          subject: config.subject,
          topic: config.topic,
          summary: summary.summary,
          keyPoints: summary.keyPoints,
        },
      });

      if (error) throw error;
      setExercises(data.exercises);
      navigate('/exercicios');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao gerar exercícios. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (!config) return null;

  return (
    <div className="min-h-screen bg-background px-4 py-6 md:py-12">
      <div className="mx-auto max-w-lg">
        <Button variant="ghost" className="mb-4 gap-2" onClick={() => navigate('/inicio')}>
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>

        <h1 className="mb-2 font-display text-2xl font-bold text-foreground">
          Confirme o conteúdo 📋
        </h1>
        <p className="mb-6 text-muted-foreground">
          Revise e edite o conteúdo antes de gerar os exercícios
        </p>

        {isLoading && !summary ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 p-8">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-center text-muted-foreground">
                A Maluz está analisando o conteúdo...
              </p>
            </CardContent>
          </Card>
        ) : summary ? (
          <div className="space-y-4">
            <Card>
              <CardContent className="p-5">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                    {config.year}º ano • {config.subject}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 text-xs"
                    onClick={() => setEditing(!editing)}
                  >
                    <Pencil className="h-3 w-3" />
                    {editing ? 'Cancelar' : 'Editar'}
                  </Button>
                </div>

                {editing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-1 block">Título</label>
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-1 block">Resumo</label>
                      <Textarea
                        value={editSummary}
                        onChange={(e) => setEditSummary(e.target.value)}
                        rows={4}
                        className="rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-2 block">Pontos-chave</label>
                      <div className="space-y-2">
                        {editKeyPoints.map((point, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <Input
                              value={point}
                              onChange={(e) => {
                                const updated = [...editKeyPoints];
                                updated[i] = e.target.value;
                                setEditKeyPoints(updated);
                              }}
                              className="rounded-xl flex-1"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive shrink-0"
                              onClick={() => handleRemovePoint(i)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <div className="flex gap-2">
                          <Input
                            placeholder="Adicionar ponto-chave..."
                            value={newPoint}
                            onChange={(e) => setNewPoint(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddPoint()}
                            className="rounded-xl flex-1"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 shrink-0"
                            onClick={handleAddPoint}
                            disabled={!newPoint.trim()}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    <Button className="w-full gap-2" onClick={handleSaveEdits}>
                      <CheckCircle className="h-4 w-4" /> Salvar alterações
                    </Button>
                  </div>
                ) : (
                  <>
                    <h2 className="mb-3 font-display text-xl font-bold text-foreground">
                      {summary.title}
                    </h2>
                    <p className="mb-4 text-foreground/80">{summary.summary}</p>

                    {summary.keyPoints.length > 0 && (
                      <div>
                        <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Pontos-chave:</h3>
                        <ul className="space-y-1.5">
                          {summary.keyPoints.map((point, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {config.images.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <p className="mb-2 text-sm font-semibold text-muted-foreground">
                    📷 {config.images.length} foto(s) enviada(s)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {config.images.map((img, i) => (
                      <div key={i} className="h-16 w-16 overflow-hidden rounded-md border">
                        <img
                          src={URL.createObjectURL(img)}
                          alt={`Página ${i + 1}`}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Button
              size="lg"
              className="w-full gap-2 font-display text-lg font-bold"
              onClick={handleGenerate}
              disabled={isLoading || editing}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Sparkles className="h-5 w-5" />
              )}
              {isLoading ? 'Gerando...' : 'Gerar Exercícios'}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
