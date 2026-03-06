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
        try {
            const savedState = localStorage.getItem(STORAGE_KEY);
            if (savedState) {
                const parsedState = JSON.parse(savedState);

                if (parsedState.evaluationWords && Array.isArray(parsedState.evaluationWords)) {
                    setEvaluationWords(parsedState.evaluationWords);
                    setEvaluationIndex(parsedState.evaluationIndex || 0);
                    setIsEvaluationOpen(parsedState.isEvaluationOpen || false);
                }
            }
        } catch (error) {
            console.error('Error loading from localStorage:', error);
        }
        setIsLoaded(true);
    }, []);

    // Save evaluation state to localStorage whenever it changes
    useEffect(() => {
        if (!isLoaded) {
            return;
        }

        try {
            const stateToSave = {
                isEvaluationOpen,
                evaluationWords,
                evaluationIndex
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            try {
                sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
                    isEvaluationOpen,
                    evaluationWords,
                    evaluationIndex
                }));
            } catch (sessionError) {
                console.error('Error saving to sessionStorage:', sessionError);
            }
        }
    }, [isEvaluationOpen, evaluationWords, evaluationIndex, isLoaded]);

    const startEvaluation = useCallback((selectedWords: Word[]) => {
        setEvaluationWords(selectedWords);
        setEvaluationIndex(0);
        setIsEvaluationOpen(true);
        setShowOptions(false);
    }, []);

    const closeEvaluation = useCallback(() => {
        setIsEvaluationOpen(false);
        setEvaluationWords([]);
        setEvaluationIndex(0);
        setShowOptions(false);
    }, []);

    const nextEvaluation = useCallback(() => {
        if (evaluationIndex < evaluationWords.length - 1) {
            setEvaluationIndex(prevIndex => prevIndex + 1);
        } else {
            closeEvaluation();
        }
    }, [evaluationIndex, evaluationWords.length, closeEvaluation]);

    const previousEvaluation = useCallback(() => {
        if (evaluationIndex > 0) {
            setEvaluationIndex(prevIndex => prevIndex - 1);
        }
    }, [evaluationIndex]);

    const goToEvaluation = useCallback((index: number) => {
        if (index >= 0 && index < evaluationWords.length) {
            setEvaluationIndex(index);
        }
    }, [evaluationWords.length]);

    const updateEvaluationWord = useCallback((wordId: number, difficulty: DifficultyLevel) => {
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
