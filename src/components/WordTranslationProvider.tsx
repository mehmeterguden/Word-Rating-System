import React, { useEffect, useState } from 'react';
import WordTranslationModal from './WordTranslationModal';
import { subscribeToTranslationState, getTranslationState } from '../utils/wordTranslationHelper';

interface WordTranslationProviderProps {
  children: React.ReactNode;
  onAddToWordList?: (word: string, translation: string) => void;
}

const WordTranslationProvider: React.FC<WordTranslationProviderProps> = ({
  children,
  onAddToWordList
}) => {
  const [translationState, setTranslationState] = useState(getTranslationState());

  useEffect(() => {
    const unsubscribe = subscribeToTranslationState((state) => {
      setTranslationState(state);
    });

    return unsubscribe;
  }, []);

  return (
    <>
      {children}
      <WordTranslationModal
        word={translationState.word}
        sourceLanguage={translationState.sourceLanguage}
        targetLanguage={translationState.targetLanguage}
        isOpen={translationState.isOpen}
        onClose={() => {
          const currentState = getTranslationState();
          if (currentState.isOpen) {
            // Use the helper function to close
            import('../utils/wordTranslationHelper').then(({ closeWordTranslation }) => {
              closeWordTranslation();
            });
          }
        }}
        onAddToWordList={onAddToWordList}
      />
    </>
  );
};

export default WordTranslationProvider;
