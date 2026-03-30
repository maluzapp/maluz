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

  const { data: profile } = await supabase
    .from('profiles')
    .select('xp, level, streak_days, last_study_date, total_exercises, total_correct')
    .eq('id', profileId)
    .single();

  if (profile) {
    const newXp = (profile.xp || 0) + xp;
    const newTotalExercises = (profile.total_exercises || 0) + total;
    const newTotalCorrect = (profile.total_correct || 0) + score;

    let newLevel = profile.level || 1;
    let remainingXp = newXp;
    while (remainingXp >= newLevel * 100) {
      remainingXp -= newLevel * 100;
      newLevel++;
    }

    const today = new Date().toISOString().split('T')[0];
    const lastDate = profile.last_study_date;
    let newStreak = profile.streak_days || 0;

    if (lastDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      newStreak = lastDate === yesterdayStr ? newStreak + 1 : 1;
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
  }

  return { xp, error: null };
}