import { useState, useCallback, useEffect } from 'react';
import { Word, DifficultyLevel } from '../types';
import {
  StudyResponse,
  StudySession,
  calculateNewScore,
  scoreToDisplayLevel,
  displayLevelToScore,
  calculateSessionStats,
  generateSessionId,
  calculateWordPriority,
  calculateSmartAverageResponseTime
} from '../utils/studyAlgorithm';

interface StudyWord extends Word {
  internalScore: number;
  consecutiveCorrect: number;
  lastStudiedTime?: number;
  studyResponses: StudyResponse[];
}

interface UseStudyAlgorithmProps {
  updateDifficulty?: (id: number, difficulty: DifficultyLevel, internalScore?: number, averageResponseTime?: number, consecutiveCorrectForWord?: number) => void;
}

interface UseStudyAlgorithmReturn {
  // Session state
  currentSession: StudySession | null;
  isStudyActive: boolean;
  currentWord: StudyWord | null;
  currentIndex: number;
  studyWords: StudyWord[];
  
  // Session control
  startStudySession: (words: Word[]) => void;
  endStudySession: () => void;
  pauseSession: () => void;
  resumeSession: () => void;
  
  // Word interaction
  respondToWord: (isKnown: boolean, responseTime?: number) => void;
  skipWord: () => void;
  goToPreviousWord: () => void;
  rollbackResponse: () => void;
  
  // Score change tracking
  lastScoreChange: {
    previousScore: number;
    newScore: number;
    previousLevel: number;
    newLevel: number;
    isKnown: boolean;
    consecutiveCorrect: number;
    scoreDifference: number;
    levelDifference: number;
    wordText: string;
    wordId: number;
    algorithmDetails: {
      isEasy: boolean;
      isMedium: boolean;
      isHard: boolean;
      timeFactor: number;
      learningRate: number;
      baseDecrement?: number;
      baseIncrement?: number;
      consecutiveBonus?: number;
      masteryBonus?: number;
      failurePenalty?: number;
      totalDecrement?: number;
      totalIncrement?: number;
      recentFailures?: number;
      hoursSinceStudied?: number;
    };
  } | null;
  
  // Progress and stats
  sessionProgress: number;
  sessionStats: ReturnType<typeof calculateSessionStats>;
  
  // State queries
  hasNextWord: boolean;
  hasPreviousWord: boolean;
  canGoBack: boolean;
}

export function useStudyAlgorithm({ updateDifficulty }: UseStudyAlgorithmProps = {}): UseStudyAlgorithmReturn {
  const [currentSession, setCurrentSession] = useState<StudySession | null>(null);
  const [isStudyActive, setIsStudyActive] = useState(false);
  const [studyWords, setStudyWords] = useState<StudyWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentWord, setCurrentWord] = useState<StudyWord | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [wordHistory, setWordHistory] = useState<number[]>([]); // Track word navigation history
  const [responseHistory, setResponseHistory] = useState<Map<number, StudyResponse>>(new Map()); // Track responses for rollback
  const [lastScoreChange, setLastScoreChange] = useState<{
    previousScore: number;
    newScore: number;
    previousLevel: number;
    newLevel: number;
    isKnown: boolean;
    consecutiveCorrect: number;
    scoreDifference: number;
    levelDifference: number;
    wordText: string;
    wordId: number;
    algorithmDetails: {
      isEasy: boolean;
      isMedium: boolean;
      isHard: boolean;
      timeFactor: number;
      learningRate: number;
      baseDecrement?: number;
      baseIncrement?: number;
      consecutiveBonus?: number;
      masteryBonus?: number;
      failurePenalty?: number;
      totalDecrement?: number;
      totalIncrement?: number;
      recentFailures?: number;
      hoursSinceStudied?: number;
    };
  } | null>(null);

  // Convert regular words to study words
  const initializeStudyWords = useCallback((words: Word[]): StudyWord[] => {
    return words.map(word => ({
      ...word,
      internalScore: word.internalScore || displayLevelToScore(word.difficulty || 3),
      consecutiveCorrect: 0,
      consecutiveCorrectForWord: word.consecutiveCorrectForWord || 0,
      averageResponseTime: word.averageResponseTime,
      studyResponses: [],
    }));
  }, []);

  // Smart shuffle with weighted randomization based on difficulty and performance
  const sortWordsByPriority = useCallback((words: StudyWord[]): StudyWord[] => {
    // Create a weighted random shuffle
    const shuffled = [...words];
    
    // Fisher-Yates shuffle with difficulty weighting
    for (let i = shuffled.length - 1; i > 0; i--) {
      // Higher difficulty words have slightly higher chance to appear earlier
      // but still maintain good randomization
      const difficultyWeight = shuffled[i].internalScore / 5.5; // 0.09 to 1.0
      const randomWeight = Math.random() * (1 + difficultyWeight * 0.3); // Add 30% weight max
      
      const j = Math.floor(randomWeight * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    // Further shuffle to ensure good distribution
    return shuffled.sort(() => {
      const priorityFactor = (Math.random() - 0.5) * 2; // -1 to 1
      const difficultyFactor = (Math.random() - 0.3) * 0.4; // Slight bias toward harder but mostly random
      return priorityFactor + difficultyFactor;
    });
  }, []);

  // Start a new study session
  const startStudySession = useCallback((words: Word[]) => {
    if (words.length === 0) return;

    const sessionId = generateSessionId();
    const initialStudyWords = initializeStudyWords(words);
    const sortedWords = sortWordsByPriority(initialStudyWords);

    const session: StudySession = {
      sessionId,
      startTime: Date.now(),
      responses: [],
      totalWords: words.length,
      correctAnswers: 0,
      incorrectAnswers: 0,
    };

    setCurrentSession(session);
    setStudyWords(sortedWords);
    setCurrentIndex(0);
    setCurrentWord(sortedWords[0] || null);
    setIsStudyActive(true);
    setIsPaused(false);
    setWordHistory([0]); // Start with first word in history
    setResponseHistory(new Map()); // Clear response history

    console.log('🎓 Study session started:', sessionId, 'with', words.length, 'words');
  }, [initializeStudyWords, sortWordsByPriority]);

  // End current study session
  const endStudySession = useCallback(() => {
    setIsStudyActive(false);
    setIsPaused(false);
    setCurrentIndex(0);
    setCurrentWord(null);
    console.log('🎓 Study session ended');
  }, []);

  // Pause/Resume session
  const pauseSession = useCallback(() => {
    setIsPaused(true);
  }, []);

  const resumeSession = useCallback(() => {
    setIsPaused(false);
  }, []);

  // Handle word response (Know/Don't Know)
  const respondToWord = useCallback((isKnown: boolean, responseTime?: number) => {
    if (!currentSession || !isStudyActive || isPaused || currentIndex >= studyWords.length) {
      return;
    }

    const currentWord = studyWords[currentIndex];
    const previousScore = currentWord.internalScore;
    const consecutiveCorrect = isKnown ? currentWord.consecutiveCorrect : 0;
    const consecutiveCorrectForWord = isKnown ? (currentWord.consecutiveCorrectForWord || 0) : 0;
    
    // Calculate new score using advanced algorithm
    const { newScore, algorithmDetails } = calculateNewScore(
      previousScore,
      isKnown,
      consecutiveCorrect,
      currentWord.lastStudiedTime,
      currentWord.studyResponses,
      responseTime,
      currentWord.averageResponseTime,
      consecutiveCorrectForWord
    );

    // Store previous response for potential rollback
    const previousResponse = responseHistory.get(currentWord.id);
    
    // Create response record
    const response: StudyResponse = {
      wordId: currentWord.id,
      isKnown,
      timestamp: Date.now(),
      responseTime: responseTime || 0,
      previousScore,
      newScore,
      consecutiveCorrect: isKnown ? consecutiveCorrect + 1 : 0,
      consecutiveCorrectForWord: isKnown ? consecutiveCorrectForWord + 1 : 0,
    };

    // Calculate new average response time using smart algorithm
    const allResponses = [...currentWord.studyResponses, response];
    const responseTimes = allResponses.map(r => r.responseTime).filter(t => t > 0);
    const newAverageResponseTime = calculateSmartAverageResponseTime(
      responseTimes,
      responseTime || 0,
      currentWord.averageResponseTime
    );

    // Update word data
    const updatedWord: StudyWord = {
      ...currentWord,
      internalScore: newScore,
      difficulty: scoreToDisplayLevel(newScore),
      consecutiveCorrect: isKnown ? consecutiveCorrect + 1 : 0,
      consecutiveCorrectForWord: isKnown ? consecutiveCorrectForWord + 1 : 0,
      averageResponseTime: newAverageResponseTime,
      lastStudiedTime: Date.now(),
      studyResponses: [...currentWord.studyResponses, response],
    };

    // Update session
    const updatedSession: StudySession = {
      ...currentSession,
      responses: [...currentSession.responses, response],
      correctAnswers: currentSession.correctAnswers + (isKnown ? 1 : 0),
      incorrectAnswers: currentSession.incorrectAnswers + (isKnown ? 0 : 1),
    };

    // Update state
    setStudyWords(prev => prev.map((word, index) => 
      index === currentIndex ? updatedWord : word
    ));
    setCurrentWord(updatedWord);
    setCurrentSession(updatedSession);

    // Store response for rollback
    setResponseHistory(prev => new Map(prev.set(currentWord.id, response)));

    // Update score change tracking
    const newLevel = scoreToDisplayLevel(newScore);
    setLastScoreChange({
      previousScore,
      newScore,
      previousLevel: currentWord.difficulty,
      newLevel,
      isKnown,
      consecutiveCorrect: response.consecutiveCorrect,
      scoreDifference: newScore - previousScore,
      levelDifference: newLevel - currentWord.difficulty,
      wordText: currentWord.text1,
      wordId: currentWord.id,
      algorithmDetails
    });

    // Update the main word data with new difficulty level and internal score
    if (updateDifficulty) {
      updateDifficulty(currentWord.id, newLevel, newScore, newAverageResponseTime, isKnown ? consecutiveCorrectForWord + 1 : 0);
      console.log(`💾 Study: Updated main word data for "${currentWord.text1}" to level ${newLevel} with internal score ${newScore.toFixed(2)} and avg response time ${newAverageResponseTime?.toFixed(0)}ms`);
    }

    console.log(`🎓 Word "${currentWord.text1}" response:`, {
      isKnown,
      scoreChange: `${previousScore.toFixed(1)} → ${newScore.toFixed(1)}`,
      displayLevel: newLevel,
      consecutiveCorrect: response.consecutiveCorrect,
      scoreDifference: (newScore - previousScore).toFixed(1),
      levelDifference: newLevel - currentWord.difficulty
    });

    // Auto-advance to next word
    setTimeout(() => {
      if (currentIndex < studyWords.length - 1) {
        const nextIndex = currentIndex + 1;
        setCurrentIndex(nextIndex);
        setCurrentWord(studyWords[nextIndex] || null);
      } else {
        // Session complete
        console.log('🎓 Study session completed!');
        endStudySession();
      }
    }, 500); // Small delay for visual feedback

  }, [currentSession, isStudyActive, isPaused, currentIndex, studyWords, endStudySession]);

  // Skip current word (no scoring change)
  const skipWord = useCallback(() => {
    if (currentIndex < studyWords.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setCurrentWord(studyWords[nextIndex] || null);
    }
  }, [currentIndex, studyWords.length, studyWords]);

  // Go to previous word (if allowed)
  const goToPreviousWord = useCallback(() => {
    if (wordHistory.length > 1) {
      const newHistory = [...wordHistory];
      newHistory.pop(); // Remove current word
      const previousIndex = newHistory[newHistory.length - 1];
      
      setWordHistory(newHistory);
      setCurrentIndex(previousIndex);
      setCurrentWord(studyWords[previousIndex] || null);
    }
  }, [wordHistory, studyWords]);

  // Go to next word with history tracking
  const goToNextWord = useCallback(() => {
    if (currentIndex < studyWords.length - 1) {
      const nextIndex = currentIndex + 1;
      setWordHistory(prev => [...prev, nextIndex]);
      setCurrentIndex(nextIndex);
    }
  }, [currentIndex, studyWords.length]);

  // Rollback response for current word
  const rollbackResponse = useCallback(() => {
    const currentWord = studyWords[currentIndex];
    if (!currentWord) return;

    const response = responseHistory.get(currentWord.id);
    if (!response) return;

    // Revert word to previous state
    const revertedWord: StudyWord = {
      ...currentWord,
      internalScore: response.previousScore,
      difficulty: scoreToDisplayLevel(response.previousScore),
      consecutiveCorrect: response.isKnown ? Math.max(0, currentWord.consecutiveCorrect - 1) : currentWord.consecutiveCorrect,
      studyResponses: currentWord.studyResponses.slice(0, -1), // Remove last response
    };

    // Update study words
    setStudyWords(prev => 
      prev.map(word => word.id === currentWord.id ? revertedWord : word)
    );
    setCurrentWord(revertedWord);

    // Update the main word data with reverted difficulty level and internal score
    if (updateDifficulty) {
      updateDifficulty(currentWord.id, revertedWord.difficulty, revertedWord.internalScore);
      console.log(`💾 Study: Reverted main word data for "${currentWord.text1}" to level ${revertedWord.difficulty} with internal score ${revertedWord.internalScore.toFixed(2)}`);
    }

    // Remove from response history
    setResponseHistory(prev => {
      const newMap = new Map(prev);
      newMap.delete(currentWord.id);
      return newMap;
    });

    // Update session stats
    setCurrentSession(prev => prev ? {
      ...prev,
      responses: prev.responses.filter(r => r.wordId !== currentWord.id),
      correctAnswers: prev.correctAnswers - (response.isKnown ? 1 : 0),
      incorrectAnswers: prev.incorrectAnswers - (response.isKnown ? 0 : 1),
    } : null);
  }, [currentIndex, studyWords, responseHistory]);

  // Computed values
  const sessionProgress = studyWords.length > 0 ? ((currentIndex + 1) / studyWords.length) * 100 : 0;
  const sessionStats = currentSession ? calculateSessionStats(currentSession.responses) : {
    totalWords: 0,
    correctAnswers: 0,
    incorrectAnswers: 0,
    accuracy: 0,
    avgScoreChange: 0,
    longestStreak: 0,
    currentStreak: 0
  };

  const hasNextWord = currentIndex < studyWords.length - 1;
  const hasPreviousWord = currentIndex > 0;
  const canGoBack = hasPreviousWord && currentSession?.responses.length === currentIndex;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isStudyActive) {
        console.log('🎓 Component unmounting, ending study session');
        endStudySession();
      }
    };
  }, [isStudyActive, endStudySession]);

  return {
    // Session state
    currentSession,
    isStudyActive: isStudyActive && !isPaused,
    currentWord,
    currentIndex,
    studyWords,
    
    // Session control
    startStudySession,
    endStudySession,
    pauseSession,
    resumeSession,
    
    // Word interaction
    respondToWord,
    skipWord,
    goToPreviousWord,
    rollbackResponse,
    
    // Progress and stats
    sessionProgress,
    sessionStats,
    
    // Score change tracking
    lastScoreChange,
    
    // State queries
    hasNextWord,
    hasPreviousWord,
    canGoBack,
  };
}
