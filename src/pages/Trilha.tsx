import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Star, Sparkles, ArrowLeft, BookOpen, Flag, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useProfileStore } from "@/hooks/useProfile";
import { useStudyStore } from "@/store/study-store";
import { useTrackContext } from "@/store/track-context";
import { SUBJECTS, getSubjectEmoji } from "@/constants/subjects";
import { getYearLabel } from "@/constants/years";
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
  const [track, setTrack] = useState<Track | null>(null);
  const [nodes, setNodes] = useState<TrackNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!profileId) return;
    supabase
      .from("profiles")
      .select("school_year")
      .eq("id", profileId)
      .single()
      .then(({ data }) => {
        if (data?.school_year) setProfileYear(data.school_year as SchoolYear);
      });
  }, [profileId]);

  const fetchTrack = async () => {
    if (!profileId || !subject || !profileYear) return;
    setLoading(true);
    const { data: t } = await supabase
      .from("learning_tracks")
      .select("id, title, subject, school_year")
      .eq("profile_id", profileId)
      .eq("subject", subject)
      .eq("school_year", profileYear)
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
    if (!profileId) return;
    const ch = supabase
      .channel(`track-${profileId}-${subject}-${profileYear}`)
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
  }, [profileId, subject, profileYear]);

  const handleCreateTrack = async () => {
    if (!profileId || !subject || !profileYear) return;
    setCreating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { error } = await supabase.functions.invoke("generate-track", {
        headers: session ? { Authorization: `Bearer ${session.access_token}` } : undefined,
        body: { profile_id: profileId, subject, school_year: profileYear },
      });
      if (error) throw error;
      toast.success("✨ Mapa criado!");
      await fetchTrack();
    } catch (e: any) {
      console.error(e);
      toast.error("Não foi possível criar o mapa. Tente novamente.");
    } finally {
      setCreating(false);
    }
  };

  const handleStartNode = (node: TrackNode) => {
    if (node.status === "locked") return;
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
    setStudyLoading(false);
    setPendingNode(track.id, node.id);
    navigate("/gerar");
  };

  const completedCount = useMemo(() => nodes.filter(n => n.status === "completed").length, [nodes]);
  const progressPct = nodes.length ? Math.round((completedCount / nodes.length) * 100) : 0;

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

        {profileYear && (
          <p className="text-center text-xs font-mono text-muted-foreground -mt-2">
            {getYearLabel(profileYear)} · mapa personalizado para o seu ano
          </p>
        )}

        {!canStart && <UpgradePrompt />}

        {/* Seleção de matéria */}
        <Card className="border-primary/15 animate-fade-in">
          <CardContent className="p-4 space-y-3">
            <Select value={subject} onValueChange={(v) => setSubject(v as Subject)}>
              <SelectTrigger><SelectValue placeholder="Escolha uma matéria" /></SelectTrigger>
              <SelectContent>
                {SUBJECTS.map((s) => (
                  <SelectItem key={s} value={s}>{getSubjectEmoji(s)} {s}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {subject && profileYear && !track && !loading && (
              <Button onClick={handleCreateTrack} disabled={creating} className="w-full gap-2 font-display font-bold">
                {creating ? "Criando mapa..." : <><Sparkles className="h-4 w-4" /> Criar mapa de {subject}</>}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Barra XP por matéria */}
        {profileId && <SubjectXpBar profileId={profileId} />}

        {loading && (
          <div className="flex justify-center py-10">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        )}

        {!loading && track && nodes.length > 0 && (
          <div className="space-y-3 animate-fade-in">
            {/* Banner do mapa */}
            <div className="map-banner rounded-xl px-4 py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-mono uppercase tracking-wider text-primary/80">Mapa atual</p>
                <p className="font-display font-bold text-sm text-foreground truncate">{track.title}</p>
              </div>
              <div className="flex flex-col items-end shrink-0">
                <div className="flex items-center gap-1 text-xs font-mono text-primary">
                  <Trophy className="h-3.5 w-3.5" /> {completedCount}/{nodes.length}
                </div>
                <div className="mt-1 h-1.5 w-20 rounded-full bg-muted/40 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[hsl(42,91%,72%)] to-[hsl(42,91%,45%)] transition-all duration-700"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            </div>

            <p className="text-[11px] text-center text-muted-foreground italic px-2">
              Toque num ponto para enviar fotos, áudio ou tema — ao terminar, o caminho se ilumina ✨
            </p>

            <TrackMap nodes={nodes} onSelect={handleStartNode} />
          </div>
        )}

        {!loading && !track && subject && profileYear && (
          <Card className="border-primary/10">
            <CardContent className="p-6 text-center">
              <BookOpen className="h-10 w-10 text-primary/60 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                Nenhum mapa aqui ainda. Crie o primeiro mapa de <strong>{subject}</strong>!
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

/* ============================================================
   MAPA GAMIFICADO — caminho SVG curvo, cenários, vagalumes
============================================================ */

// Cenários temáticos a cada etapa (loop a cada 5 nós)
const SCENERIES = [
  { emoji: "🏡", side: "left", label: "Vila" },
  { emoji: "🌳", side: "right", label: "Floresta" },
  { emoji: "🌲", side: "left", label: "Bosque" },
  { emoji: "⛰️", side: "right", label: "Montanha" },
  { emoji: "🏰", side: "left", label: "Castelo" },
] as const;

// Posições x em zig-zag (porcentagem do width)
const X_POSITIONS = [50, 78, 62, 30, 22, 38, 70, 80, 50, 25];

function TrackMap({ nodes, onSelect }: { nodes: TrackNode[]; onSelect: (n: TrackNode) => void }) {
  const NODE_SPACING = 150; // px entre nós
  const TOP_PADDING = 80;
  const BOTTOM_PADDING = 120;
  const height = nodes.length * NODE_SPACING + TOP_PADDING + BOTTOM_PADDING;
  const width = 360; // viewBox base — escala com o container
  const containerRef = useRef<HTMLDivElement>(null);

  const nextAvailableIdx = nodes.findIndex(n => n.status === "available");

  // Calcula coordenadas (em %) dos nós
  const points = nodes.map((_, i) => ({
    xPct: X_POSITIONS[i % X_POSITIONS.length],
    y: TOP_PADDING + i * NODE_SPACING,
  }));

  // Caminho SVG suave (cubic bezier entre pontos)
  const buildPath = (toIndex: number) => {
    if (points.length === 0 || toIndex < 0) return "";
    const pts = points.slice(0, toIndex + 1);
    let d = `M ${(pts[0].xPct / 100) * width} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1];
      const cur = pts[i];
      const prevX = (prev.xPct / 100) * width;
      const curX = (cur.xPct / 100) * width;
      const midY = (prev.y + cur.y) / 2;
      d += ` C ${prevX} ${midY}, ${curX} ${midY}, ${curX} ${cur.y}`;
    }
    return d;
  };

  // Quantos nós já contam como "iluminados" no path (até o último completo)
  const lastCompletedIdx = (() => {
    let last = -1;
    nodes.forEach((n, i) => { if (n.status === "completed") last = i; });
    return last;
  })();

  const fullPath = buildPath(nodes.length - 1);
  const litPath = buildPath(lastCompletedIdx);

  // Vagalumes posicionados aleatoriamente (fixos por render)
  const fireflies = useMemo(
    () => Array.from({ length: 6 }).map((_, i) => ({
      left: 8 + ((i * 23) % 80),
      top: 10 + ((i * 37) % 80),
      delay: (i * 0.7) % 5,
      duration: 4 + (i % 3),
    })),
    [],
  );

  return (
    <div ref={containerRef} className="trilha-map p-4">
      {/* Camada de estrelas */}
      <div className="trilha-stars trilha-stars-twinkle" />

      {/* Vagalumes */}
      {fireflies.map((f, i) => (
        <span
          key={i}
          className="firefly"
          style={{
            left: `${f.left}%`,
            top: `${f.top}%`,
            animationDelay: `${f.delay}s`,
            animationDuration: `${f.duration}s`,
          }}
        />
      ))}

      <div className="relative" style={{ height: `${height}px` }}>
        {/* SVG: caminho de fundo (pontilhado) + caminho iluminado */}
        <svg
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full pointer-events-none"
        >
          <defs>
            <linearGradient id="pathGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="hsl(42 91% 75%)" />
              <stop offset="50%" stopColor="hsl(42 91% 58%)" />
              <stop offset="100%" stopColor="hsl(42 91% 40%)" />
            </linearGradient>
            <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="hsl(42 91% 70%)" stopOpacity="0.5" />
              <stop offset="100%" stopColor="hsl(42 91% 70%)" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Caminho fantasma (todo) */}
          <path
            d={fullPath}
            fill="none"
            strokeWidth={6}
            strokeLinecap="round"
            className="trilha-path-bg"
          />
          {/* Caminho iluminado (até o último completo) */}
          {lastCompletedIdx >= 0 && (
            <path
              d={litPath}
              fill="none"
              strokeWidth={7}
              strokeLinecap="round"
              className="trilha-path-lit"
            />
          )}

          {/* Halo nos nós completos */}
          {nodes.map((n, i) => {
            if (n.status !== "completed") return null;
            const x = (points[i].xPct / 100) * width;
            const y = points[i].y;
            return <circle key={n.id} cx={x} cy={y} r={42} fill="url(#nodeGlow)" />;
          })}
        </svg>

        {/* Cenários decorativos posicionados entre nós */}
        {nodes.map((_, i) => {
          if (i % 2 !== 0 || i >= nodes.length - 1) return null;
          const scenery = SCENERIES[Math.floor(i / 2) % SCENERIES.length];
          const y = points[i].y + NODE_SPACING / 2 - 18;
          const isLit = lastCompletedIdx >= i;
          // Posição contraria ao zig-zag do nó pra não conflitar
          const xPct = points[i].xPct > 50 ? 8 : 78;
          return (
            <span
              key={`scenery-${i}`}
              className={cn("scenery-emoji", isLit && "lit")}
              style={{ left: `${xPct}%`, top: `${y}px` }}
              aria-hidden="true"
            >
              {scenery.emoji}
            </span>
          );
        })}

        {/* Bandeirinha de início no topo */}
        <div
          className="absolute z-10 flex flex-col items-center"
          style={{
            left: `${points[0]?.xPct ?? 50}%`,
            top: `8px`,
            transform: "translate(-50%, -50%)",
          }}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[hsl(160_94%_64%)] to-[hsl(160_94%_38%)] ring-2 ring-[hsl(160_94%_64%)]/40 shadow-lg">
            <Flag className="h-5 w-5 text-background" />
          </div>
          <span className="mt-1 text-[9px] font-mono uppercase tracking-wider text-accent">início</span>
        </div>

        {/* Nós */}
        {nodes.map((node, i) => {
          const xPct = points[i].xPct;
          const y = points[i].y;
          const isCompleted = node.status === "completed";
          const isAvailable = node.status === "available";
          const isLocked = node.status === "locked";
          const isNext = i === nextAvailableIdx;

          return (
            <div
              key={node.id}
              className="absolute z-20"
              style={{ left: `${xPct}%`, top: `${y}px`, transform: "translate(-50%, -50%)" }}
            >
              <button
                onClick={() => onSelect(node)}
                disabled={isLocked}
                className={cn(
                  "group flex flex-col items-center gap-1.5 transition-all",
                  isLocked && "cursor-not-allowed",
                )}
                aria-label={node.topic}
              >
                {/* Selo de número */}
                <span
                  className={cn(
                    "absolute -top-2 left-1/2 -translate-x-1/2 z-30 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold font-mono ring-2 ring-background",
                    isCompleted && "bg-[hsl(42,91%,55%)] text-background",
                    isAvailable && !isCompleted && "bg-primary text-primary-foreground",
                    isLocked && "bg-muted text-muted-foreground",
                  )}
                >
                  {i + 1}
                </span>

                <div
                  className={cn(
                    "relative flex h-[72px] w-[72px] items-center justify-center rounded-full transition-all duration-500",
                    "ring-4",
                    isCompleted &&
                      "bg-gradient-to-br from-[hsl(42,91%,75%)] via-[hsl(42,91%,55%)] to-[hsl(42,80%,35%)] ring-[hsl(42,91%,55%)]/50 shadow-[0_0_30px_hsl(42_91%_61%/0.6),inset_0_-4px_8px_rgba(0,0,0,0.25),inset_0_3px_6px_rgba(255,255,255,0.45)]",
                    isAvailable && !isNext &&
                      "bg-gradient-to-br from-card to-secondary ring-primary/40 shadow-[0_4px_14px_rgba(0,0,0,0.5),inset_0_2px_4px_rgba(255,255,255,0.1)]",
                    isNext &&
                      "bg-gradient-to-br from-[hsl(42,91%,75%)] via-[hsl(42,91%,58%)] to-[hsl(42,91%,38%)] ring-primary/70 scale-110 node-active-pulse",
                    isLocked &&
                      "bg-muted/50 ring-muted/40 grayscale opacity-55",
                    !isLocked && "group-hover:scale-105 group-active:scale-95",
                  )}
                >
                  {isLocked ? (
                    <Lock className="h-7 w-7 text-muted-foreground" />
                  ) : (
                    <span
                      className={cn(
                        "text-4xl select-none",
                        isNext && "drop-shadow-[0_2px_8px_rgba(255,220,120,0.7)]",
                        isCompleted && "drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)]",
                      )}
                      aria-hidden="true"
                    >
                      {node.emoji}
                    </span>
                  )}

                  {isCompleted && (
                    <span className="absolute -top-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-card ring-2 ring-[hsl(42,91%,55%)] shadow-lg">
                      <Star className="h-4 w-4 fill-[hsl(42,91%,55%)] text-[hsl(42,91%,55%)]" />
                    </span>
                  )}
                </div>

                {/* Label */}
                <div className="text-center max-w-[140px] mt-1 px-1.5 py-0.5 rounded-md bg-background/70 backdrop-blur-sm">
                  <p
                    className={cn(
                      "text-[11px] font-display font-bold leading-tight",
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

        {/* Castelo final / meta */}
        <div
          className="absolute z-10 flex flex-col items-center"
          style={{
            left: `${points[points.length - 1]?.xPct ?? 50}%`,
            top: `${height - BOTTOM_PADDING / 2 + 10}px`,
            transform: "translate(-50%, -50%)",
          }}
        >
          <div
            className={cn(
              "flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br ring-4 transition-all",
              nodes.every(n => n.status === "completed")
                ? "from-[hsl(42,91%,75%)] to-[hsl(42,91%,38%)] ring-primary/70 shadow-[0_0_50px_hsl(42_91%_61%/0.95)] animate-pulse"
                : "from-card to-secondary ring-muted/40 grayscale opacity-70",
            )}
          >
            <span className="text-3xl">🏆</span>
          </div>
          <span className="mt-1 text-[10px] font-mono uppercase tracking-wider text-primary">
            {nodes.every(n => n.status === "completed") ? "Conquistado!" : "Meta final"}
          </span>
        </div>
      </div>
    </div>
  );
}
