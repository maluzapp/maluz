import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { StatBar } from "@/components/ui/stat-bar";
import { levelName, levelEmoji, nextLevelName, xpBreakdown } from "@/lib/subjectLevels";
import { getSubjectEmoji } from "@/constants/subjects";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SubjectXpRow {
  subject: string;
  xp: number;
}

interface Props {
  profileId: string;
  /** Quando definido, mostra apenas essa matéria; caso contrário, lista todas. */
  subjectFilter?: string;
  className?: string;
}

const VARIANTS = ["gold", "mint", "frost", "mystic", "rose", "flame"] as const;

function variantFor(idx: number) {
  return VARIANTS[idx % VARIANTS.length];
}

export function SubjectXpBar({ profileId, subjectFilter, className }: Props) {
  const [rows, setRows] = useState<SubjectXpRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profileId) return;
    let cancelled = false;
    setLoading(true);
    let query = supabase
      .from("profile_subject_xp")
      .select("subject, xp")
      .eq("profile_id", profileId)
      .order("xp", { ascending: false });
    if (subjectFilter) query = query.eq("subject", subjectFilter);

    query.then(({ data }) => {
      if (cancelled) return;
      setRows((data as SubjectXpRow[]) || []);
      setLoading(false);
    });

    // Realtime: atualiza ao concluir nó
    const channel = supabase
      .channel(`psxp-${profileId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profile_subject_xp", filter: `profile_id=eq.${profileId}` },
        () => {
          supabase
            .from("profile_subject_xp")
            .select("subject, xp")
            .eq("profile_id", profileId)
            .order("xp", { ascending: false })
            .then(({ data }) => {
              if (!cancelled) setRows((data as SubjectXpRow[]) || []);
            });
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [profileId, subjectFilter]);

  if (loading) {
    return (
      <Card className={cn("border-primary/10", className)}>
        <CardContent className="p-4">
          <div className="h-12 animate-pulse bg-muted rounded-md" />
        </CardContent>
      </Card>
    );
  }

  if (rows.length === 0) {
    return (
      <Card className={cn("border-primary/10", className)}>
        <CardContent className="p-4 text-center text-sm text-muted-foreground">
          ✨ Comece sua trilha para acumular XP por matéria!
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-2.5", className)}>
      {rows.map((r, idx) => {
        const b = xpBreakdown(r.xp);
        const variant = variantFor(idx);
        return (
          <Card key={r.subject} className="border-primary/10 overflow-hidden animate-fade-in" style={{ animationDelay: `${idx * 60}ms` }}>
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-2xl emoji-3d leading-none shrink-0">{getSubjectEmoji(r.subject)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-display font-bold text-foreground truncate">{r.subject}</p>
                    <span className="text-[10px] font-mono text-muted-foreground shrink-0">{r.xp} XP</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <span className="text-base leading-none">{levelEmoji(b.level)}</span>
                    <span className="font-semibold text-foreground">{levelName(b.level)}</span>
                    <span className="text-muted-foreground">→ {nextLevelName(b.level)}</span>
                  </div>
                </div>
              </div>
              <StatBar value={b.progressPct} variant={variant as any} size="sm" />
              <p className="mt-1 text-[10px] text-muted-foreground font-mono text-right">
                {b.xpInLevel}/{b.xpForNext} XP até {nextLevelName(b.level)}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
