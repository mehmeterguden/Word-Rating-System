import { useState, useEffect, useCallback } from 'react';

interface WordSelectionState {
  selectedWord: string;
  position: { x: number; y: number };
  isVisible: boolean;
}

interface UseWordSelectionReturn {
  // State
  selectionState: WordSelectionState;
  
  // Actions
  showSelection: (word: string, position: { x: number; y: number }) => void;
  hideSelection: () => void;
  
  // Props for WordSelectionContainer
  containerProps: {
    selectedWord: string;
    position: { x: number; y: number };
    isVisible: boolean;
    onClose: () => void;
    onAddToWordList?: (word: string, translation: string) => void;
    sourceLanguage?: string;
    targetLanguage?: string;
  };
}

export const useWordSelection = (
  onAddToWordList?: (word: string, translation: string) => void,
  sourceLanguage: string = 'English',
  targetLanguage: string = 'Turkish'
): UseWordSelectionReturn => {
  const [selectionState, setSelectionState] = useState<WordSelectionState>({
    selectedWord: '',
    position: { x: 0, y: 0 },
    isVisible: false
  });

  const showSelection = useCallback((word: string, position: { x: number; y: number }) => {
    setSelectionState({
      selectedWord: word.trim(),
      position,
      isVisible: true
    });
  }, []);

  const hideSelection = useCallback(() => {
    setSelectionState(prev => ({
      ...prev,
      isVisible: false
    }));
  }, []);

  const containerProps = {
    selectedWord: selectionState.selectedWord,
    position: selectionState.position,
    isVisible: selectionState.isVisible,
    onClose: hideSelection,
    onAddToWordList,
    sourceLanguage,
    targetLanguage
  };

  return {
    selectionState,
    showSelection,
    hideSelection,
    containerProps
  };
};

export default useWordSelection;
