import type { SchoolYear } from '@/types/study';

export const YEAR_OPTIONS: { value: SchoolYear; label: string }[] = [
  { value: '2', label: '2º ano' },
  { value: '3', label: '3º ano' },
  { value: '4', label: '4º ano' },
  { value: '5', label: '5º ano' },
  { value: '6', label: '6º ano' },
  { value: '7', label: '7º ano' },
  { value: '8', label: '8º ano' },
  { value: '9', label: '9º ano' },
  { value: '1M', label: '1º Médio' },
  { value: '2M', label: '2º Médio' },
  { value: '3M', label: '3º Médio' },
];

export function getYearLabel(value: string | null): string {
  return YEAR_OPTIONS.find((y) => y.value === value)?.label || '';
}
