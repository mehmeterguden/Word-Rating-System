import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import Header from './components/Header';
import Navigation from './components/Navigation';
import Home from './pages/Home';
import AddWords from './pages/AddWords';
import EvaluationOptions from './pages/EvaluationOptions';
import Study from './pages/Study';
import WordSetManager from './pages/WordSetManager';
import DebugPage from './pages/DebugPage';
import Settings from './pages/Settings';
import EvaluationModal from './components/EvaluationModal';
import { useWords } from './hooks/useWords';
import { useEvaluation } from './hooks/useEvaluation';
import { useWordSets } from './hooks/useWordSets';
import { Page, Word } from './types';
import { registerModelSwitchCallback } from './utils/ai';
import { displayLevelToScore } from './utils/studyAlgorithm';
import ModelSwitchToast from './components/ModelSwitchToast';

function App() {
  const [developerMode, setDeveloperMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('word-rating-system-developer-mode') === 'true';
    } catch {
      return false;
    }
  });
  
  // Model switch notification state
  const [modelSwitchToast, setModelSwitchToast] = useState({
    isVisible: false,
    fromModel: '',
    toModel: '',
    reason: ''
  });
  
  // Word sets management
  const { 
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
    hasWordSets,
    getDefaultSet,
    isLoaded: setsLoaded 
  } = useWordSets();

  // Words management (filtered by active set)
  const { 
    words, 
    addWords, 
    addBilingualWords,
    updateDifficulty, 
    removeWord, 
    resetEvaluation,
    exportToExcel,
    exportToText,
    isLoaded: wordsLoaded 
  } = useWords(activeSetId || undefined);

  // Evaluation management
  const { 
    isEvaluationOpen, 
    showOptions, 
    evaluationWords,
    evaluationIndex,
    startEvaluation, 
    closeEvaluation, 
    nextEvaluation, 
    previousEvaluation,
    updateEvaluationWord,
    getCurrentWord, 
    getTotalEvaluationWords, 
    progressPercentage 
  } = useEvaluation(words);

  // Debug: monitor words state changes (only in development)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🏠 App: words state changed:', words.length, 'words');
      console.log('🏠 App: active set ID:', activeSetId);
    }
  }, [words.length, activeSetId]);

  // Debug: check localStorage status (only in development)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🏠 App: Component mounted, checking localStorage...');
      console.log('🏠 App: setsLoaded:', setsLoaded);
      console.log('🏠 App: wordsLoaded:', wordsLoaded);
    }
  }, [setsLoaded, wordsLoaded]);

  // Register model switch callback
  useEffect(() => {
    registerModelSwitchCallback((fromModel, toModel, reason) => {
      setModelSwitchToast({
        isVisible: true,
        fromModel,
        toModel,
        reason
      });
    });
  }, []);

  // Listen for developer mode changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'word-rating-system-developer-mode') {
        setDeveloperMode(e.newValue === 'true');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Update word count when words change
  useEffect(() => {
    if (activeSetId && wordsLoaded) {
      updateWordCount(activeSetId, words.length);
    }
  }, [words.length, activeSetId, wordsLoaded]);

  // Initialize default set if none exists
  useEffect(() => {
    if (setsLoaded && !hasWordSets) {
      const defaultSet = getDefaultSet();
      console.log('🏠 App: Created default set:', defaultSet);
    }
  }, [setsLoaded, hasWordSets, getDefaultSet]);

  const handleStartEvaluationWithWords = (selectedWords: Word[]) => {
    startEvaluation(selectedWords);
  };

  const handleAddWords = (wordPairs: { text1: string; text2: string; language1Name: string; language2Name: string }[]) => {
    console.log('🏠 App: handleAddWords called with:', wordPairs);
    console.log('🏠 App: Current words before adding:', words);
    console.log('🏠 App: Current words count:', words.length);
    console.log('🏠 App: Active set ID:', activeSetId);
    
    if (activeSetId) {
      addBilingualWords(wordPairs, activeSetId);
      console.log('🏠 App: addBilingualWords called, redirecting to home');
    } else {
      console.error('🏠 App: No active set selected');
    }
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Header 
          words={words}
        />
        <Navigation 
          words={words} 
          wordSets={wordSets}
          activeSetId={activeSetId}
          onSetActive={setActiveSet}
          developerMode={developerMode}
        />
        
        <main className="py-8">
          <Routes>
            <Route path="/" element={
              <Home 
                words={words}
                onUpdateDifficulty={(id, difficulty) => {
                  const internalScore = displayLevelToScore(difficulty);
                  updateDifficulty(id, difficulty, internalScore);
                }}
                onRemoveWord={removeWord}
                onResetEvaluation={resetEvaluation}
              />
            } />
            
            <Route path="/add" element={
              <AddWords 
                onAddWords={handleAddWords}
                activeSetId={activeSetId}
                wordSets={wordSets}
                defaultLanguage1={defaultLanguage1}
                defaultLanguage2={defaultLanguage2}
                defaultSeparator={defaultSeparator}
              />
            } />
            
            <Route path="/evaluate" element={
              <EvaluationOptions 
                words={words}
                onStartEvaluation={handleStartEvaluationWithWords}
                isEvaluationActive={isEvaluationOpen}
              />
            } />
            
            <Route path="/study" element={
              <Study 
                words={words}
                updateDifficulty={updateDifficulty}
              />
            } />
            
            <Route path="/sets" element={
              <WordSetManager
                wordSets={wordSets}
                activeSetId={activeSetId}
                onSetActive={setActiveSet}
                onCreateSet={createWordSet}
                onDeleteSet={deleteWordSet}
                onUpdateSet={updateWordSet}
                onExportToExcel={exportToExcel}
                onExportToText={exportToText}
              />
            } />
            
            <Route path="/settings" element={
              <Settings setDeveloperMode={setDeveloperMode} />
            } />
            
            {developerMode && (
              <Route path="/debug" element={<DebugPage />} />
            )}
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Evaluation Modal */}
        {isEvaluationOpen && (
          <EvaluationModal
            currentWord={getCurrentWord()}
            totalWords={getTotalEvaluationWords()}
            progressPercentage={progressPercentage()}
            currentIndex={evaluationIndex}
            targetLanguageName={getCurrentWord()?.language1Name || defaultLanguage1}
            sourceLanguageName={getCurrentWord()?.language2Name || defaultLanguage2}
            onRate={(difficulty) => {
              if (getCurrentWord()) {
                const currentWord = getCurrentWord()!;
                const internalScore = displayLevelToScore(difficulty);
                updateDifficulty(currentWord.id, difficulty, internalScore);
                updateEvaluationWord(currentWord.id, difficulty);
                nextEvaluation();
              }
            }}
            onClose={closeEvaluation}
            onPrevious={previousEvaluation}
            onNext={nextEvaluation}
          />
        )}
        
        {/* Model Switch Toast */}
        <ModelSwitchToast
          isVisible={modelSwitchToast.isVisible}
          fromModel={modelSwitchToast.fromModel}
          toModel={modelSwitchToast.toModel}
          reason={modelSwitchToast.reason}
          onClose={() => setModelSwitchToast(prev => ({ ...prev, isVisible: false }))}
        />
      </div>
    </Router>
  );
}

export default App;
