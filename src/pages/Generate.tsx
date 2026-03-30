import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Mic, MicOff, Sparkles, X, Crown, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStudyStore } from '@/store/study-store';
import { GamificationBar } from '@/components/GamificationBar';
import { useProfileStore } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { YEAR_OPTIONS } from '@/constants/years';
import { useCanStartSession, usePlanLimits } from '@/hooks/useSubscription';
import { UpgradePrompt } from '@/components/UpgradePrompt';
import lampadaIcon from '@/assets/lampada-2.png';
import type { SchoolYear, Subject } from '@/types/study';

const SUBJECTS: Subject[] = ['Matemática', 'Português', 'Ciências', 'História', 'Geografia', 'Inglês', 'Artes', 'Educação Física'];

const SUBJECT_EMOJIS: Record<Subject, string> = {
  'Matemática': '🔢',
  'Português': '📝',
  'Ciências': '🔬',
  'História': '🏛️',
  'Geografia': '🌍',
  'Inglês': '🇬🇧',
  'Artes': '🎨',
  'Educação Física': '⚽',
};

export default function Generate() {
  const navigate = useNavigate();
  const { setConfig, setLoading } = useStudyStore();
  const [year, setYear] = useState<SchoolYear | ''>('');
  const activeProfileId = useProfileStore((s) => s.activeProfileId);
  const { canStart } = useCanStartSession();
  const { maxPhotos, canUseAudio } = usePlanLimits();

  useEffect(() => {
    if (!activeProfileId) return;
    supabase
      .from('profiles')
      .select('school_year')
      .eq('id', activeProfileId)
      .single()
      .then(({ data }) => {
        if (data?.school_year) setYear(data.school_year as SchoolYear);
      });
  }, [activeProfileId]);

  const [subject, setSubject] = useState<Subject | ''>('');
  const [topic, setTopic] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files);
    if (maxPhotos !== null) {
      const remaining = maxPhotos - images.length;
      if (remaining <= 0) return;
      setImages((prev) => [...prev, ...newFiles.slice(0, remaining)]);
    } else {
      setImages((prev) => [...prev, ...newFiles]);
    }
  };
  };

  const removeImage = (index: number) => setImages((prev) => prev.filter((_, i) => i !== index));

  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach((t) => t.stop());
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch {
      console.error('Microphone access denied');
    }
  };

  const canSubmit = year && subject && topic;

  const handleSubmit = () => {
    if (!canSubmit) return;
    setConfig({
      year: year as SchoolYear,
      subject: subject as Subject,
      topic,
      images,
      audioBlob: audioBlob || undefined,
    });
    setLoading(true);
    navigate('/confirmacao');
  };

  return (
    <div className="min-h-screen bg-background px-4 py-6 pb-28 md:pb-36">
      <div className="mx-auto max-w-lg">
        <div className="mb-4">
          <GamificationBar />
        </div>

        {!canStart && (
          <div className="mb-6">
            <UpgradePrompt />
          </div>
        )}

        <div className={`mb-8 text-center animate-fade-in ${!canStart ? 'opacity-50 pointer-events-none' : ''}`}>
          <img src={lampadaIcon} alt="Maluz" className="h-16 mx-auto mb-3" />
          <h1 className="font-display text-3xl font-bold text-foreground">
            Acenda a <span className="text-primary italic">luz</span> do saber! 💡
          </h1>
          <p className="mt-2 text-muted-foreground font-body">
            Vamos clarear as dúvidas? A Maluz cria exercícios sob medida ✨
          </p>
        </div>

        <div className="space-y-5">
          <Card className="animate-fade-in border-primary/10" style={{ animationDelay: '100ms' }}>
            <CardContent className="p-4">
              <Label className="mb-2 block font-semibold font-display">Ano escolar</Label>
              <Select value={year} onValueChange={(v) => setYear(v as SchoolYear)}>
                <SelectTrigger><SelectValue placeholder="Selecione o ano" /></SelectTrigger>
                <SelectContent>
                  {YEAR_OPTIONS.map((y) => (
                    <SelectItem key={y.value} value={y.value}>{y.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card className="animate-fade-in border-primary/10" style={{ animationDelay: '200ms' }}>
            <CardContent className="p-4">
              <Label className="mb-2 block font-semibold font-display">Matéria</Label>
              <Select value={subject} onValueChange={(v) => setSubject(v as Subject)}>
                <SelectTrigger><SelectValue placeholder="Selecione a matéria" /></SelectTrigger>
                <SelectContent>
                  {SUBJECTS.map((s) => (
                    <SelectItem key={s} value={s}>{SUBJECT_EMOJIS[s]} {s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card className="animate-fade-in border-primary/10" style={{ animationDelay: '300ms' }}>
            <CardContent className="p-4">
              <Label className="mb-2 block font-semibold font-display">Assunto</Label>
              <Input placeholder="Ex: Equações do 1º grau, Revolução Francesa..." value={topic} onChange={(e) => setTopic(e.target.value)} />
            </CardContent>
          </Card>

          <Card className="animate-fade-in border-primary/10" style={{ animationDelay: '400ms' }}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Label className="font-semibold font-display">{'\u{1F4F7}'} Fotos do livro (opcional)</Label>
                {maxPhotos !== null && (
                  <span className="text-[0.65rem] text-muted-foreground font-mono">
                    {images.length}/{maxPhotos}
                  </span>
                )}
              </div>
              <p className="mb-3 text-sm text-muted-foreground">Tire foto ou envie imagens das páginas</p>
              <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => fileInputRef.current?.click()}
                disabled={maxPhotos !== null && images.length >= maxPhotos}
              >
                <Camera className="h-4 w-4" /> Adicionar fotos
              </Button>
              {maxPhotos !== null && images.length >= maxPhotos && (
                <div className="mt-2 flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-xs text-primary">
                  <Crown className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>Limite de {maxPhotos} fotos no plano Free. <button onClick={() => navigate('/login')} className="underline font-bold">Upgrade para Pro</button> para fotos ilimitadas.</span>
                </div>
              )}
              {images.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {images.map((img, i) => (
                    <div key={i} className="relative h-16 w-16 overflow-hidden rounded-md border animate-scale-in">
                      <img src={URL.createObjectURL(img)} alt={`Página ${i + 1}`} className="h-full w-full object-cover" />
                      <button onClick={() => removeImage(i)} className="absolute -right-1 -top-1 rounded-full bg-destructive p-0.5 text-destructive-foreground">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className={`animate-fade-in border-primary/10 ${!canUseAudio ? 'opacity-75' : ''}`} style={{ animationDelay: '500ms' }}>
            <CardContent className="p-4 relative">
              {!canUseAudio && (
                <div className="absolute top-3 right-3 flex items-center gap-1 bg-primary/15 text-primary text-[0.6rem] font-bold px-2 py-0.5 rounded-full font-mono uppercase tracking-wider">
                  <Crown className="h-3 w-3" /> PRO
                </div>
              )}
              <Label className="mb-2 block font-semibold font-display">{'\u{1F3A4}'} Áudio com resumo {canUseAudio ? '(opcional)' : ''}</Label>
              {canUseAudio ? (
                <>
                  <p className="mb-3 text-sm text-muted-foreground">Grave um resumo da matéria com suas palavras</p>
                  <Button variant={isRecording ? 'destructive' : 'outline'} className="w-full gap-2" onClick={toggleRecording}>
                    {isRecording ? (<><MicOff className="h-4 w-4" /> Parar gravação</>) : (<><Mic className="h-4 w-4" /> {audioBlob ? 'Regravar áudio' : 'Gravar áudio'}</>)}
                  </Button>
                  {audioBlob && !isRecording && (
                    <div className="mt-3 flex items-center gap-2 rounded-md bg-success/10 px-3 py-2 text-sm text-success animate-fade-in">
                      {'\u2705'} Áudio gravado com sucesso
                    </div>
                  )}
                </>
              ) : (
                <>
                  <p className="mb-3 text-sm text-muted-foreground">Grave um resumo da matéria — recurso exclusivo do plano Pro</p>
                  <Button variant="outline" className="w-full gap-2" disabled>
                    <Lock className="h-4 w-4" /> Gravar áudio
                  </Button>
                  <div className="mt-2 flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-xs text-primary">
                    <Crown className="h-3.5 w-3.5 flex-shrink-0" />
                    <span><button onClick={() => navigate('/login')} className="underline font-bold">Faça upgrade para Pro</button> e desbloqueie o envio de áudio.</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Button size="lg" className="w-full gap-2 font-display text-lg font-bold animate-fade-in" style={{ animationDelay: '600ms' }} disabled={!canSubmit} onClick={handleSubmit}>
            <Sparkles className="h-5 w-5" /> Gerar Exercícios ✨
          </Button>
        </div>
      </div>
    </div>
  );
}
