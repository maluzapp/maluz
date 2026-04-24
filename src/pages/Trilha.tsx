import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Star, Sparkles, ArrowLeft, BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useProfileStore } from "@/hooks/useProfile";
import { useStudyStore } from "@/store/study-store";
import { useTrackContext } from "@/store/track-context";
import { SUBJECTS, getSubjectEmoji } from "@/constants/subjects";
import { YEAR_OPTIONS } from "@/constants/years";
import { SubjectXpBar } from "@/components/SubjectXpBar";
import { useCanStartSession } from "@/hooks/useSubscription";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Subject, SchoolYear } from "@/types/study";

interface TrackNode {
  id: string;
  position: number;
  topic: string;
  description: string | null;
  emoji: string;
  status: "locked" | "available" | "completed";
  best_score: number | null;
}

interface Track {
  id: string;
  title: string;
  subject: string;
  school_year: string;
}

export default function Trilha() {
  const navigate = useNavigate();
  const profileId = useProfileStore((s) => s.activeProfileId);
  const setStudyConfig = useStudyStore((s) => s.setConfig);
  const setStudyLoading = useStudyStore((s) => s.setLoading);
  const setPendingNode = useTrackContext((s) => s.setPendingNode);
  const { canStart } = useCanStartSession();

  const [profileYear, setProfileYear] = useState<SchoolYear | "">("");
  const [subject, setSubject] = useState<Subject | "">("");
  const [year, setYear] = useState<SchoolYear | "">("");
  const [track, setTrack] = useState<Track | null>(null);
  const [nodes, setNodes] = useState<TrackNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  // Carrega ano padrão do perfil
  useEffect(() => {
    if (!profileId) return;
    supabase
      .from("profiles")
      .select("school_year")
      .eq("id", profileId)
      .single()
      .then(({ data }) => {
        if (data?.school_year) {
          setProfileYear(data.school_year as SchoolYear);
          setYear(data.school_year as SchoolYear);
        }
      });
  }, [profileId]);

  // Busca trilha + nós
  const fetchTrack = async () => {
    if (!profileId || !subject || !year) return;
    setLoading(true);
    const { data: t } = await supabase
      .from("learning_tracks")
      .select("id, title, subject, school_year")
      .eq("profile_id", profileId)
      .eq("subject", subject)
      .eq("school_year", year)
      .maybeSingle();

    if (!t) {
      setTrack(null);
      setNodes([]);
      setLoading(false);
      return;
    }
    setTrack(t as Track);
    const { data: nlist } = await supabase
      .from("track_nodes")
      .select("id, position, topic, description, emoji, status, best_score")
      .eq("track_id", t.id)
      .order("position", { ascending: true });
    setNodes((nlist as TrackNode[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchTrack();
    // realtime subscription
    if (!profileId) return;
    const ch = supabase
      .channel(`track-${profileId}-${subject}-${year}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "track_nodes" },
        () => fetchTrack(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId, subject, year]);

  const handleCreateTrack = async () => {
    if (!profileId || !subject || !year) return;
    setCreating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { error } = await supabase.functions.invoke("generate-track", {
        headers: session ? { Authorization: `Bearer ${session.access_token}` } : undefined,
        body: { profile_id: profileId, subject, school_year: year },
      });
      if (error) throw error;
      toast.success("✨ Trilha criada!");
      await fetchTrack();
    } catch (e: any) {
      console.error(e);
      toast.error("Não foi possível criar a trilha. Tente novamente.");
    } finally {
      setCreating(false);
    }
  };

  const handleStartNode = (node: TrackNode) => {
    if (node.status !== "available" && node.status !== "completed") return;
    if (!canStart) {
      toast.error("Você atingiu o limite de sessões diárias.");
      return;
    }
    if (!track) return;
    setStudyConfig({
      year: track.school_year as SchoolYear,
      subject: track.subject as Subject,
      topic: node.topic,
      images: [],
    });
    setStudyLoading(true);
    setPendingNode(track.id, node.id);
    navigate("/confirmacao");
  };

  const completedCount = useMemo(() => nodes.filter(n => n.status === "completed").length, [nodes]);
  const trailProgress = nodes.length > 0 ? (completedCount / nodes.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-background px-4 py-6 pb-32 md:pb-40">
      <div className="mx-auto max-w-lg space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => navigate("/inicio")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar
          </button>
          <h1 className="font-display font-bold text-foreground flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> Trilha de Luz
          </h1>
          <div className="w-12" />
        </div>

        {!canStart && <UpgradePrompt />}

        {/* Seleção de matéria + ano */}
        <Card className="border-primary/15 animate-fade-in">
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Select value={subject} onValueChange={(v) => setSubject(v as Subject)}>
                <SelectTrigger><SelectValue placeholder="Matéria" /></SelectTrigger>
                <SelectContent>
                  {SUBJECTS.map((s) => (
                    <SelectItem key={s} value={s}>{getSubjectEmoji(s)} {s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={year} onValueChange={(v) => setYear(v as SchoolYear)}>
                <SelectTrigger><SelectValue placeholder="Ano" /></SelectTrigger>
                <SelectContent>
                  {YEAR_OPTIONS.map((y) => (
                    <SelectItem key={y.value} value={y.value}>{y.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {subject && year && !track && !loading && (
              <Button onClick={handleCreateTrack} disabled={creating} className="w-full gap-2 font-display font-bold">
                {creating ? "Criando trilha..." : <><Sparkles className="h-4 w-4" /> Criar trilha de {subject}</>}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Barra XP por matéria (todas) */}
        {profileId && <SubjectXpBar profileId={profileId} />}

        {/* Trilha */}
        {loading && (
          <div className="flex justify-center py-10">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        )}

        {!loading && track && nodes.length > 0 && (
          <div className="space-y-2 animate-fade-in">
            <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
              <span>{track.title}</span>
              <span>{completedCount}/{nodes.length} acesos ✨</span>
            </div>
            <TrackMap nodes={nodes} onSelect={handleStartNode} />
          </div>
        )}

        {!loading && !track && subject && year && (
          <Card className="border-primary/10">
            <CardContent className="p-6 text-center">
              <BookOpen className="h-10 w-10 text-primary/60 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                Nenhuma trilha aqui ainda. Crie a primeira trilha de <strong>{subject}</strong> para o {YEAR_OPTIONS.find(y=>y.value===year)?.label}!
              </p>
            </CardContent>
          </Card>
        )}

        {!loading && !subject && (
          <Card className="border-primary/10">
            <CardContent className="p-6 text-center">
              <Sparkles className="h-10 w-10 text-primary/60 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                Escolha uma <strong>matéria</strong> para começar a iluminar o caminho.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

/** Mapa vertical estilo Duolingo com efeito de iluminação */
function TrackMap({ nodes, onSelect }: { nodes: TrackNode[]; onSelect: (n: TrackNode) => void }) {
  // posição alternada: zig-zag suave
  const offsets = ["mr-0 ml-0", "ml-16", "ml-32", "ml-16", "ml-0", "mr-16", "mr-32", "mr-16"];

  // Encontra próximo nó disponível para destacar
  const nextAvailableIdx = nodes.findIndex(n => n.status === "available");

  return (
    <div className="relative py-4">
      {/* trilha de fundo */}
      <div className="absolute left-1/2 top-0 bottom-0 w-1 -translate-x-1/2 bg-muted/40 rounded-full" />
      {/* trilha iluminada (proporcional a completos) */}
      <div
        className="absolute left-1/2 top-0 w-1 -translate-x-1/2 rounded-full bg-gradient-to-b from-[hsl(42,91%,68%)] via-[hsl(42,91%,55%)] to-[hsl(42,91%,40%)] shadow-[0_0_20px_hsl(42_91%_61%/0.6)] transition-all duration-700"
        style={{
          height: nodes.length > 0 ? `${(Math.max(0, nodes.findIndex(n => n.status !== "completed") === -1 ? nodes.length : nodes.findIndex(n => n.status !== "completed")) / nodes.length) * 100}%` : "0%",
        }}
      />

      <div className="relative space-y-6">
        {nodes.map((node, idx) => {
          const offset = offsets[idx % offsets.length];
          const isCompleted = node.status === "completed";
          const isAvailable = node.status === "available";
          const isLocked = node.status === "locked";
          const isNext = idx === nextAvailableIdx;

          return (
            <div key={node.id} className={cn("relative flex items-center justify-center")}>
              <button
                onClick={() => onSelect(node)}
                disabled={isLocked}
                className={cn(
                  "relative z-10 group flex flex-col items-center gap-1.5 transition-all",
                  offset,
                  isLocked && "cursor-not-allowed",
                )}
                aria-label={node.topic}
              >
                {/* Glow externo para nó atual */}
                {isNext && (
                  <span className="absolute inset-0 -m-3 rounded-full bg-primary/30 blur-xl animate-pulse pointer-events-none" />
                )}

                {/* Botão circular */}
                <div
                  className={cn(
                    "relative flex h-20 w-20 items-center justify-center rounded-full transition-all duration-500",
                    "ring-4",
                    isCompleted &&
                      "bg-gradient-to-br from-[hsl(42,91%,72%)] via-[hsl(42,91%,55%)] to-[hsl(42,80%,38%)] ring-[hsl(42,91%,55%)]/40 shadow-[0_0_30px_hsl(42_91%_61%/0.55),inset_0_-4px_8px_rgba(0,0,0,0.2),inset_0_3px_6px_rgba(255,255,255,0.4)]",
                    isAvailable && !isNext &&
                      "bg-gradient-to-br from-card to-secondary ring-primary/30 shadow-[0_4px_14px_rgba(0,0,0,0.4),inset_0_2px_4px_rgba(255,255,255,0.1)]",
                    isNext &&
                      "bg-gradient-to-br from-[hsl(42,91%,72%)] via-[hsl(42,91%,58%)] to-[hsl(42,91%,38%)] ring-primary/60 shadow-[0_0_36px_hsl(42_91%_61%/0.8),inset_0_-4px_8px_rgba(0,0,0,0.2),inset_0_3px_6px_rgba(255,255,255,0.5)] scale-110 animate-pulse",
                    isLocked &&
                      "bg-muted/60 ring-muted/50 grayscale opacity-60",
                    !isLocked && "group-hover:scale-105 group-active:scale-95",
                  )}
                >
                  {isLocked ? (
                    <Lock className="h-7 w-7 text-muted-foreground" />
                  ) : isCompleted ? (
                    <span className="text-4xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]" aria-hidden="true">
                      {node.emoji}
                    </span>
                  ) : (
                    <span
                      className={cn(
                        "text-4xl",
                        isNext && "drop-shadow-[0_2px_8px_rgba(255,220,120,0.7)]"
                      )}
                      aria-hidden="true"
                    >
                      {node.emoji}
                    </span>
                  )}

                  {/* Estrela de completo */}
                  {isCompleted && (
                    <span className="absolute -top-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-card ring-2 ring-[hsl(42,91%,55%)] shadow-lg">
                      <Star className="h-4 w-4 fill-[hsl(42,91%,55%)] text-[hsl(42,91%,55%)]" />
                    </span>
                  )}
                </div>

                {/* Label */}
                <div className="text-center max-w-[140px] mt-1">
                  <p
                    className={cn(
                      "text-xs font-display font-bold leading-tight",
                      isLocked ? "text-muted-foreground/60" : "text-foreground",
                    )}
                  >
                    {node.topic}
                  </p>
                  {isCompleted && node.best_score !== null && (
                    <p className="text-[10px] font-mono text-[hsl(42,91%,68%)] mt-0.5">
                      {node.best_score}/10 ⭐
                    </p>
                  )}
                  {isNext && (
                    <p className="text-[10px] font-mono text-primary mt-0.5 animate-pulse">
                      Toque para começar
                    </p>
                  )}
                </div>
              </button>
            </div>
          );
        })}

        {/* Bandeira final */}
        <div className="relative flex items-center justify-center pt-4">
          <div
            className={cn(
              "flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br ring-4 transition-all",
              nodes.every(n => n.status === "completed")
                ? "from-[hsl(42,91%,72%)] to-[hsl(42,91%,40%)] ring-primary/60 shadow-[0_0_40px_hsl(42_91%_61%/0.9)]"
                : "from-card to-secondary ring-muted/40",
            )}
          >
            <span className="text-3xl">🏁</span>
          </div>
        </div>
      </div>
    </div>
  );
}
