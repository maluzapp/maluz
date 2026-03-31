import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { History, Calendar, BookOpen } from 'lucide-react';
import { getYearLabel } from '@/constants/years';
import { cn } from '@/lib/utils';

interface SessionRecord {
  id: string;
  subject: string;
  topic: string;
  year: string;
  score: number;
  total: number;
  xp_earned: number;
  created_at: string;
}

function getEmoji(pct: number) {
  if (pct >= 90) return '🏆';
  if (pct >= 70) return '🎉';
  if (pct >= 50) return '💪';
  return '📖';
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

interface Props {
  profileId: string;
}

export function ChildSessionHistory({ profileId }: Props) {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!profileId) return;
    supabase
      .from('study_sessions')
      .select('id, subject, topic, year, score, total, xp_earned, created_at')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => {
        setSessions((data as SessionRecord[]) || []);
        setLoading(false);
      });
  }, [profileId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-6">
        <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Nenhuma sessão de estudo ainda</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
        <History className="h-5 w-5 text-primary" />
        Histórico de Estudos
      </h3>
      {sessions.map((s) => {
        const pct = Math.round((s.score / s.total) * 100);
        return (
          <Card
            key={s.id}
            className="cursor-pointer hover:border-primary/30 transition-colors"
            onClick={() => navigate(`/sessao/${s.id}`)}
          >
            <CardContent className="p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-display font-bold text-sm text-foreground truncate">{s.subject}</p>
                  <p className="text-xs text-muted-foreground truncate">{s.topic}</p>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-0.5">
                      <Calendar className="h-3 w-3" />
                      {formatDate(s.created_at)}
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className={cn(
                    'text-sm font-display font-bold',
                    pct >= 70 ? 'text-success' : pct >= 50 ? 'text-accent' : 'text-destructive'
                  )}>
                    {getEmoji(pct)} {pct}%
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {s.score}/{s.total} • +{s.xp_earned} XP
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
