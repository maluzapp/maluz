export type SchoolYear = '6' | '7' | '8' | '9';

export type Subject = 
  | 'Matemática'
  | 'Português'
  | 'Ciências'
  | 'História'
  | 'Geografia'
  | 'Inglês'
  | 'Artes'
  | 'Educação Física';

export interface StudyConfig {
  year: SchoolYear;
  subject: Subject;
  topic: string;
  images: File[];
  audioBlob?: Blob;
}

export interface ContentSummary {
  title: string;
  summary: string;
  keyPoints: string[];
}

export type ExerciseType = 'multiple_choice' | 'true_false' | 'fill_blank' | 'matching';

export interface MultipleChoiceExercise {
  type: 'multiple_choice';
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface TrueFalseExercise {
  type: 'true_false';
  statement: string;
  correct: boolean;
  explanation: string;
}

export interface FillBlankExercise {
  type: 'fill_blank';
  sentence: string; // use ___ for the blank
  answer: string;
  explanation: string;
}

export interface MatchingExercise {
  type: 'matching';
  pairs: { left: string; right: string }[];
  explanation: string;
}

export type Exercise = MultipleChoiceExercise | TrueFalseExercise | FillBlankExercise | MatchingExercise;

export interface ExerciseAnswer {
  exerciseIndex: number;
  isCorrect: boolean;
  userAnswer: string;
}

export interface SessionResult {
  exercises: Exercise[];
  answers: ExerciseAnswer[];
  score: number;
  total: number;
  config: StudyConfig;
  timestamp: number;
}
