import { create } from 'zustand';
import type { StudyConfig, ContentSummary, Exercise, ExerciseAnswer, SessionResult } from '@/types/study';

interface StudyState {
  config: StudyConfig | null;
  summary: ContentSummary | null;
  exercises: Exercise[];
  answers: ExerciseAnswer[];
  currentIndex: number;
  isLoading: boolean;
  sessionId: string | null;

  setConfig: (config: StudyConfig) => void;
  setSummary: (summary: ContentSummary) => void;
  setExercises: (exercises: Exercise[]) => void;
  addAnswer: (answer: ExerciseAnswer) => void;
  nextExercise: () => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
  getResult: () => SessionResult | null;
}

const createSessionId = () => crypto.randomUUID();

export const useStudyStore = create<StudyState>((set, get) => ({
  config: null,
  summary: null,
  exercises: [],
  answers: [],
  currentIndex: 0,
  isLoading: false,
  sessionId: null,

  setConfig: (config) => set({ config, summary: null, exercises: [], answers: [], currentIndex: 0, sessionId: createSessionId() }),
  setSummary: (summary) => set({ summary }),
  setExercises: (exercises) => set((state) => ({ exercises, answers: [], currentIndex: 0, sessionId: state.sessionId ?? createSessionId() })),
  addAnswer: (answer) => set((s) => ({ answers: [...s.answers, answer] })),
  nextExercise: () => set((s) => ({ currentIndex: s.currentIndex + 1 })),
  setLoading: (isLoading) => set({ isLoading }),
  reset: () => set({ config: null, summary: null, exercises: [], answers: [], currentIndex: 0, isLoading: false, sessionId: null }),
  getResult: () => {
    const { exercises, answers, config } = get();
    if (!config || exercises.length === 0) return null;
    const score = answers.filter((a) => a.isCorrect).length;
    return { exercises, answers, score, total: exercises.length, config, timestamp: Date.now() };
  },
}));
