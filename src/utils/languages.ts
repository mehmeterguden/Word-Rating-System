import languagesData from '../data/languages.json';

export const DEFAULT_LANGUAGE1 = 'English';
export const DEFAULT_LANGUAGE2 = 'Turkish';
export const DEFAULT_SEPARATOR = ' - ';

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

// Load languages from JSON file
export const LANGUAGES: Language[] = languagesData.languages;

// Validation function to check for duplicates
export const validateLanguages = (): { hasDuplicates: boolean; duplicates: string[] } => {
  const seenNames = new Set<string>();
  const seenCodes = new Set<string>();
  const duplicates: string[] = [];

  for (const lang of LANGUAGES) {
    if (seenNames.has(lang.name)) {
      duplicates.push(`Duplicate name: ${lang.name}`);
    } else {
      seenNames.add(lang.name);
    }

    if (seenCodes.has(lang.code)) {
      duplicates.push(`Duplicate code: ${lang.code}`);
    } else {
      seenCodes.add(lang.code);
    }
  }

  return {
    hasDuplicates: duplicates.length > 0,
    duplicates
  };
};

// Get unique languages by name (in case we need to filter duplicates)
export const getUniqueLanguages = (): Language[] => {
  const seenNames = new Set<string>();
  const uniqueLanguages: Language[] = [];

  for (const lang of LANGUAGES) {
    if (!seenNames.has(lang.name)) {
      seenNames.add(lang.name);
      uniqueLanguages.push(lang);
    }
  }

  return uniqueLanguages;
};

export const getLanguageByCode = (code: string): Language | undefined => {
  return LANGUAGES.find(lang => lang.code === code);
};

export const getLanguageByName = (name: string): Language | undefined => {
  return LANGUAGES.find(lang => lang.name === name || lang.nativeName === name);
};

// Get language flag directly from the language object
export const getLanguageFlag = (langName: string): string => {
  const lang = LANGUAGES.find(l => l.name === langName);
  return lang ? lang.flag : '🌐';
};

// Get language display name
export const getLanguageDisplay = (langName: string): string => {
  const lang = LANGUAGES.find(l => l.name === langName);
  return lang ? `${lang.name} (${lang.nativeName})` : langName;
};
