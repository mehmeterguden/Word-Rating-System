import React, { useEffect, useState } from 'react';
import WordSelectionContainer from './WordSelectionContainer';
import { subscribeToSelectionState, getSelectionState, initializeTextSelection } from '../utils/textSelectionManager';

interface WordSelectionProviderProps {
  children: React.ReactNode;
  onAddToWordList?: (word: string, translation: string) => void;
  sourceLanguage?: string;
  targetLanguage?: string;
}

const WordSelectionProvider: React.FC<WordSelectionProviderProps> = ({
  children,
  onAddToWordList,
  sourceLanguage = 'English',
  targetLanguage = 'Turkish'
}) => {
  const [selectionState, setSelectionState] = useState(getSelectionState());

  useEffect(() => {
    console.log('🚀 Initializing WordSelectionProvider with:', { sourceLanguage, targetLanguage });
    
    // Subscribe to global selection state changes
    const unsubscribe = subscribeToSelectionState((state) => {
      console.log('📡 Selection state changed:', state);
      setSelectionState(state);
    });

    // Initialize text selection system
    console.log('🔧 Setting up text selection listeners...');
    const cleanup = initializeTextSelection(sourceLanguage, targetLanguage, onAddToWordList);
    console.log('✅ Text selection listeners set up');

    return () => {
      console.log('🧹 Cleaning up WordSelectionProvider');
      unsubscribe();
      cleanup();
    };
  }, [sourceLanguage, targetLanguage, onAddToWordList]);

  return (
    <>
      {children}
      <WordSelectionContainer
        selectedWord={selectionState.selectedWord}
        position={selectionState.position}
        isVisible={selectionState.isVisible}
        onClose={() => {
          const currentState = getSelectionState();
          if (currentState.isVisible) {
            // Use the helper function to close
            import('../utils/textSelectionManager').then(({ hideWordSelection }) => {
              hideWordSelection();
            });
          }
        }}
        onAddToWordList={onAddToWordList}
        sourceLanguage={sourceLanguage}
        targetLanguage={targetLanguage}
      />
    </>
  );
};

export default WordSelectionProvider;
