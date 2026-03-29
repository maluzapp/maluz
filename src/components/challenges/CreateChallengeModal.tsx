import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sparkles, Send, Share2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useProfileStore } from '@/hooks/useProfile';
import { YEAR_OPTIONS } from '@/constants/years';
import type { SchoolYear, Subject } from '@/types/study';

const SUBJECTS: Subject[] = ['Matemática', 'Português', 'Ciências', 'História', 'Geografia', 'Inglês', 'Artes', 'Educação Física'];
const SUBJECT_EMOJIS: Record<Subject, string> = {
  'Matemática': '🔢', 'Português': '📝', 'Ciências': '🔬', 'História': '🏛️',
  'Geografia': '🌍', 'Inglês': '🇬🇧', 'Artes': '🎨', 'Educação Física': '⚽',
};

interface Props {
  children: { id: string; name: string; avatar_emoji: string; school_year: string | null }[];
  onClose: () => void;
  onCreated: () => void;
}

export function CreateChallengeModal({ children, onClose, onCreated }: Props) {
  const profileId = useProfileStore((s) => s.activeProfileId);
  const [childId, setChildId] = useState('');
  const [subject, setSubject] = useState<Subject | ''>('');
  const [topic, setTopic] = useState('');
  const [year, setYear] = useState<SchoolYear | ''>('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  // Auto-set year from child selection
  const handleChildChange = (id: string) => {
    setChildId(id);
    const child = children.find(c => c.id === id);
    if (child?.school_year) setYear(child.school_year as SchoolYear);
  };

  const canSubmit = childId && subject && topic && year;

  const handleSend = async (shareVia?: 'whatsapp') => {
    if (!canSubmit || !profileId) return;
    setSending(true);

    try {
      // Generate exercises via edge function
      const { data: genData, error: genError } = await supabase.functions.invoke('generate-exercises', {
        body: { year, subject, topic, keyPoints: [topic] },
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
        const childName = children.find(c => c.id === childId)?.name || '';
        const text = `💡 *Maluz — Novo Desafio!*\n\n🎯 ${childName}, seu pai/mãe mandou um desafio para você!\n📖 ${subject} — ${topic}\n${message ? `💬 "${message}"\n` : ''}\n🚀 Abra o Maluz e mostre que você sabe!\n👉 https://maluz.app`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
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
            <Sparkles className="h-5 w-5 text-primary" /> Criar Desafio
          </DialogTitle>
        </DialogHeader>

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

          <div className="flex gap-2 pt-2">
            <Button className="flex-1 gap-2" disabled={!canSubmit || sending} onClick={() => handleSend()}>
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Enviar pelo app
            </Button>
            <Button variant="outline" className="gap-2" disabled={!canSubmit || sending} onClick={() => handleSend('whatsapp')}>
              <Share2 className="h-4 w-4" /> WhatsApp
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
