import React, { useEffect, useState, useCallback } from 'react';
import { QuizModeProps } from '../../types/QuizTypes';
import { useQuizBase, QuizLoadingScreen, QuizErrorScreen } from './BaseQuizMode';
import QuizCard from './QuizCard';
import QuizFeedback from './QuizFeedback';

const SpeedQuizMode: React.FC<QuizModeProps> = (props) => {
  const [error, setError] = useState<string | null>(null);
  
  const {
    currentSession,
    setCurrentSession,
    currentQuestion,
    currentWord,
    currentIndex,
    setCurrentIndex,
    isLoading,
    lastResponse,
    setLastResponse,
    sessionStats,
    setSessionStats,
    isGeneratingMore,
    hint,
    setHint,
    isLoadingHint,
    showFeedback,
    setShowFeedback,
    hintRequests,
    availableWords,
    handleHint,
    loadQuestion,
    updateStats,
    endQuiz,
    initializeQuiz,
    generateMoreQuizWords
  } = useQuizBase(props);

  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [speedScore, setSpeedScore] = useState(0);
  const [streakMultiplier, setStreakMultiplier] = useState(1);

  const timeLimit = props.configuration.timeLimit || 30;

  // Initialize quiz session
  useEffect(() => {
    const initQuiz = async () => {
      try {
        setError(null);
        await initializeQuiz();
      } catch (err) {
        console.error('Error initializing quiz:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize quiz');
      }
    };
    
    initQuiz();
  }, [availableWords.length]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isTimerActive && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            // Time's up - auto answer as incorrect
            handleTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerActive, timeRemaining]);

  // Start timer when new question loads
  useEffect(() => {
    if (currentQuestion && !lastResponse) {
      setTimeRemaining(timeLimit);
      setIsTimerActive(true);
    }
  }, [currentQuestion, timeLimit, lastResponse]);

  // Stop timer when answer is given
  useEffect(() => {
    if (lastResponse) {
      setIsTimerActive(false);
    }
  }, [lastResponse]);

  const handleTimeUp = useCallback(() => {
    if (!currentWord || lastResponse) return;
    
    setIsTimerActive(false);
    const responseTime = timeLimit * 1000; // Full time used
    handleAnswer(false, responseTime);
  }, [currentWord, lastResponse, timeLimit]);

  const calculateSpeedScore = (isCorrect: boolean, responseTime: number, timeLimit: number) => {
    if (!isCorrect) return 0;
    
    const timeUsed = responseTime / 1000; // Convert to seconds
    const timeRatio = timeUsed / timeLimit;
    
    // Base score for correct answer
    let baseScore = 100;
    
    // Speed bonus: faster answers get more points
    const speedBonus = Math.max(0, (1 - timeRatio) * 50);
    
    // Streak multiplier
    const totalScore = (baseScore + speedBonus) * streakMultiplier;
    
    return Math.round(totalScore);
  };

  const handleAnswer = (isCorrect: boolean, responseTime: number) => {
    if (!currentSession || !currentWord) return;

    setIsTimerActive(false);

    const response = {
      wordId: currentWord.id,
      isCorrect,
      responseTime,
      timestamp: new Date(),
      timeRemaining: timeRemaining
    };

    const updatedSession = {
      ...currentSession,
      responses: [...currentSession.responses, response],
      usedWordIds: new Set([...Array.from(currentSession.usedWordIds), currentWord.id])
    };

    setCurrentSession(updatedSession);
    setLastResponse({ isCorrect, timestamp: Date.now() });

    // Calculate speed score
    const questionScore = calculateSpeedScore(isCorrect, responseTime, timeLimit);
    setSpeedScore(prev => prev + questionScore);

    // Update streak multiplier
    if (isCorrect) {
      setStreakMultiplier(prev => Math.min(prev + 0.1, 3)); // Max 3x multiplier
    } else {
      setStreakMultiplier(1); // Reset on wrong answer
    }

    // Update difficulty based on performance
    if (isCorrect) {
      const newDifficulty = Math.max(1, (currentWord.difficulty || 2) - 1);
      props.updateDifficulty(currentWord.id, newDifficulty as any);
    } else {
      const newDifficulty = Math.min(5, (currentWord.difficulty || 2) + 1);
      props.updateDifficulty(currentWord.id, newDifficulty as any);
    }

    // Update stats
    updateStats(isCorrect, responseTime);
  };

  const nextQuestion = async () => {
    if (!currentSession) return;

    const nextIndex = currentIndex + 1;
    let updatedSession = currentSession;
    
    // Check if we need to generate more words (when 3 or fewer words remain)
    const remainingWords = currentSession.quizWords.length - nextIndex;
    if (remainingWords <= 3 && !isGeneratingMore) {
      updatedSession = await generateMoreQuizWords(currentSession);
      setCurrentSession(updatedSession);
    }

    // Check if we've used all available words
    const totalAvailableWords = availableWords.length;
    const usedWordsCount = currentSession.usedWordIds.size;
    
    if (usedWordsCount >= totalAvailableWords) {
      endQuiz();
      return;
    }

    if (nextIndex >= updatedSession.quizWords.length) {
      // Current batch completed, but more words available
      if (usedWordsCount < totalAvailableWords) {
        const moreWords = await generateMoreQuizWords(updatedSession);
        if (moreWords.quizWords.length > updatedSession.quizWords.length) {
          setCurrentSession(moreWords);
          setCurrentIndex(nextIndex);
          await loadQuestion(moreWords.quizWords[nextIndex]);
          setLastResponse(null);
          setHint(null);
          return;
        }
      }
      endQuiz();
    } else {
      setCurrentIndex(nextIndex);
      await loadQuestion(updatedSession.quizWords[nextIndex]);
      setLastResponse(null);
      setHint(null);
    }
  };

  const previousQuestion = async () => {
    if (currentIndex > 0 && currentSession) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      await loadQuestion(currentSession.quizWords[prevIndex]);
      setLastResponse(null);
      setHint(null);
      setIsTimerActive(false);
    }
  };

  const skipQuestion = () => {
    if (!currentSession || !currentWord) return;

    setIsTimerActive(false);
    const response = {
      wordId: currentWord.id,
      isCorrect: false,
      responseTime: timeLimit * 1000,
      timestamp: new Date(),
      timeRemaining: timeRemaining
    };

    const updatedSession = {
      ...currentSession,
      responses: [...currentSession.responses, response],
      usedWordIds: new Set([...Array.from(currentSession.usedWordIds), currentWord.id])
    };

    setCurrentSession(updatedSession);
    updateStats(false, timeLimit * 1000);
    setStreakMultiplier(1); // Reset streak on skip
    nextQuestion();
  };


  const getTimerColor = () => {
    const ratio = timeRemaining / timeLimit;
    if (ratio > 0.5) return 'text-green-600';
    if (ratio > 0.25) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTimerBgColor = () => {
    const ratio = timeRemaining / timeLimit;
    if (ratio > 0.5) return 'bg-green-500';
    if (ratio > 0.25) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (error) {
    return <QuizErrorScreen onEndQuiz={props.onEndQuiz} error={error} />;
  }

  if (isLoading) {
    return <QuizLoadingScreen />;
  }

  if (!currentQuestion || !currentWord) {
    return <QuizErrorScreen onEndQuiz={props.onEndQuiz} error="No question or word available" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-red-50">
      {/* Speed Mode Header */}
      <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white p-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold">Speed Quiz</h1>
              <p className="text-orange-100">Test your reflexes and quick thinking!</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            {/* Speed Score */}
            <div className="text-center">
              <div className="text-2xl font-bold">{speedScore}</div>
              <div className="text-sm text-orange-100">Speed Score</div>
            </div>
            
            {/* Streak Multiplier */}
            <div className="text-center">
              <div className="text-2xl font-bold">x{streakMultiplier.toFixed(1)}</div>
              <div className="text-sm text-orange-100">Streak</div>
            </div>
            
            {/* Timer */}
            <div className="text-center">
              <div className={`text-3xl font-bold ${getTimerColor()}`}>
                {timeRemaining}
              </div>
              <div className="text-sm text-orange-100">seconds</div>
            </div>
          </div>
        </div>
        
        {/* Timer Progress Bar */}
        <div className="mt-4">
          <div className="w-full bg-white/20 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-1000 ${getTimerBgColor()}`}
              style={{ width: `${(timeRemaining / timeLimit) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Feedback Panel */}
      <QuizFeedback
        session={currentSession}
        stats={sessionStats}
        currentIndex={currentIndex}
        isGeneratingMore={isGeneratingMore}
        hintRequests={hintRequests}
        isVisible={showFeedback}
        onToggle={() => setShowFeedback(!showFeedback)}
      />

      <div className={`max-w-7xl mx-auto p-6 transition-all duration-300 ${showFeedback ? 'ml-96' : ''}`}>
        {/* Main Content Area */}
        <div>
          <QuizCard
            word={currentWord}
            question={currentQuestion}
            onAnswer={handleAnswer}
            onNext={nextQuestion}
            onSkip={currentSession && currentIndex < currentSession.quizWords.length - 1 ? skipQuestion : undefined}
            onPrevious={currentIndex > 0 ? previousQuestion : undefined}
            onRollback={undefined} // Disable rollback in speed mode
            onHint={props.configuration.enableHints ? handleHint : undefined}
            disabled={isLoading || lastResponse !== null}
            showResult={lastResponse !== null}
            isCorrect={lastResponse?.isCorrect}
            hasNext={currentSession ? currentIndex < currentSession.quizWords.length : false}
            hasPrevious={currentIndex > 0}
            canRollback={false} // Disable rollback in speed mode
            lastScoreChange={0}
            isSessionComplete={false}
            showFeedback={true}
            onToggleFeedback={() => {}}
            sourceLanguageName={props.configuration.sourceLanguageName}
            targetLanguageName={props.configuration.targetLanguageName}
            hint={hint}
            isLoadingHint={isLoadingHint}
          />

          {/* Speed Mode Controls */}
          <div className="mt-8 flex justify-center items-center gap-6">
            <button
              onClick={props.onEndQuiz}
              className="group relative px-6 py-3 text-slate-600 hover:text-slate-800 font-medium rounded-xl hover:bg-white/60 transition-all duration-200 flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>End Quiz</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpeedQuizMode;
