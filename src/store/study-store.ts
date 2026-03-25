import { create } from 'zustand';
import type { StudyConfig, ContentSummary, Exercise, ExerciseAnswer, SessionResult } from '@/types/study';

interface StudyState {
  config: StudyConfig | null;
  summary: ContentSummary | null;
  exercises: Exercise[];
  answers: ExerciseAnswer[];
  currentIndex: number;
  isLoading: boolean;

  setConfig: (config: StudyConfig) => void;
  setSummary: (summary: ContentSummary) => void;
  setExercises: (exercises: Exercise[]) => void;
  addAnswer: (answer: ExerciseAnswer) => void;
  nextExercise: () => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
  getResult: () => SessionResult | null;
}

export const useStudyStore = create<StudyState>((set, get) => ({
  config: null,
  summary: null,
  exercises: [],
  answers: [],
  currentIndex: 0,
  isLoading: false,

  setConfig: (config) => set({ config }),
  setSummary: (summary) => set({ summary }),
  setExercises: (exercises) => set({ exercises, answers: [], currentIndex: 0 }),
  addAnswer: (answer) => set((s) => ({ answers: [...s.answers, answer] })),
  nextExercise: () => set((s) => ({ currentIndex: s.currentIndex + 1 })),
  setLoading: (isLoading) => set({ isLoading }),
  reset: () => set({ config: null, summary: null, exercises: [], answers: [], currentIndex: 0, isLoading: false }),
  getResult: () => {
    const { exercises, answers, config } = get();
    if (!config || exercises.length === 0) return null;
    const score = answers.filter((a) => a.isCorrect).length;
    return { exercises, answers, score, total: exercises.length, config, timestamp: Date.now() };
  },
}));
