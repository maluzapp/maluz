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
  const [subject, setSubject] = useState<Subject>(SUBJECTS[0] as Subject);
  const [track, setTrack] = useState<Track | null>(null);
  const [nodes, setNodes] = useState<TrackNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Carrega ano do perfil (usado automaticamente em todas as trilhas)
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
        }
      });
  }, [profileId]);

  // Auto-cria trilha se não existir
  const ensureTrack = async (currentSubject: Subject, currentYear: SchoolYear) => {
    setLoading(true);
    const { data: existing } = await supabase
      .from("learning_tracks")
      .select("id, title, subject, school_year")
      .eq("profile_id", profileId!)
      .eq("subject", currentSubject)
      .eq("school_year", currentYear)
      .maybeSingle();

    if (existing) {
      setTrack(existing as Track);
      const { data: nlist } = await supabase
        .from("track_nodes")
        .select("id, position, topic, description, emoji, status, best_score")
        .eq("track_id", existing.id)
        .order("position", { ascending: true });
      setNodes((nlist as TrackNode[]) || []);
      setLoading(false);
      return;
    }

    // Não existe — gera automaticamente
    setCreating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { error } = await supabase.functions.invoke("generate-track", {
        headers: session ? { Authorization: `Bearer ${session.access_token}` } : undefined,
        body: { profile_id: profileId, subject: currentSubject, school_year: currentYear },
      });
      if (error) throw error;
      // refetch
      const { data: t2 } = await supabase
        .from("learning_tracks")
        .select("id, title, subject, school_year")
        .eq("profile_id", profileId!)
        .eq("subject", currentSubject)
        .eq("school_year", currentYear)
        .maybeSingle();
      if (t2) {
        setTrack(t2 as Track);
        const { data: nlist } = await supabase
          .from("track_nodes")
          .select("id, position, topic, description, emoji, status, best_score")
          .eq("track_id", t2.id)
          .order("position", { ascending: true });
        setNodes((nlist as TrackNode[]) || []);
      }
    } catch (e: any) {
      console.error(e);
      toast.error("Não foi possível carregar a trilha. Tente novamente.");
      setTrack(null);
      setNodes([]);
    } finally {
      setCreating(false);
      setLoading(false);
    }
  };

  // Sempre que tiver perfilYear + subject, garante a trilha
  useEffect(() => {
    if (!profileId || !profileYear || !subject) return;
    ensureTrack(subject, profileYear);

    // realtime subscription dos nós
    const ch = supabase
      .channel(`track-${profileId}-${subject}-${profileYear}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "track_nodes" },
        () => ensureTrack(subject, profileYear),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId, subject, profileYear]);

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
  const yearLabel = YEAR_OPTIONS.find(y => y.value === profileYear)?.label;

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

        {/* Chips de matéria — clique troca a trilha */}
        <div className="animate-fade-in">
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin">
            {SUBJECTS.map((s) => {
              const active = subject === s;
              return (
                <button
                  key={s}
                  onClick={() => setSubject(s as Subject)}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-display font-bold transition-all",
                    active
                      ? "bg-primary text-primary-foreground border-primary shadow-md scale-105"
                      : "bg-card text-foreground border-border hover:border-primary/40",
                  )}
                >
                  <span aria-hidden>{getSubjectEmoji(s)}</span>
                  <span>{s}</span>
                </button>
              );
            })}
          </div>
          {yearLabel && (
            <p className="text-[11px] font-mono text-muted-foreground mt-1 px-1">
              Adaptado para o <strong>{yearLabel}</strong>
            </p>
          )}
        </div>

        {/* Aviso quando não há ano cadastrado */}
        {!profileYear && profileId && (
          <Card className="border-primary/15">
            <CardContent className="p-5 text-center">
              <BookOpen className="h-8 w-8 text-primary/60 mx-auto mb-2" />
              <p className="text-sm text-foreground mb-3">
                Para personalizar sua trilha, escolha o seu ano escolar.
              </p>
              <button
                onClick={() => navigate("/perfis")}
                className="text-sm font-display font-bold text-primary underline-offset-4 hover:underline"
              >
                Ir para Perfis
              </button>
            </CardContent>
          </Card>
        )}

        {/* Barra XP por matéria */}
        {profileId && <SubjectXpBar profileId={profileId} />}

        {/* Trilha */}
        {(loading || creating) && (
          <div className="flex flex-col items-center py-10 gap-2">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            {creating && (
              <p className="text-xs font-mono text-muted-foreground animate-pulse">
                Iluminando seu caminho...
              </p>
            )}
          </div>
        )}

        {!loading && !creating && track && nodes.length > 0 && (
          <div className="space-y-2 animate-fade-in">
            <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
              <span>{track.title}</span>
              <span>{completedCount}/{nodes.length} acesos ✨</span>
            </div>
            <TrackMap nodes={nodes} onSelect={handleStartNode} />
          </div>
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
