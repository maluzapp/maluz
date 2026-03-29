export type SchoolYear = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '1M' | '2M' | '3M';

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

export type ExerciseType = 'multiple_choice' | 'true_false' | 'fill_blank' | 'matching' | 'ordering' | 'complete_sentence' | 'column_classification';

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
  sentence: string;
  answer: string;
  explanation: string;
}

export interface MatchingExercise {
  type: 'matching';
  pairs: { left: string; right: string }[];
  explanation: string;
}

export interface OrderingExercise {
  type: 'ordering';
  question: string;
  items: string[];
  correctOrder: number[];
  explanation: string;
}

export interface CompleteSentenceExercise {
  type: 'complete_sentence';
  sentence: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface ColumnClassificationExercise {
  type: 'column_classification';
  question: string;
  columns: string[];
  items: { text: string; column: number }[];
  explanation: string;
}

export type Exercise = MultipleChoiceExercise | TrueFalseExercise | FillBlankExercise | MatchingExercise | OrderingExercise | CompleteSentenceExercise | ColumnClassificationExercise;

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
