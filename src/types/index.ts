export type Page = 'home' | 'add' | 'evaluate' | 'study' | 'sets' | 'settings' | 'debug' | 'login' | 'register';

export type DifficultyLevel = 0 | 1 | 2 | 3 | 4 | 5;

export interface Word {
  id: number;
  text1: string; // First language (e.g., English)
  text2: string; // Second language (e.g., Turkish)
  language1Name?: string; // Learning language name for text1
  language2Name?: string; // Known language name for text2
  difficulty: DifficultyLevel;
  internalScore?: number; // Internal score for algorithm (0.5-5.5)
  averageResponseTime?: number; // Average response time in milliseconds
  consecutiveCorrectForWord?: number; // Consecutive correct for this specific word
  isEvaluated: boolean;
  createdAt: Date;
  setId: string;
}

export interface WordSet {
  id: string;
  name: string;
  description?: string;
  language1: string; // First language name
  language2: string; // Second language name
  separator: string; // Separator character (e.g., "-", "|", "=")
  createdAt: Date;
  isActive: boolean;
  wordCount: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  wordId?: number; // To track which word this message belongs to
}

export interface AiResult {
  definition?: string;
  partOfSpeech?: string;
  pronunciation?: string;
  alternativePronunciation?: string;
  cefrLevel?: string;
  verbForms?: {
    infinitive: string;
    past: string;
    pastParticiple: string;
    presentParticiple: string;
    thirdPersonSingular: string;
  };
  examples?: Array<{ sentence: string; translation?: string }>;
  synonyms?: Array<{ word: string; isExact: boolean }>;
  antonyms?: Array<{ word: string; isExact: boolean }>;
  tips?: string[];
  wordId?: number; // To track which word this result belongs to
}

export interface Language {
  code: string;
  name: string;
  nativeName: string;
}

export interface DifficultyInfo {
  level: DifficultyLevel;
  label: string;
  color: string;
  bgColor: string;
}

// Word Translation Types
export interface TranslationResult {
  originalWord: string;
  translation: string;
  confidence: 'high' | 'medium' | 'low';
  alternatives?: string[]; // Alternative translations
  context?: string; // Usage context or note
}

export interface TranslationResponse {
  translations: TranslationResult[];
  separator: string;
  formattedText: string; // Ready-to-use formatted text with separator
  prompt?: string; // The prompt that was sent to AI (optional)
}
