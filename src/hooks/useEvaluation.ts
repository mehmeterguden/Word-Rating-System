import { useState, useEffect, useCallback } from 'react';
import { Word, DifficultyLevel } from '../types';

const STORAGE_KEY = 'word-rating-system-evaluation';

export const useEvaluation = (words: Word[]) => {
  const [isEvaluationOpen, setIsEvaluationOpen] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [evaluationWords, setEvaluationWords] = useState<Word[]>([]);
  const [evaluationIndex, setEvaluationIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load evaluation state from localStorage on mount
  useEffect(() => {
    console.log('🎯 useEvaluation: Loading from localStorage...');
    try {
      const savedState = localStorage.getItem(STORAGE_KEY);
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        console.log('🎯 useEvaluation: Parsed state:', parsedState);
        
        if (parsedState.evaluationWords && Array.isArray(parsedState.evaluationWords)) {
          setEvaluationWords(parsedState.evaluationWords);
          setEvaluationIndex(parsedState.evaluationIndex || 0);
          setIsEvaluationOpen(parsedState.isEvaluationOpen || false);
          console.log('✅ useEvaluation: Successfully loaded evaluation state');
        }
      }
    } catch (error) {
      console.error('❌ useEvaluation: Error loading from localStorage:', error);
    }
    setIsLoaded(true);
  }, []);

  // Save evaluation state to localStorage whenever it changes
  useEffect(() => {
    if (!isLoaded) {
      console.log('⏳ useEvaluation: Not saving yet, still loading...');
      return;
    }
    
    console.log('💾 useEvaluation: Saving to localStorage:', {
      isEvaluationOpen,
      evaluationWords,
      evaluationIndex
    });
    
    try {
      const stateToSave = {
        isEvaluationOpen,
        evaluationWords,
        evaluationIndex
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
      console.log('✅ useEvaluation: Successfully saved to localStorage');
    } catch (error) {
      console.error('❌ useEvaluation: Error saving to localStorage:', error);
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
          isEvaluationOpen,
          evaluationWords,
          evaluationIndex
        }));
        console.log('🔄 useEvaluation: Saved to sessionStorage as fallback');
      } catch (sessionError) {
        console.error('❌ useEvaluation: Error saving to sessionStorage:', sessionError);
      }
    }
  }, [isEvaluationOpen, evaluationWords, evaluationIndex, isLoaded]);

  const startEvaluation = useCallback((selectedWords: Word[]) => {
    console.log('🎯 useEvaluation: Starting evaluation with', selectedWords.length, 'words');
    setEvaluationWords(selectedWords);
    setEvaluationIndex(0);
    setIsEvaluationOpen(true);
    setShowOptions(false);
  }, []);

  const closeEvaluation = useCallback(() => {
    console.log('🎯 useEvaluation: Closing evaluation');
    setIsEvaluationOpen(false);
    setEvaluationWords([]);
    setEvaluationIndex(0);
    setShowOptions(false);
  }, []);

  const nextEvaluation = useCallback(() => {
    console.log('🎯 useEvaluation: Moving to next evaluation');
    if (evaluationIndex < evaluationWords.length - 1) {
      setEvaluationIndex(prevIndex => prevIndex + 1);
    } else {
      console.log('🎯 useEvaluation: Evaluation completed, closing');
      closeEvaluation();
    }
  }, [evaluationIndex, evaluationWords.length, closeEvaluation]);

  const previousEvaluation = useCallback(() => {
    console.log('🎯 useEvaluation: Moving to previous evaluation');
    if (evaluationIndex > 0) {
      setEvaluationIndex(prevIndex => prevIndex - 1);
    }
  }, [evaluationIndex]);

  const goToEvaluation = useCallback((index: number) => {
    console.log('🎯 useEvaluation: Going to evaluation index:', index);
    if (index >= 0 && index < evaluationWords.length) {
      setEvaluationIndex(index);
    }
  }, [evaluationWords.length]);

  const updateEvaluationWord = useCallback((wordId: number, difficulty: DifficultyLevel) => {
    console.log('🎯 useEvaluation: Updating evaluation word:', wordId, 'with difficulty:', difficulty);
    setEvaluationWords(prevWords => 
      prevWords.map(word => 
        word.id === wordId 
          ? { ...word, difficulty, isEvaluated: difficulty > 0 }
          : word
      )
    );
  }, []);

  const getCurrentWord = useCallback((): Word | null => {
    return evaluationWords[evaluationIndex] || null;
  }, [evaluationWords, evaluationIndex]);

  const getTotalEvaluationWords = useCallback((): number => {
    return evaluationWords.length;
  }, [evaluationWords]);

  const progressPercentage = useCallback((): number => {
    if (evaluationWords.length === 0) return 0;
    return Math.round(((evaluationIndex + 1) / evaluationWords.length) * 100);
  }, [evaluationIndex, evaluationWords.length]);

  return {
    isEvaluationOpen,
    showOptions,
    evaluationWords,
    evaluationIndex,
    startEvaluation,
    closeEvaluation,
    nextEvaluation,
    previousEvaluation,
    goToEvaluation,
    updateEvaluationWord,
    getCurrentWord,
    getTotalEvaluationWords,
    progressPercentage
  };
};
