// Sistema de níveis nomeados por matéria.
// XP necessário para subir do nível N para N+1: N * 100.

export const LEVEL_NAMES = [
  "Iniciante",       // Nv 1
  "Aprendiz",        // Nv 2
  "Explorador",      // Nv 3
  "Curioso",         // Nv 4
  "Iluminado",       // Nv 5
  "Sábio",           // Nv 6
  "Brilhante",       // Nv 7
  "Mestre",          // Nv 8
  "Mestre da Luz",   // Nv 9
  "Lenda",           // Nv 10+
] as const;

export const LEVEL_EMOJIS = [
  "🌱", "📖", "🔍", "💡", "✨", "🌟", "🪄", "🏆", "👑", "🌈",
] as const;

export function levelName(level: number): string {
  if (level < 1) return LEVEL_NAMES[0];
  return LEVEL_NAMES[Math.min(level - 1, LEVEL_NAMES.length - 1)];
}

export function levelEmoji(level: number): string {
  if (level < 1) return LEVEL_EMOJIS[0];
  return LEVEL_EMOJIS[Math.min(level - 1, LEVEL_EMOJIS.length - 1)];
}

export function nextLevelName(level: number): string {
  return levelName(level + 1);
}

/**
 * Recebe XP TOTAL acumulado na matéria. Retorna nível atual,
 * XP dentro do nível atual e XP necessário para o próximo nível.
 */
export function xpBreakdown(totalXp: number): {
  level: number;
  xpInLevel: number;
  xpForNext: number;
  progressPct: number;
} {
  let level = 1;
  let remaining = Math.max(0, totalXp);
  while (remaining >= level * 100) {
    remaining -= level * 100;
    level += 1;
  }
  const xpForNext = level * 100;
  return {
    level,
    xpInLevel: remaining,
    xpForNext,
    progressPct: Math.min(100, (remaining / xpForNext) * 100),
  };
}
