import { useState, useCallback } from 'react';

interface WordTranslationState {
  word: string;
  sourceLanguage: string;
  targetLanguage: string;
  isOpen: boolean;
}

interface UseWordTranslationReturn {
  // State
  translationState: WordTranslationState;
  
  // Actions
  openTranslation: (word: string, sourceLanguage: string, targetLanguage: string) => void;
  closeTranslation: () => void;
  
  // Props for WordTranslationModal
  modalProps: {
    word: string;
    sourceLanguage: string;
    targetLanguage: string;
    isOpen: boolean;
    onClose: () => void;
    onAddToWordList?: (word: string, translation: string) => void;
  };
}

export const useWordTranslation = (
  onAddToWordList?: (word: string, translation: string) => void
): UseWordTranslationReturn => {
  const [translationState, setTranslationState] = useState<WordTranslationState>({
    word: '',
    sourceLanguage: 'English',
    targetLanguage: 'Turkish',
    isOpen: false
  });

  const openTranslation = useCallback((
    word: string, 
    sourceLanguage: string = 'English', 
    targetLanguage: string = 'Turkish'
  ) => {
    setTranslationState({
      word: word.trim(),
      sourceLanguage,
      targetLanguage,
      isOpen: true
    });
  }, []);

  const closeTranslation = useCallback(() => {
    setTranslationState(prev => ({
      ...prev,
      isOpen: false
    }));
  }, []);

  const modalProps = {
    word: translationState.word,
    sourceLanguage: translationState.sourceLanguage,
    targetLanguage: translationState.targetLanguage,
    isOpen: translationState.isOpen,
    onClose: closeTranslation,
    onAddToWordList
  };

  return {
    translationState,
    openTranslation,
    closeTranslation,
    modalProps
  };
};

export default useWordTranslation;
