import { useState, useEffect, useCallback, useRef } from 'react';
import { Word, DifficultyLevel } from '../types';
import * as XLSX from 'xlsx';

const STORAGE_KEY = 'word-rating-system-words';

export const useWords = (activeSetId?: string | null) => {
    const [words, setWords] = useState<Word[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const isInitialLoad = useRef(true);
    const lastActiveSetId = useRef<string | undefined | null>(activeSetId);

    // Load words from localStorage on mount
    useEffect(() => {
        // Only reload if activeSetId actually changed and is not null
        if (isInitialLoad.current || lastActiveSetId.current !== activeSetId) {
            if (activeSetId === null) {
                setWords([]);
                lastActiveSetId.current = activeSetId;
                if (isInitialLoad.current) {
                    setIsLoaded(true);
                    isInitialLoad.current = false;
                }
                return;
            }
            try {
                const savedWords = localStorage.getItem(STORAGE_KEY);

                if (savedWords) {
                    const parsedWords = JSON.parse(savedWords);

                    if (Array.isArray(parsedWords) && parsedWords.length > 0) {
                        // Filter words by active set if setId is provided
                        let filteredWords = activeSetId
                            ? parsedWords.filter((word: Word) => word.setId === activeSetId)
                            : parsedWords;

                        // Fix old words that don't have isEvaluated field
                        filteredWords = filteredWords.map((word: Word) => ({
                            ...word,
                            isEvaluated: word.isEvaluated !== undefined ? word.isEvaluated : (word.difficulty > 0),
                            text1: word.text1 || '',
                            text2: word.text2 || ''
                        }));

                        setWords(filteredWords);
                    } else {
                        setWords([]);
                    }
                } else {
                    setWords([]);
                }
            } catch (error) {
                console.error('Error loading from localStorage:', error);
                setWords([]);
            }

            lastActiveSetId.current = activeSetId;
        }

        if (isInitialLoad.current) {
            setIsLoaded(true);
            isInitialLoad.current = false;
        }
    }, [activeSetId]); // Only depend on activeSetId

    // Prevent saving during initial load or when activeSetId is undefined
    const shouldSave = isLoaded && !isInitialLoad.current && activeSetId;

    // Save words to localStorage only when explicitly needed
    const saveWordsToStorage = useCallback((wordsToSave: Word[]) => {
        if (!shouldSave) {
            return;
        }

        try {
            // Load all words first, then update only the current set's words
            const allWords = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

            // Remove words from current set
            const otherWords = allWords.filter((word: Word) => word.setId !== activeSetId);

            // Add current set's words
            const updatedAllWords = [...otherWords, ...wordsToSave];

            localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedAllWords));
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            try {
                sessionStorage.setItem(STORAGE_KEY, JSON.stringify(wordsToSave));
            } catch (sessionError) {
                console.error('Error saving to sessionStorage:', sessionError);
            }
        }
    }, [shouldSave, activeSetId]);

    const addWords = useCallback((wordList: string[], setId: string) => {
        const newWords: Word[] = wordList.map((text, index) => ({
            id: Date.now() + index,
            text1: text.trim(),
            text2: '', // Will be filled by the parsing logic in AddWords component
            difficulty: 0,
            isEvaluated: false,
            createdAt: new Date(),
            setId: setId
        }));

        setWords(prevWords => {
            const updatedWords = [...prevWords, ...newWords];

            // Save to storage immediately with the new words
            setTimeout(() => saveWordsToStorage(updatedWords), 0);

            return updatedWords;
        });
    }, [saveWordsToStorage]);

    const addBilingualWords = useCallback((wordPairs: { text1: string; text2: string; language1Name?: string; language2Name?: string }[], setId: string) => {
        const newWords: Word[] = wordPairs.map((pair, index) => ({
            id: Date.now() + index,
            text1: pair.text1.trim(),
            text2: pair.text2.trim(),
            language1Name: pair.language1Name,
            language2Name: pair.language2Name,
            difficulty: 0,
            isEvaluated: false,
            createdAt: new Date(),
            setId: setId
        }));

        setWords(prevWords => {
            const updatedWords = [...prevWords, ...newWords];

            // Save to storage immediately with the new words
            setTimeout(() => saveWordsToStorage(updatedWords), 0);

            return updatedWords;
        });
    }, [saveWordsToStorage]);

    const updateDifficulty = useCallback((id: number, difficulty: DifficultyLevel, internalScore?: number, averageResponseTime?: number, consecutiveCorrectForWord?: number) => {
        setWords(prevWords => {
            const updatedWords = prevWords.map(word =>
                word.id === id
                    ? {
                        ...word,
                        difficulty,
                        internalScore: internalScore !== undefined ? internalScore : word.internalScore,
                        averageResponseTime: averageResponseTime !== undefined ? averageResponseTime : word.averageResponseTime,
                        consecutiveCorrectForWord: consecutiveCorrectForWord !== undefined ? consecutiveCorrectForWord : word.consecutiveCorrectForWord,
                        isEvaluated: difficulty > 0
                    }
                    : word
            );

            // Save to storage immediately with the updated words
            setTimeout(() => saveWordsToStorage(updatedWords), 0);

            return updatedWords;
        });
    }, [saveWordsToStorage]);

    const removeWord = useCallback((id: number) => {
        setWords(prevWords => {
            const updatedWords = prevWords.filter(word => word.id !== id);

            // Save to storage immediately with the updated words
            setTimeout(() => saveWordsToStorage(updatedWords), 0);

            return updatedWords;
        });
    }, [saveWordsToStorage]);

    const resetEvaluation = useCallback(() => {
        setWords(prevWords => {
            const updatedWords = prevWords.map(word => ({
                ...word,
                difficulty: 0 as DifficultyLevel,
                isEvaluated: false
            }));

            // Save to storage immediately with the updated words
            setTimeout(() => saveWordsToStorage(updatedWords), 0);

            return updatedWords;
        });
    }, [saveWordsToStorage]);

    const exportToExcel = useCallback((setId: string) => {
        try {
            // Load all words and filter by set
            const allWords = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
            const setWords = allWords.filter((word: Word) => word.setId === setId);

            if (setWords.length === 0) {
                return null;
            }

            // Create worksheet data
            const worksheetData = setWords.map((word: Word) => ({
                'First Language': word.text1 || '',
                'Second Language': word.text2 || '',
                'Difficulty Level': word.difficulty || 0
            }));

            // Create workbook and worksheet
            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.json_to_sheet(worksheetData);

            // Set column widths
            worksheet['!cols'] = [
                { width: 20 }, // First Language
                { width: 20 }, // Second Language
                { width: 15 }  // Difficulty Level
            ];

            // Add worksheet to workbook
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Word Set');

            // Generate Excel file
            const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

            // Create download link
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);

            // Create filename with timestamp
            const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
            const filename = `word-set-${timestamp}.xlsx`;
            link.setAttribute('download', filename);

            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            return true;
        } catch (error) {
            console.error('Error exporting to Excel:', error);
            return false;
        }
    }, []);

    const exportToText = useCallback((setId: string) => {
        try {
            // Load all words and filter by set
            const allWords = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
            const setWords = allWords.filter((word: Word) => word.setId === setId);

            if (setWords.length === 0) {
                return null;
            }

            // Create text content
            const textContent = setWords.map((word: Word, index: number) =>
                `${index + 1}. ${word.text1} - ${word.text2} (Difficulty: ${word.difficulty})`
            ).join('\n');

            // Create and download file
            const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `word-set-${setId}.txt`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            return true;
        } catch (error) {
            console.error('Error exporting to text:', error);
            return false;
        }
    }, []);

    return {
        words,
        addWords,
        addBilingualWords,
        updateDifficulty,
        removeWord,
        resetEvaluation,
        exportToExcel,
        exportToText,
        saveWordsToStorage,
        isLoaded
    };
};
