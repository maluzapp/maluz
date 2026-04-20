import type { Subject } from '@/types/study';

/**
 * Mapeamento OFICIAL de emoji por matéria.
 * Cada matéria tem seu próprio ícone consistente em TODO o sistema:
 * dashboard, desafios, resultados, geração, modais e compartilhamentos.
 */
export const SUBJECT_EMOJIS: Record<Subject, string> = {
  'Matemática': '🔢',
  'Português': '📝',
  'Ciências': '🔬',
  'História': '🏛️',
  'Geografia': '🌍',
  'Inglês': '🇬🇧',
  'Artes': '🎨',
  'Educação Física': '⚽',
};

export const SUBJECTS: Subject[] = [
  'Matemática',
  'Português',
  'Ciências',
  'História',
  'Geografia',
  'Inglês',
  'Artes',
  'Educação Física',
];

/** Retorna o emoji da matéria. Fallback para 📚 quando não houver match. */
export function getSubjectEmoji(subject: string | null | undefined): string {
  if (!subject) return '📚';
  return SUBJECT_EMOJIS[subject as Subject] ?? '📚';
}
