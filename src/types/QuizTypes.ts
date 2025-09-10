import { Word } from './index';

export type QuizMode = 'classic' | 'speed';

export interface QuizConfiguration {
  mode: QuizMode;
  difficulty: number;
  timeLimit?: number; // For speed mode (seconds)
  wordCount?: number;
  enableHints: boolean;
  sourceLanguageName: string;
  targetLanguageName: string;
  explanationLanguageName: string;
}

export interface QuizSession {
  id: string;
  mode: QuizMode;
  startTime: Date;
  endTime?: Date;
  responses: QuizResponse[];
  currentQuestionIndex: number;
  usedWordIds: Set<number>;
  quizWords: Word[];
  configuration: QuizConfiguration;
}

export interface QuizResponse {
  wordId: number;
  isCorrect: boolean;
  responseTime: number;
  timestamp: Date;
  timeRemaining?: number; // For speed mode
}

export interface QuizStats {
  totalWords: number;
  correctAnswers: number;
  incorrectAnswers: number;
  accuracy: number;
  currentStreak: number;
  longestStreak: number;
  averageResponseTime: number;
  totalTime: number;
  speedScore?: number; // For speed mode
}

export interface QuizQuestion {
  word: string;
  correctAnswer: string;
  options: QuizOption[];
  difficulty: number;
  timeLimit?: number; // For speed mode
}

export interface QuizOption {
  text: string;
  isCorrect: boolean;
  explanation?: string;
}

export interface QuizModeProps {
  words: Word[];
  updateDifficulty: (id: number, difficulty: number) => void;
  configuration: QuizConfiguration;
  onEndQuiz: () => void;
  onShowResult: (session: QuizSession, stats: QuizStats) => void;
}

export interface QuizModeSelectorProps {
  words: Word[];
  onModeSelect: (configuration: QuizConfiguration) => void;
  onBack: () => void;
}

export interface SpeedModeSettings {
  timePerQuestion: number; // seconds
  timeOptions: number[];
  showTimer: boolean;
  enableSpeedBonus: boolean;
}

export interface ClassicModeSettings {
  showProgress: boolean;
  allowSkip: boolean;
  showExplanations: boolean;
}
