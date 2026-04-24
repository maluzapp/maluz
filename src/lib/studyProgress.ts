import { incrementDailyUsage } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import type { Exercise, ExerciseAnswer } from '@/types/study';

interface AwardStudyProgressInput {
  profileId: string;
  subject: string;
  topic: string;
  year: string;
  score: number;
  total: number;
  exercises: Exercise[];
  answers: ExerciseAnswer[];
  countDailyUsage?: boolean;
  /** Quando definido, marca o nó da trilha como concluído via RPC e usa o XP por matéria como fonte de verdade. */
  trackNodeId?: string;
}

export function calculateXp(score: number, total: number) {
  const base = score * 10;
  const bonus = score === total ? 20 : 0;
  return base + bonus;
}

export async function awardStudyProgress({
  profileId,
  subject,
  topic,
  year,
  score,
  total,
  exercises,
  answers,
  countDailyUsage = false,
  trackNodeId,
}: AwardStudyProgressInput) {
  const xp = calculateXp(score, total);

  const { error: insertError } = await supabase.from('study_sessions').insert({
    profile_id: profileId,
    subject,
    topic,
    year,
    score,
    total,
    xp_earned: xp,
    exercises_data: JSON.parse(JSON.stringify(exercises)),
    answers_data: JSON.parse(JSON.stringify(answers)),
  });

  if (insertError) {
    return { xp, error: insertError };
  }

  if (countDailyUsage) {
    await incrementDailyUsage(profileId);
  }

  // Estudo livre alimenta a trilha em paralelo:
  // se o usuário NÃO veio explicitamente de um nó, garantimos que existe uma trilha
  // dessa matéria (criando automaticamente se necessário) e completamos o próximo nó disponível.
  let effectiveNodeId = trackNodeId;
  if (!effectiveNodeId) {
    let { data: tracks } = await supabase
      .from('learning_tracks')
      .select('id')
      .eq('profile_id', profileId)
      .eq('subject', subject);
    let trackIds = (tracks || []).map((t) => t.id);

    // Auto-cria trilha desta matéria se ainda não existir uma para o ano do perfil.
    if (trackIds.length === 0) {
      try {
        const { data: profileRow } = await supabase
          .from('profiles')
          .select('school_year')
          .eq('id', profileId)
          .maybeSingle();
        const targetYear = profileRow?.school_year || year;
        if (targetYear) {
          const { data: { session } } = await supabase.auth.getSession();
          await supabase.functions.invoke('generate-track', {
            headers: session ? { Authorization: `Bearer ${session.access_token}` } : undefined,
            body: { profile_id: profileId, subject, school_year: targetYear },
          });
          const { data: newTracks } = await supabase
            .from('learning_tracks')
            .select('id')
            .eq('profile_id', profileId)
            .eq('subject', subject);
          trackIds = (newTracks || []).map((t) => t.id);
        }
      } catch (e) {
        console.error('Auto-create track failed:', e);
      }
    }

    if (trackIds.length > 0) {
      const { data: availableNode } = await supabase
        .from('track_nodes')
        .select('id')
        .in('track_id', trackIds)
        .eq('status', 'available')
        .order('position', { ascending: true })
        .limit(1)
        .maybeSingle();
      if (availableNode) effectiveNodeId = availableNode.id;
    }
  }

  // Se vem de uma trilha (explícita ou auto-detectada): a RPC complete_track_node soma XP por matéria,
  // recalcula nível por matéria e atualiza profile.xp como soma das matérias.
  // NÃO somamos profile.xp aqui pra evitar dupla contagem.
  if (effectiveNodeId) {
    await supabase.rpc('complete_track_node', {
      _node_id: effectiveNodeId,
      _score: score,
      _xp_earned: xp,
    });
  }

  // Atualiza streak, totais e (quando NÃO é trilha) também XP global do perfil
  const { data: profile } = await supabase
    .from('profiles')
    .select('xp, level, streak_days, last_study_date, total_exercises, total_correct')
    .eq('id', profileId)
    .single();

  if (profile) {
    const today = new Date().toISOString().split('T')[0];
    const lastDate = profile.last_study_date;
    let newStreak = profile.streak_days || 0;
    if (lastDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      newStreak = lastDate === yesterdayStr ? newStreak + 1 : 1;
    }

    const newTotalExercises = (profile.total_exercises || 0) + total;
    const newTotalCorrect = (profile.total_correct || 0) + score;

    if (effectiveNodeId) {
      // RPC já atualizou profile.xp; só atualiza streak + totais aqui
      await supabase
        .from('profiles')
        .update({
          streak_days: newStreak,
          last_study_date: today,
          total_exercises: newTotalExercises,
          total_correct: newTotalCorrect,
        })
        .eq('id', profileId);
    } else {
      // Caminho legado: estudo livre -> também atribui XP no profile e na matéria
      const newXp = (profile.xp || 0) + xp;
      let newLevel = profile.level || 1;
      let remainingXp = newXp;
      while (remainingXp >= newLevel * 100) {
        remainingXp -= newLevel * 100;
        newLevel++;
      }

      await supabase
        .from('profiles')
        .update({
          xp: newXp,
          level: newLevel,
          streak_days: newStreak,
          last_study_date: today,
          total_exercises: newTotalExercises,
          total_correct: newTotalCorrect,
        })
        .eq('id', profileId);

      // Acumula XP por matéria (upsert + recalcula nível por matéria simples)
      const { data: existing } = await supabase
        .from('profile_subject_xp')
        .select('xp')
        .eq('profile_id', profileId)
        .eq('subject', subject)
        .maybeSingle();

      const subjectTotalXp = (existing?.xp || 0) + xp;
      let subjectLevel = 1;
      let r = subjectTotalXp;
      while (r >= subjectLevel * 100) {
        r -= subjectLevel * 100;
        subjectLevel += 1;
      }

      await supabase
        .from('profile_subject_xp')
        .upsert(
          { profile_id: profileId, subject, xp: subjectTotalXp, level: subjectLevel },
          { onConflict: 'profile_id,subject' },
        );
    }
  }

  return { xp, error: null };
}
