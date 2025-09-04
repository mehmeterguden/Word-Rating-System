export type Page = 'home' | 'add' | 'evaluate' | 'sets' | 'debug';

export type DifficultyLevel = 0 | 1 | 2 | 3 | 4 | 5;

export interface Word {
  id: number;
  text1: string; // First language (e.g., English)
  text2: string; // Second language (e.g., Turkish)
  language1Name?: string; // Learning language name for text1
  language2Name?: string; // Known language name for text2
  difficulty: DifficultyLevel;
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
