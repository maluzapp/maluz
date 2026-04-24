import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Star, Sparkles, ArrowLeft, Flag, Trophy, Plus, Globe2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useProfileStore } from "@/hooks/useProfile";
import { useStudyStore } from "@/store/study-store";
import { useTrackContext } from "@/store/track-context";
import { getSubjectEmoji } from "@/constants/subjects";
import { getYearLabel } from "@/constants/years";
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

interface WorldSummary {
  track: Track;
  total: number;
  completed: number;
}

export default function Trilha() {
  const navigate = useNavigate();
  const profileId = useProfileStore((s) => s.activeProfileId);
  const setStudyConfig = useStudyStore((s) => s.setConfig);
  const setStudyLoading = useStudyStore((s) => s.setLoading);
  const setPendingNode = useTrackContext((s) => s.setPendingNode);
  const { canStart } = useCanStartSession();

  const [profileYear, setProfileYear] = useState<SchoolYear | "">("");
  const [worlds, setWorlds] = useState<WorldSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [bootstrapping, setBootstrapping] = useState(false);
  const [activeTrackId, setActiveTrackId] = useState<string | null>(null);
  const [activeNodes, setActiveNodes] = useState<TrackNode[]>([]);
  const [expanding, setExpanding] = useState(false);

  // Carrega ano do perfil
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

  // Carrega todos os mundos (trilhas) + auto-cria trilhas para matérias já estudadas
  const loadWorlds = async () => {
    if (!profileId) return;
    setLoading(true);

    const { data: tracks } = await supabase
      .from("learning_tracks")
      .select("id, title, subject, school_year")
      .eq("profile_id", profileId)
      .order("created_at", { ascending: true });

    const trackList = (tracks as Track[]) || [];

    // Auto-bootstrap: pra cada matéria já estudada que ainda não tem trilha, gera uma.
    if (profileYear) {
      const { data: studied } = await supabase
        .from("study_sessions")
        .select("subject")
        .eq("profile_id", profileId);
      const studiedSubjects = Array.from(
        new Set(((studied as { subject: string }[]) || []).map((s) => s.subject)),
      );
      const existingSubjects = new Set(trackList.map((t) => t.subject));
      const missing = studiedSubjects.filter((s) => !existingSubjects.has(s));

      if (missing.length > 0) {
        setBootstrapping(true);
        const { data: { session } } = await supabase.auth.getSession();
        await Promise.all(
          missing.map((subj) =>
            supabase.functions.invoke("generate-track", {
              headers: session ? { Authorization: `Bearer ${session.access_token}` } : undefined,
              body: { profile_id: profileId, subject: subj, school_year: profileYear },
            }).catch((e) => console.error("auto-create track failed", subj, e)),
          ),
        );
        setBootstrapping(false);

        const { data: newTracks } = await supabase
          .from("learning_tracks")
          .select("id, title, subject, school_year")
          .eq("profile_id", profileId)
          .order("created_at", { ascending: true });
        trackList.length = 0;
        trackList.push(...((newTracks as Track[]) || []));
      }
    }

    if (trackList.length === 0) {
      setWorlds([]);
      setLoading(false);
      return;
    }

    const { data: nodes } = await supabase
      .from("track_nodes")
      .select("track_id, status")
      .in("track_id", trackList.map((t) => t.id));

    const counts = new Map<string, { total: number; completed: number }>();
    for (const t of trackList) counts.set(t.id, { total: 0, completed: 0 });
    for (const n of (nodes as { track_id: string; status: string }[]) || []) {
      const c = counts.get(n.track_id);
      if (!c) continue;
      c.total += 1;
      if (n.status === "completed") c.completed += 1;
    }

    setWorlds(
      trackList.map((t) => ({
        track: t,
        total: counts.get(t.id)?.total ?? 0,
        completed: counts.get(t.id)?.completed ?? 0,
      })),
    );
    setLoading(false);
  };

  useEffect(() => {
    loadWorlds();
    if (!profileId) return;
    // realtime: nós atualizam → reflete progresso dos mundos
    const ch = supabase
      .channel(`worlds-${profileId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "track_nodes" },
        () => {
          loadWorlds();
          if (activeTrackId) loadActiveNodes(activeTrackId);
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "learning_tracks", filter: `profile_id=eq.${profileId}` },
        () => loadWorlds(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId, profileYear]);

  const loadActiveNodes = async (trackId: string) => {
    const { data } = await supabase
      .from("track_nodes")
      .select("id, position, topic, description, emoji, status, best_score")
      .eq("track_id", trackId)
      .order("position", { ascending: true });
    setActiveNodes((data as TrackNode[]) || []);
  };

  const openWorld = async (trackId: string) => {
    setActiveTrackId(trackId);
    setActiveNodes([]);
    await loadActiveNodes(trackId);
  };

  const closeWorld = () => {
    setActiveTrackId(null);
    setActiveNodes([]);
  };

  const activeWorld = useMemo(
    () => worlds.find((w) => w.track.id === activeTrackId) || null,
    [worlds, activeTrackId],
  );

  const handleStartNode = (node: TrackNode) => {
    if (node.status === "locked") return;
    if (!canStart) {
      toast.error("Você atingiu o limite de sessões diárias.");
      return;
    }
    if (!activeWorld) return;
    setStudyConfig({
      year: activeWorld.track.school_year as SchoolYear,
      subject: activeWorld.track.subject as Subject,
      topic: node.topic,
      images: [],
    });
    setStudyLoading(false);
    setPendingNode(activeWorld.track.id, node.id);
    navigate("/gerar");
  };

  const handleExpandWorld = async () => {
    if (!activeWorld || !profileId) return;
    setExpanding(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { error } = await supabase.functions.invoke("generate-track", {
        headers: session ? { Authorization: `Bearer ${session.access_token}` } : undefined,
        body: {
          profile_id: profileId,
          subject: activeWorld.track.subject,
          school_year: activeWorld.track.school_year,
          expand: true,
        },
      });
      if (error) throw error;
      toast.success("✨ Mais 10 fases liberadas!");
      await loadActiveNodes(activeWorld.track.id);
      await loadWorlds();
    } catch (e) {
      console.error(e);
      toast.error("Não foi possível expandir o mundo.");
    } finally {
      setExpanding(false);
    }
  };

  // ============== RENDER ==============

  // Detalhe de um mundo
  if (activeTrackId && activeWorld) {
    const completedCount = activeNodes.filter((n) => n.status === "completed").length;
    const progressPct = activeNodes.length ? Math.round((completedCount / activeNodes.length) * 100) : 0;
    const allDone = activeNodes.length > 0 && activeNodes.every((n) => n.status === "completed");

    return (
      <div className="min-h-screen bg-background px-4 py-6 pb-32 md:pb-40">
        <div className="mx-auto max-w-lg space-y-5">
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={closeWorld}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Mundos
            </button>
            <h1 className="font-display font-bold text-foreground flex items-center gap-2 truncate">
              <span className="text-xl">{getSubjectEmoji(activeWorld.track.subject)}</span>
              <span className="truncate">{activeWorld.track.subject}</span>
            </h1>
            <div className="w-12" />
          </div>

          <p className="text-center text-xs font-mono text-muted-foreground -mt-2">
            {getYearLabel(activeWorld.track.school_year)} · trilha personalizada
          </p>

          {!canStart && <UpgradePrompt />}

          <div className="map-banner rounded-xl px-4 py-3 flex items-center justify-between gap-3 animate-fade-in">
            <div className="min-w-0">
              <p className="text-[10px] font-mono uppercase tracking-wider text-primary/80">Progresso do mundo</p>
              <p className="font-display font-bold text-sm text-foreground truncate">{activeWorld.track.title}</p>
            </div>
            <div className="flex flex-col items-end shrink-0">
              <div className="flex items-center gap-1 text-xs font-mono text-primary">
                <Trophy className="h-3.5 w-3.5" /> {completedCount}/{activeNodes.length}
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

          {activeNodes.length === 0 ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : (
            <>
              <TrackMap nodes={activeNodes} onSelect={handleStartNode} />
              {allDone && (
                <Card className="border-primary/30 bg-gradient-to-r from-primary/15 to-card animate-fade-in">
                  <CardContent className="p-4 text-center space-y-3">
                    <p className="text-sm font-display font-bold text-foreground">
                      🎉 Você iluminou todo este mundo!
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Quer expandir para novos territórios de {activeWorld.track.subject}?
                    </p>
                    <Button onClick={handleExpandWorld} disabled={expanding} className="gap-2">
                      <Plus className="h-4 w-4" />
                      {expanding ? "Expandindo..." : "Liberar mais 10 fases"}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  // Overview de mundos
  return (
    <div className="min-h-screen bg-background px-4 py-6 pb-32 md:pb-40">
      <div className="mx-auto max-w-lg space-y-5">
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
            {getYearLabel(profileYear)} · seus mundos crescem com seu estudo
          </p>
        )}

        {!canStart && <UpgradePrompt />}

        <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.08] to-card p-4 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-primary/30">
              <Globe2 className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display font-bold text-foreground">Seus mundos</p>
              <p className="text-xs text-muted-foreground">
                Cada matéria que você estuda ilumina um mundo. Entre e saia quando quiser.
              </p>
            </div>
          </div>
        </div>

        {(loading || bootstrapping) && (
          <div className="flex flex-col items-center py-10 gap-2">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            {bootstrapping && (
              <p className="text-xs text-muted-foreground font-mono">Iluminando seus mundos...</p>
            )}
          </div>
        )}

        {!loading && !bootstrapping && worlds.length === 0 && (
          <Card className="border-primary/10 animate-fade-in">
            <CardContent className="p-6 text-center space-y-3">
              <Sparkles className="h-10 w-10 text-primary/60 mx-auto" />
              <p className="text-sm text-muted-foreground">
                Nenhum mundo iluminado ainda. Comece estudando — cada matéria abre seu próprio mundo automaticamente.
              </p>
              <Button onClick={() => navigate("/gerar")} className="gap-2">
                <Sparkles className="h-4 w-4" /> Estudar agora
              </Button>
            </CardContent>
          </Card>
        )}

        {!loading && !bootstrapping && worlds.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fade-in">
            {worlds.map((w, i) => {
              const pct = w.total > 0 ? Math.round((w.completed / w.total) * 100) : 0;
              const done = w.total > 0 && w.completed === w.total;
              return (
                <button
                  key={w.track.id}
                  onClick={() => openWorld(w.track.id)}
                  className={cn(
                    "group relative overflow-hidden rounded-2xl border p-4 text-left transition-all hover:scale-[1.02]",
                    done
                      ? "border-[hsl(42,91%,55%)]/50 bg-gradient-to-br from-[hsl(42,91%,55%)]/15 via-card to-card shadow-[0_0_24px_hsl(42_91%_61%/0.25)]"
                      : "border-primary/20 bg-gradient-to-br from-primary/[0.06] to-card hover:border-primary/40",
                  )}
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className={cn(
                    "absolute -right-6 -top-6 h-24 w-24 rounded-full blur-2xl transition-all",
                    done ? "bg-[hsl(42,91%,55%)]/30" : "bg-primary/15 group-hover:bg-primary/30",
                  )} />
                  <div className="relative flex items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 ring-1 ring-primary/30 text-2xl">
                      {getSubjectEmoji(w.track.subject)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-display font-bold text-foreground truncate">{w.track.subject}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {getYearLabel(w.track.school_year)}
                      </p>
                    </div>
                    {done && <Trophy className="h-4 w-4 text-[hsl(42,91%,55%)] shrink-0" />}
                  </div>
                  <div className="relative mt-3">
                    <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                      <span className="text-muted-foreground">{w.completed}/{w.total} fases</span>
                      <span className={cn("font-bold", done ? "text-[hsl(42,91%,68%)]" : "text-primary")}>
                        {pct}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted/40 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[hsl(42,91%,72%)] to-[hsl(42,91%,45%)] transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <p className="text-center text-[11px] text-muted-foreground italic px-2">
          ✨ Toda sessão de estudo livre também ilumina o mundo da matéria estudada.
        </p>
      </div>
    </div>
  );
}

/* ============================================================
   MAPA GAMIFICADO — caminho SVG curvo, cenários, vagalumes
============================================================ */

const SCENERIES = [
  { emoji: "🏡", side: "left", label: "Vila" },
  { emoji: "🌳", side: "right", label: "Floresta" },
  { emoji: "🌲", side: "left", label: "Bosque" },
  { emoji: "⛰️", side: "right", label: "Montanha" },
  { emoji: "🏰", side: "left", label: "Castelo" },
] as const;

const X_POSITIONS = [50, 78, 62, 30, 22, 38, 70, 80, 50, 25];

function TrackMap({ nodes, onSelect }: { nodes: TrackNode[]; onSelect: (n: TrackNode) => void }) {
  const NODE_SPACING = 150;
  const TOP_PADDING = 80;
  const BOTTOM_PADDING = 120;
  const height = nodes.length * NODE_SPACING + TOP_PADDING + BOTTOM_PADDING;
  const width = 360;
  const containerRef = useRef<HTMLDivElement>(null);

  const nextAvailableIdx = nodes.findIndex((n) => n.status === "available");

  const points = nodes.map((_, i) => ({
    xPct: X_POSITIONS[i % X_POSITIONS.length],
    y: TOP_PADDING + i * NODE_SPACING,
  }));

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

  const lastCompletedIdx = (() => {
    let last = -1;
    nodes.forEach((n, i) => {
      if (n.status === "completed") last = i;
    });
    return last;
  })();

  const fullPath = buildPath(nodes.length - 1);
  const litPath = buildPath(lastCompletedIdx);

  const fireflies = useMemo(
    () =>
      Array.from({ length: 6 }).map((_, i) => ({
        left: 8 + ((i * 23) % 80),
        top: 10 + ((i * 37) % 80),
        delay: (i * 0.7) % 5,
        duration: 4 + (i % 3),
      })),
    [],
  );

  return (
    <div ref={containerRef} className="trilha-map p-4">
      <div className="trilha-stars trilha-stars-twinkle" />

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

          <path
            d={fullPath}
            fill="none"
            strokeWidth={6}
            strokeLinecap="round"
            className="trilha-path-bg"
          />
          {lastCompletedIdx >= 0 && (
            <path
              d={litPath}
              fill="none"
              strokeWidth={7}
              strokeLinecap="round"
              className="trilha-path-lit"
            />
          )}

          {nodes.map((n, i) => {
            if (n.status !== "completed") return null;
            const x = (points[i].xPct / 100) * width;
            const y = points[i].y;
            return <circle key={n.id} cx={x} cy={y} r={42} fill="url(#nodeGlow)" />;
          })}
        </svg>

        {nodes.map((_, i) => {
          if (i % 2 !== 0 || i >= nodes.length - 1) return null;
          const scenery = SCENERIES[Math.floor(i / 2) % SCENERIES.length];
          const y = points[i].y + NODE_SPACING / 2 - 18;
          const isLit = lastCompletedIdx >= i;
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
              nodes.every((n) => n.status === "completed")
                ? "from-[hsl(42,91%,75%)] to-[hsl(42,91%,38%)] ring-primary/70 shadow-[0_0_50px_hsl(42_91%_61%/0.95)] animate-pulse"
                : "from-card to-secondary ring-muted/40 grayscale opacity-70",
            )}
          >
            <span className="text-3xl">🏆</span>
          </div>
          <span className="mt-1 text-[10px] font-mono uppercase tracking-wider text-primary">
            {nodes.every((n) => n.status === "completed") ? "Conquistado!" : "Meta final"}
          </span>
        </div>
      </div>
    </div>
  );
}
