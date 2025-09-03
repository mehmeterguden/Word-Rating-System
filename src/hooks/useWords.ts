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
    console.log('🔍 useWords: Loading from localStorage...');
    console.log('🔍 useWords: Active set ID:', activeSetId);
    console.log('🔍 useWords: Last active set ID:', lastActiveSetId.current);
    
    // Only reload if activeSetId actually changed and is not null
    if (isInitialLoad.current || lastActiveSetId.current !== activeSetId) {
      if (activeSetId === null) {
        console.log('🔍 useWords: Active set ID is null, setting empty words array');
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
        console.log('🔍 useWords: Raw localStorage data:', savedWords);
        
        if (savedWords) {
          const parsedWords = JSON.parse(savedWords);
          console.log('🔍 useWords: Parsed words:', parsedWords);
          
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
            
            console.log('✅ useWords: Successfully loaded', filteredWords.length, 'words for set:', activeSetId);
            setWords(filteredWords);
          } else {
            console.log('⚠️ useWords: Invalid data format, starting with empty array');
            setWords([]);
          }
        } else {
          console.log('ℹ️ useWords: No saved words found, starting with empty array');
          setWords([]);
        }
      } catch (error) {
        console.error('❌ useWords: Error loading from localStorage:', error);
        setWords([]);
      }
      
      lastActiveSetId.current = activeSetId;
    }
    
    if (isInitialLoad.current) {
      setIsLoaded(true);
      isInitialLoad.current = false;
    }
  }, [activeSetId]); // Only depend on activeSetId

  // Save words to localStorage whenever words state changes
  useEffect(() => {
    if (!isLoaded || isInitialLoad.current) {
      console.log('⏳ useWords: Not saving yet, still loading or initial load...');
      return;
    }
    
    // Prevent saving if activeSetId is undefined
    if (!activeSetId) {
      console.log('⏳ useWords: No active set ID, not saving...');
      return;
    }
    
    console.log('💾 useWords: Saving to localStorage. Words count:', words.length);
    console.log('💾 useWords: Active set ID:', activeSetId);
    
    try {
      // Load all words first, then update only the current set's words
      const allWords = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      console.log('💾 useWords: All words in localStorage:', allWords.length);
      
      // Remove words from current set
      const otherWords = allWords.filter((word: Word) => word.setId !== activeSetId);
      console.log('💾 useWords: Other words (not current set):', otherWords.length);
      
      // Add current set's words
      const updatedAllWords = [...otherWords, ...words];
      console.log('💾 useWords: Total words after update:', updatedAllWords.length);
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedAllWords));
      console.log('✅ useWords: Successfully saved to localStorage');
    } catch (error) {
      console.error('❌ useWords: Error saving to localStorage:', error);
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(words));
        console.log('🔄 useWords: Saved to sessionStorage as fallback');
      } catch (sessionError) {
        console.error('❌ useWords: Error saving to sessionStorage:', sessionError);
      }
    }
  }, [words, isLoaded, activeSetId]);

  const addWords = useCallback((wordList: string[], setId: string) => {
    console.log('➕ useWords: Adding words to set:', setId, wordList);
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
      console.log('✅ useWords: Added', newWords.length, 'words. Total words in set:', updatedWords.length);
      return updatedWords;
    });
  }, []);

  const addBilingualWords = useCallback((wordPairs: { text1: string; text2: string }[], setId: string) => {
    console.log('➕ useWords: Adding bilingual words to set:', setId, wordPairs);
    const newWords: Word[] = wordPairs.map((pair, index) => ({
      id: Date.now() + index,
      text1: pair.text1.trim(),
      text2: pair.text2.trim(),
      difficulty: 0,
      isEvaluated: false,
      createdAt: new Date(),
      setId: setId
    }));
    
    setWords(prevWords => {
      const updatedWords = [...prevWords, ...newWords];
      console.log('✅ useWords: Added', newWords.length, 'bilingual words. Total words in set:', updatedWords.length);
      return updatedWords;
    });
  }, []);

  const updateDifficulty = useCallback((id: number, difficulty: DifficultyLevel) => {
    console.log('🔄 useWords: Updating difficulty for word', id, 'to', difficulty);
    setWords(prevWords => 
      prevWords.map(word => 
        word.id === id 
          ? { ...word, difficulty, isEvaluated: difficulty > 0 }
          : word
      )
    );
  }, []);

  const removeWord = useCallback((id: number) => {
    console.log('🗑️ useWords: Removing word with id:', id);
    setWords(prevWords => {
      const updatedWords = prevWords.filter(word => word.id !== id);
      console.log('✅ useWords: Removed word. Total words in set:', updatedWords.length);
      return updatedWords;
    });
  }, []);

  const resetEvaluation = useCallback(() => {
    console.log('🔄 useWords: Resetting evaluation for all words');
    setWords(prevWords => 
      prevWords.map(word => ({ 
        ...word, 
        difficulty: 0, 
        isEvaluated: false 
      }))
    );
  }, []);

  const exportToExcel = useCallback((setId: string) => {
    console.log('📊 useWords: Exporting to Excel for set:', setId);
    
    try {
      // Load all words and filter by set
      const allWords = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      const setWords = allWords.filter((word: Word) => word.setId === setId);
      
      if (setWords.length === 0) {
        console.log('⚠️ useWords: No words found for set:', setId);
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
      
      console.log('✅ useWords: Successfully exported to Excel');
      return true;
    } catch (error) {
      console.error('❌ useWords: Error exporting to Excel:', error);
      return false;
    }
  }, []);

  const exportToText = useCallback((setId: string) => {
    console.log('📝 useWords: Exporting to text for set:', setId);
    
    try {
      // Load all words and filter by set
      const allWords = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      const setWords = allWords.filter((word: Word) => word.setId === setId);
      
      if (setWords.length === 0) {
        console.log('⚠️ useWords: No words found for set:', setId);
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
      
      console.log('✅ useWords: Successfully exported to text');
      return true;
    } catch (error) {
      console.error('❌ useWords: Error exporting to text:', error);
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
    isLoaded
  };
};
