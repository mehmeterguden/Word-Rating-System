import { useState, useEffect, useCallback, useMemo } from 'react';
import { WordSet } from '../types';
import { DEFAULT_LANGUAGE1, DEFAULT_LANGUAGE2, DEFAULT_SEPARATOR } from '../utils/languages';

const STORAGE_KEY = 'word-rating-system-sets';
const ACTIVE_SET_KEY = 'word-rating-system-active-set';
const DEFAULT_LANGUAGES_KEY = 'word-rating-system-default-languages';

export const useWordSets = () => {
  const [wordSets, setWordSets] = useState<WordSet[]>([]);
  const [activeSetId, setActiveSetId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [defaultLanguage1, setDefaultLanguage1] = useState(DEFAULT_LANGUAGE1);
  const [defaultLanguage2, setDefaultLanguage2] = useState(DEFAULT_LANGUAGE2);
  const [defaultSeparator, setDefaultSeparator] = useState(DEFAULT_SEPARATOR);

  // Load word sets and default languages from localStorage on mount
  useEffect(() => {
    console.log('🎯 useWordSets: Loading from localStorage...');
    try {
      const savedSets = localStorage.getItem(STORAGE_KEY);
      const savedActiveSet = localStorage.getItem(ACTIVE_SET_KEY);
      const savedDefaultLanguages = localStorage.getItem(DEFAULT_LANGUAGES_KEY);
      
      if (savedSets) {
        const parsedSets = JSON.parse(savedSets);
        if (Array.isArray(parsedSets)) {
          setWordSets(parsedSets);
          console.log('✅ useWordSets: Successfully loaded word sets');
        }
      }
      
      if (savedActiveSet) {
        setActiveSetId(savedActiveSet);
        console.log('✅ useWordSets: Successfully loaded active set');
      }

      if (savedDefaultLanguages) {
        const parsedDefaults = JSON.parse(savedDefaultLanguages);
        if (parsedDefaults.language1) setDefaultLanguage1(parsedDefaults.language1);
        if (parsedDefaults.language2) setDefaultLanguage2(parsedDefaults.language2);
        if (parsedDefaults.separator) setDefaultSeparator(parsedDefaults.separator);
        console.log('✅ useWordSets: Successfully loaded default languages');
      }
    } catch (error) {
      console.error('❌ useWordSets: Error loading from localStorage:', error);
    }
    setIsLoaded(true);
  }, []);

  // Save word sets to localStorage whenever they change
  useEffect(() => {
    if (!isLoaded) {
      console.log('⏳ useWordSets: Not saving yet, still loading...');
      return;
    }
    
    console.log('💾 useWordSets: Saving to localStorage:', { wordSets, activeSetId });
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(wordSets));
      if (activeSetId) {
        localStorage.setItem(ACTIVE_SET_KEY, activeSetId);
      }
      console.log('✅ useWordSets: Successfully saved to localStorage');
    } catch (error) {
      console.error('❌ useWordSets: Error saving to localStorage:', error);
    }
  }, [wordSets, activeSetId, isLoaded]);

  // Save default languages to localStorage whenever they change
  useEffect(() => {
    if (!isLoaded) return;
    
    try {
      const defaultLanguages = {
        language1: defaultLanguage1,
        language2: defaultLanguage2,
        separator: defaultSeparator
      };
      localStorage.setItem(DEFAULT_LANGUAGES_KEY, JSON.stringify(defaultLanguages));
      console.log('💾 useWordSets: Saved default languages:', defaultLanguages);
    } catch (error) {
      console.error('❌ useWordSets: Error saving default languages:', error);
    }
  }, [defaultLanguage1, defaultLanguage2, defaultSeparator, isLoaded]);

  // Memoized values to prevent unnecessary re-renders
  const activeSet = useMemo(() => 
    wordSets.find(set => set.id === activeSetId) || null, 
    [wordSets, activeSetId]
  );

  const hasWordSets = useMemo(() => wordSets.length > 0, [wordSets]);

  // Create a new word set
  const createWordSet = useCallback((name: string, description?: string, language1?: string, language2?: string, separator?: string) => {
    const newSet: WordSet = {
      id: `set_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      language1: language1 || defaultLanguage1,
      language2: language2 || defaultLanguage2,
      separator: separator || defaultSeparator,
      createdAt: new Date(),
      isActive: false,
      wordCount: 0
    };

    setWordSets(prevSets => {
      const updatedSets = prevSets.map(set => ({ ...set, isActive: false }));
      return [...updatedSets, { ...newSet, isActive: true }];
    });

    setActiveSetId(newSet.id);
    console.log('🎯 useWordSets: Created new word set:', newSet);
    return newSet;
  }, [defaultLanguage1, defaultLanguage2, defaultSeparator]);

  // Delete a word set
  const deleteWordSet = useCallback((setId: string) => {
    setWordSets(prevSets => {
      const filteredSets = prevSets.filter(set => set.id !== setId);
      
      // If we're deleting the active set, activate the first available set
      if (activeSetId === setId && filteredSets.length > 0) {
        const newActiveSet = filteredSets[0];
        setActiveSetId(newActiveSet.id);
        return filteredSets.map(set => 
          set.id === newActiveSet.id ? { ...set, isActive: true } : { ...set, isActive: false }
        );
      }
      
      return filteredSets;
    });
    
    console.log('🎯 useWordSets: Deleted word set:', setId);
  }, [activeSetId]);

  // Set active word set
  const setActiveSet = useCallback((setId: string) => {
    setWordSets(prevSets => 
      prevSets.map(set => ({ 
        ...set, 
        isActive: set.id === setId 
      }))
    );
    setActiveSetId(setId);
    console.log('🎯 useWordSets: Set active word set:', setId);
  }, []);

  // Update word count for a set
  const updateWordCount = useCallback((setId: string, count: number) => {
    setWordSets(prevSets => 
      prevSets.map(set => 
        set.id === setId ? { ...set, wordCount: count } : set
      )
    );
  }, []);

  // Update word set name, description, and languages
  const updateWordSet = useCallback((setId: string, name: string, description?: string, language1?: string, language2?: string, separator?: string) => {
    setWordSets(prevSets => 
      prevSets.map(set => 
        set.id === setId ? { 
          ...set, 
          name, 
          description,
          language1: language1 || set.language1,
          language2: language2 || set.language2,
          separator: separator || set.separator
        } : set
      )
    );
    console.log('🎯 useWordSets: Updated word set:', setId, { name, description, language1, language2, separator });
  }, []);

  // Update default languages
  const updateDefaultLanguages = useCallback((language1: string, language2: string, separator: string) => {
    setDefaultLanguage1(language1);
    setDefaultLanguage2(language2);
    setDefaultSeparator(separator);
    console.log('🎯 useWordSets: Updated default languages:', { language1, language2, separator });
  }, []);

  // Get word set by ID
  const getWordSet = useCallback((setId: string): WordSet | null => {
    return wordSets.find(set => set.id === setId) || null;
  }, [wordSets]);

  // Get default word set (create if none exists)
  const getDefaultSet = useCallback((): WordSet => {
    if (wordSets.length === 0) {
      return createWordSet('Default Set', 'Your first word set');
    }
    return activeSet || wordSets[0];
  }, [wordSets, activeSet, createWordSet]);

  return {
    wordSets,
    activeSetId,
    activeSet,
    defaultLanguage1,
    defaultLanguage2,
    defaultSeparator,
    createWordSet,
    deleteWordSet,
    setActiveSet,
    updateWordCount,
    updateWordSet,
    updateDefaultLanguages,
    getWordSet,
    hasWordSets,
    getDefaultSet,
    isLoaded
  };
};
