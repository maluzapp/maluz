import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Camera, Mic, MicOff, Sparkles, X } from 'lucide-react';
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

export default function Index() {
  const navigate = useNavigate();
  const { setConfig, setLoading } = useStudyStore();
  const [year, setYear] = useState<SchoolYear | ''>('');
  const activeProfileId = useProfileStore((s) => s.activeProfileId);

  useEffect(() => {
    if (!activeProfileId) return;
    supabase
      .from('profiles')
      .select('school_year')
      .eq('id', activeProfileId)
      .single()
      .then(({ data }) => {
        if (data?.school_year) {
          setYear(data.school_year as SchoolYear);
        }
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
    if (e.target.files) {
      setImages((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

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
    <div className="min-h-screen bg-background px-4 py-6 pb-24 md:py-12">
      <div className="mx-auto max-w-lg">
        {/* Gamification Bar */}
        <div className="mb-4">
          <GamificationBar />
        </div>

        {/* Header */}
        <div className="mb-8 text-center animate-fade-in">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5">
            <BookOpen className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-primary font-display">StudyApp</span>
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground">
            Bora estudar! 📚
          </h1>
          <p className="mt-2 text-muted-foreground">
            Configure o estudo e a IA gera exercícios pra você
          </p>
        </div>

        <div className="space-y-5">
          {/* Year */}
          <Card className="animate-fade-in" style={{ animationDelay: '100ms' }}>
            <CardContent className="p-4">
              <Label className="mb-2 block font-semibold">Ano escolar</Label>
              <Select value={year} onValueChange={(v) => setYear(v as SchoolYear)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o ano" />
                </SelectTrigger>
                <SelectContent>
                  {YEAR_OPTIONS.map((y) => (
                    <SelectItem key={y.value} value={y.value}>{y.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Subject */}
          <Card className="animate-fade-in" style={{ animationDelay: '200ms' }}>
            <CardContent className="p-4">
              <Label className="mb-2 block font-semibold">Matéria</Label>
              <Select value={subject} onValueChange={(v) => setSubject(v as Subject)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a matéria" />
                </SelectTrigger>
                <SelectContent>
                  {SUBJECTS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {SUBJECT_EMOJIS[s]} {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Topic */}
          <Card className="animate-fade-in" style={{ animationDelay: '300ms' }}>
            <CardContent className="p-4">
              <Label className="mb-2 block font-semibold">Assunto</Label>
              <Input
                placeholder="Ex: Equações do 1º grau, Revolução Francesa..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </CardContent>
          </Card>

          {/* Images */}
          <Card className="animate-fade-in" style={{ animationDelay: '400ms' }}>
            <CardContent className="p-4">
              <Label className="mb-2 block font-semibold">📷 Fotos do livro (opcional)</Label>
              <p className="mb-3 text-sm text-muted-foreground">
                Tire foto ou envie imagens das páginas
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageUpload}
              />
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="h-4 w-4" />
                Adicionar fotos
              </Button>
              {images.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {images.map((img, i) => (
                    <div key={i} className="relative h-16 w-16 overflow-hidden rounded-md border animate-scale-in">
                      <img
                        src={URL.createObjectURL(img)}
                        alt={`Página ${i + 1}`}
                        className="h-full w-full object-cover"
                      />
                      <button
                        onClick={() => removeImage(i)}
                        className="absolute -right-1 -top-1 rounded-full bg-destructive p-0.5 text-destructive-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Audio */}
          <Card className="animate-fade-in" style={{ animationDelay: '500ms' }}>
            <CardContent className="p-4">
              <Label className="mb-2 block font-semibold">🎤 Áudio com resumo (opcional)</Label>
              <p className="mb-3 text-sm text-muted-foreground">
                Grave um resumo da matéria com suas palavras
              </p>
              <Button
                variant={isRecording ? 'destructive' : 'outline'}
                className="w-full gap-2"
                onClick={toggleRecording}
              >
                {isRecording ? (
                  <>
                    <MicOff className="h-4 w-4" />
                    Parar gravação
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4" />
                    {audioBlob ? 'Regravar áudio' : 'Gravar áudio'}
                  </>
                )}
              </Button>
              {audioBlob && !isRecording && (
                <div className="mt-3 flex items-center gap-2 rounded-md bg-success/10 px-3 py-2 text-sm text-success animate-fade-in">
                  ✅ Áudio gravado com sucesso
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submit */}
          <Button
            size="lg"
            className="w-full gap-2 font-display text-lg font-bold animate-fade-in"
            style={{ animationDelay: '600ms' }}
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            <Sparkles className="h-5 w-5" />
            Gerar Exercícios
          </Button>
        </div>
      </div>
    </div>
  );
}
