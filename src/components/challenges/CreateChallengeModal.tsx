import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sparkles, Send, Share2, Loader2, ArrowLeft, GraduationCap, MessageCircle, User, Brain, CheckCircle2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useProfileStore } from '@/hooks/useProfile';
import { YEAR_OPTIONS } from '@/constants/years';
import type { SchoolYear, Subject } from '@/types/study';
import { SUBJECTS, SUBJECT_EMOJIS } from '@/constants/subjects';

interface Props {
  children: { id: string; name: string; avatar_emoji: string; school_year: string | null }[];
  onClose: () => void;
  onCreated: () => void;
}

export function CreateChallengeModal({ children, onClose, onCreated }: Props) {
  const profileId = useProfileStore((s) => s.activeProfileId);
  const [step, setStep] = useState<'form' | 'review'>('form');
  const [childId, setChildId] = useState('');
  const [subject, setSubject] = useState<Subject | ''>('');
  const [topic, setTopic] = useState('');
  const [year, setYear] = useState<SchoolYear | ''>('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [parentName, setParentName] = useState('');

  // AI summary state
  const [analyzing, setAnalyzing] = useState(false);
  const [aiSummary, setAiSummary] = useState<{ title: string; summary: string; keyPoints: string[] } | null>(null);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  // Fetch parent name
  useEffect(() => {
    if (!profileId) return;
    supabase.from('profiles').select('name').eq('id', profileId).single().then(({ data }) => {
      if (data) setParentName(data.name);
    });
  }, [profileId]);

  // Auto-set year from child selection
  const handleChildChange = (id: string) => {
    setChildId(id);
    const child = children.find(c => c.id === id);
    if (child?.school_year) setYear(child.school_year as SchoolYear);
  };

  const canSubmit = childId && subject && topic && year;
  const selectedChild = children.find(c => c.id === childId);
  const yearLabel = YEAR_OPTIONS.find(y => y.value === year)?.label || year;

  const runAnalysis = async () => {
    if (!canSubmit) return;
    setAnalyzing(true);
    setAnalyzeError(null);
    setAiSummary(null);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-content', {
        body: { year, subject, topic },
      });
      if (error || !data?.summary) {
        setAnalyzeError('Não conseguimos gerar o resumo. Tente novamente.');
      } else {
        setAiSummary(data.summary);
      }
    } catch {
      setAnalyzeError('Erro inesperado ao analisar conteúdo.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleReview = async () => {
    if (!canSubmit) return;
    setStep('review');
    if (!aiSummary) await runAnalysis();
  };

  const handleSend = async (shareVia?: 'whatsapp') => {
    if (!canSubmit || !profileId) return;
    setSending(true);

    try {
      // Generate exercises via edge function (use AI keyPoints if available)
      const { data: genData, error: genError } = await supabase.functions.invoke('generate-exercises', {
        body: { year, subject, topic, keyPoints: aiSummary?.keyPoints?.length ? aiSummary.keyPoints : [topic] },
      });

      if (genError || !genData?.exercises) {
        toast.error('Erro ao gerar exercícios. Tente novamente.');
        setSending(false);
        return;
      }

      // Create challenge in DB
      const { error: insertError } = await supabase.from('challenges' as any).insert({
        parent_profile_id: profileId,
        child_profile_id: childId,
        subject,
        topic,
        year,
        exercises_data: genData.exercises,
        total: genData.exercises.length,
        message: message.trim() || null,
      });

      if (insertError) {
        toast.error('Erro ao criar desafio');
        setSending(false);
        return;
      }

      toast.success('Desafio enviado! 🎯');

      if (shareVia === 'whatsapp') {
        const childName = selectedChild?.name || '';
        const e = {
          bulb: String.fromCodePoint(0x1F4A1),
          target: String.fromCodePoint(0x1F3AF),
          book: String.fromCodePoint(0x1F4D6),
          speech: String.fromCodePoint(0x1F4AC),
          rocket: String.fromCodePoint(0x1F680),
        };
        const senderLabel = parentName || 'seu pai/mãe';
        const lines = [
          e.bulb + ' *Maluz \u2014 Novo Desafio!*',
          '',
          e.target + ' ' + childName + ', ' + senderLabel + ' mandou um desafio para voc\u00ea!',
          e.book + ' ' + subject + ' \u2014 ' + topic,
          message ? (e.speech + ' "' + message + '"') : '',
          '',
          e.rocket + ' Abra o Maluz e mostre que voc\u00ea sabe!',
          'https://maluz.app',
        ].filter(Boolean).join('\n');
        const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        const url = isMobile
          ? 'https://api.whatsapp.com/send?text=' + encodeURIComponent(lines)
          : 'https://web.whatsapp.com/send?text=' + encodeURIComponent(lines);
        window.open(url, '_blank');
      }

      onCreated();
    } catch {
      toast.error('Erro inesperado');
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open onOpenChange={() => !sending && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            {step === 'review' && (
              <button
                onClick={() => !sending && setStep('form')}
                className="rounded-md p-1 hover:bg-muted transition-colors"
                disabled={sending}
                aria-label="Voltar"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <Sparkles className="h-5 w-5 text-primary" />
            {step === 'form' ? 'Criar Desafio' : 'Confirmar Desafio'}
          </DialogTitle>
        </DialogHeader>

        {step === 'form' && (
          <div className="space-y-4">
            <div>
              <Label className="mb-1.5 block text-sm font-semibold">Para quem?</Label>
              <Select value={childId} onValueChange={handleChildChange}>
                <SelectTrigger><SelectValue placeholder="Selecione o filho" /></SelectTrigger>
                <SelectContent>
                  {children.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.avatar_emoji} {c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-1.5 block text-sm font-semibold">Ano escolar</Label>
              <Select value={year} onValueChange={(v) => setYear(v as SchoolYear)}>
                <SelectTrigger><SelectValue placeholder="Selecione o ano" /></SelectTrigger>
                <SelectContent>
                  {YEAR_OPTIONS.map(y => (
                    <SelectItem key={y.value} value={y.value}>{y.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-1.5 block text-sm font-semibold">Matéria</Label>
              <Select value={subject} onValueChange={(v) => setSubject(v as Subject)}>
                <SelectTrigger><SelectValue placeholder="Selecione a matéria" /></SelectTrigger>
                <SelectContent>
                  {SUBJECTS.map(s => (
                    <SelectItem key={s} value={s}>{SUBJECT_EMOJIS[s]} {s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-1.5 block text-sm font-semibold">Assunto</Label>
              <Input placeholder="Ex: Equações do 1º grau" value={topic} onChange={e => setTopic(e.target.value)} />
            </div>

            <div>
              <Label className="mb-1.5 block text-sm font-semibold">Mensagem (opcional)</Label>
              <Textarea
                placeholder="Ex: Vamos revisar o que vimos ontem!"
                value={message}
                onChange={e => setMessage(e.target.value)}
                className="resize-none h-20"
                maxLength={200}
              />
            </div>

            <div className="pt-2">
              <Button className="w-full gap-2" disabled={!canSubmit} onClick={handleReview}>
                Revisar desafio
                <Sparkles className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {step === 'review' && (
          <div className="space-y-4">
            {/* Hero summary card */}
            <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/20 blur-2xl" />
              <div className="relative flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/40 to-primary/10 ring-1 ring-primary/40 text-3xl shadow-lg">
                  {SUBJECT_EMOJIS[subject as Subject]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-primary/80">Novo Desafio</p>
                  <p className="font-display text-base font-bold text-foreground truncate">{topic}</p>
                  <p className="text-xs text-muted-foreground">{subject} • {yearLabel}</p>
                </div>
              </div>
            </div>

            {/* AI Summary card — what the IA understood */}
            <div className="relative overflow-hidden rounded-2xl border border-[hsl(160,94%,58%)]/30 bg-gradient-to-br from-[hsl(160,84%,30%)]/15 via-[hsl(160,84%,30%)]/5 to-transparent p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[hsl(160,94%,58%)]/20 ring-1 ring-[hsl(160,94%,58%)]/40">
                    <Brain className="h-4 w-4 text-[hsl(160,94%,68%)]" />
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[hsl(160,94%,68%)]">
                    O que a IA entendeu
                  </p>
                </div>
                {!analyzing && aiSummary && (
                  <button
                    onClick={runAnalysis}
                    disabled={sending}
                    className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
                  >
                    <RefreshCw className="h-3 w-3" /> Refazer
                  </button>
                )}
              </div>

              {analyzing && (
                <div className="space-y-2 py-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin text-[hsl(160,94%,68%)]" />
                    Analisando o assunto…
                  </div>
                  <div className="space-y-1.5">
                    <div className="h-2.5 w-3/4 animate-pulse rounded bg-foreground/10" />
                    <div className="h-2.5 w-full animate-pulse rounded bg-foreground/10" />
                    <div className="h-2.5 w-2/3 animate-pulse rounded bg-foreground/10" />
                  </div>
                </div>
              )}

              {!analyzing && analyzeError && (
                <div className="space-y-2">
                  <p className="text-sm text-destructive">{analyzeError}</p>
                  <Button size="sm" variant="outline" onClick={runAnalysis} className="gap-1.5">
                    <RefreshCw className="h-3 w-3" /> Tentar novamente
                  </Button>
                </div>
              )}

              {!analyzing && aiSummary && (
                <div className="space-y-3">
                  <div>
                    <p className="font-display text-sm font-bold text-foreground">{aiSummary.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-foreground/85">{aiSummary.summary}</p>
                  </div>
                  {aiSummary.keyPoints?.length > 0 && (
                    <div>
                      <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Pontos abordados
                      </p>
                      <ul className="space-y-1.5">
                        {aiSummary.keyPoints.map((kp, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-foreground/90">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(160,94%,68%)]" />
                            <span>{kp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Detail rows */}
            <div className="space-y-2.5 rounded-xl border border-border/60 bg-card/40 p-3">
              <ReviewRow icon={<User className="h-4 w-4 text-primary" />} label="Para">
                <span className="font-semibold">{selectedChild?.avatar_emoji} {selectedChild?.name}</span>
              </ReviewRow>
              <ReviewRow icon={<GraduationCap className="h-4 w-4 text-primary" />} label="Ano">
                <span className="font-semibold">{yearLabel}</span>
              </ReviewRow>
              <ReviewRow icon={<Sparkles className="h-4 w-4 text-primary" />} label="Exercícios">
                <span className="font-semibold">10 atividades adaptadas ao resumo acima</span>
              </ReviewRow>
              {message && (
                <ReviewRow icon={<MessageCircle className="h-4 w-4 text-primary" />} label="Mensagem">
                  <span className="italic text-foreground/90">"{message}"</span>
                </ReviewRow>
              )}
            </div>

            <p className="text-center text-xs text-muted-foreground px-2">
              Confira o resumo acima. Se a IA entendeu corretamente, confirme para gerar os exercícios e enviar para <span className="font-semibold text-foreground">{selectedChild?.name}</span>.
            </p>

            <div className="flex gap-2 pt-1">
              <Button className="flex-1 gap-2" disabled={sending || analyzing || !aiSummary} onClick={() => handleSend()}>
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {sending ? 'Gerando...' : 'Confirmar e enviar'}
              </Button>
              <Button variant="outline" className="gap-2" disabled={sending || analyzing || !aiSummary} onClick={() => handleSend('whatsapp')}>
                <Share2 className="h-4 w-4" /> WhatsApp
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ReviewRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 text-sm">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
        <div className="text-foreground/95 break-words">{children}</div>
      </div>
    </div>
  );
}
