import React, { useEffect, useState } from 'react';
import { QuizModeProps } from '../../types/QuizTypes';
import { useQuizBase, QuizLoadingScreen, QuizErrorScreen } from './BaseQuizMode';
import QuizCard from './QuizCard';
import QuizFeedback from './QuizFeedback';

const ClassicQuizMode: React.FC<QuizModeProps> = (props) => {
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

  const handleAnswer = (isCorrect: boolean, responseTime: number) => {
    console.log('📝 handleAnswer called:', { isCorrect, responseTime, currentSession: !!currentSession, currentWord: !!currentWord });
    
    if (!currentSession || !currentWord) {
      console.log('❌ Missing session or word, returning');
      return;
    }

    const response = {
      wordId: currentWord.id,
      isCorrect,
      responseTime,
      timestamp: new Date()
    };

    const updatedSession = {
      ...currentSession,
      responses: [...currentSession.responses, response],
      usedWordIds: new Set([...Array.from(currentSession.usedWordIds), currentWord.id])
    };

    console.log('📊 Updated session:', {
      responsesCount: updatedSession.responses.length,
      usedWordIdsCount: updatedSession.usedWordIds.size,
      currentIndex,
      quizWordsLength: updatedSession.quizWords.length
    });

    setCurrentSession(updatedSession);
    setLastResponse({ isCorrect, timestamp: Date.now() });

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
    
    console.log('✅ Answer processed, lastResponse set:', { isCorrect, timestamp: Date.now() });
  };

  const nextQuestion = async () => {
    console.log('🚀 nextQuestion called');
    console.log('📊 Current State:', { 
      currentSession: !!currentSession, 
      currentIndex, 
      quizWordsLength: currentSession?.quizWords?.length || 0,
      usedWordIds: currentSession?.usedWordIds?.size || 0
    });
    
    if (!currentSession) {
      console.log('❌ No current session, returning');
      return;
    }

    const nextIndex = currentIndex + 1;
    let updatedSession = currentSession;
    
    // Check if we need to generate more words (when 3 or fewer words remain)
    const remainingWords = currentSession.quizWords.length - nextIndex;
    console.log('📈 Word Generation Check:', { remainingWords, isGeneratingMore });
    
    if (remainingWords <= 3 && !isGeneratingMore) {
      console.log('🔄 Generating more words...');
      updatedSession = await generateMoreQuizWords(currentSession);
      setCurrentSession(updatedSession);
      console.log('✅ More words generated:', updatedSession.quizWords.length);
    }

    // Check if we've used all available words
    const totalAvailableWords = availableWords.length;
    const usedWordsCount = currentSession.usedWordIds.size;
    
    console.log('📊 Word Usage Check:', { usedWordsCount, totalAvailableWords });
    
    if (usedWordsCount >= totalAvailableWords) {
      console.log('🏁 All words used, ending quiz');
      endQuiz();
      return;
    }

    if (nextIndex >= updatedSession.quizWords.length) {
      console.log('📦 Current batch completed, checking for more words');
      // Current batch completed, but more words available
      if (usedWordsCount < totalAvailableWords) {
        console.log('🔄 Generating more words for next batch...');
        const moreWords = await generateMoreQuizWords(updatedSession);
        if (moreWords.quizWords.length > updatedSession.quizWords.length) {
          console.log('✅ More words generated, loading next question');
          setCurrentSession(moreWords);
          setCurrentIndex(nextIndex);
          await loadQuestion(moreWords.quizWords[nextIndex]);
          setLastResponse(null);
          setHint(null);
          return;
        }
      }
      console.log('🏁 No more words available, ending quiz');
      endQuiz();
    } else {
      console.log('➡️ Moving to next question:', { nextIndex, word: updatedSession.quizWords[nextIndex] });
      setCurrentIndex(nextIndex);
      await loadQuestion(updatedSession.quizWords[nextIndex]);
      setLastResponse(null);
      setHint(null);
      console.log('✅ Next question loaded successfully');
    }
  };

  const previousQuestion = async () => {
    if (currentIndex > 0 && currentSession) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      await loadQuestion(currentSession.quizWords[prevIndex]);
      setLastResponse(null);
      setHint(null);
    }
  };

  const skipQuestion = () => {
    if (!currentSession || !currentWord) return;

    const response = {
      wordId: currentWord.id,
      isCorrect: false,
      responseTime: 0,
      timestamp: new Date()
    };

    const updatedSession = {
      ...currentSession,
      responses: [...currentSession.responses, response],
      usedWordIds: new Set([...Array.from(currentSession.usedWordIds), currentWord.id])
    };

    setCurrentSession(updatedSession);
    updateStats(false, 0);
    nextQuestion();
  };

  const rollbackResponse = () => {
    if (!currentSession || currentSession.responses.length === 0) return;

    const updatedSession = {
      ...currentSession,
      responses: currentSession.responses.slice(0, -1)
    };

    setCurrentSession(updatedSession);
    setLastResponse(null);

    // Revert stats
    const lastResponse = currentSession.responses[currentSession.responses.length - 1];
    if (lastResponse) {
      setSessionStats(prev => {
        const newCorrectAnswers = prev.correctAnswers - (lastResponse.isCorrect ? 1 : 0);
        const newIncorrectAnswers = prev.incorrectAnswers - (lastResponse.isCorrect ? 0 : 1);
        const totalAnswered = newCorrectAnswers + newIncorrectAnswers;
        const newAccuracy = totalAnswered > 0 ? (newCorrectAnswers / totalAnswered) * 100 : 0;
        
        return {
          ...prev,
          correctAnswers: newCorrectAnswers,
          incorrectAnswers: newIncorrectAnswers,
          accuracy: newAccuracy,
          currentStreak: 0
        };
      });
    }
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
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
            onRollback={lastResponse ? rollbackResponse : undefined}
            onHint={props.configuration.enableHints ? handleHint : undefined}
            disabled={isLoading}
            showResult={lastResponse !== null}
            isCorrect={lastResponse?.isCorrect}
            hasNext={(() => {
              const hasNextValue = currentSession ? currentIndex < currentSession.quizWords.length : false;
              console.log('🔍 hasNext Calculation:', {
                currentSession: !!currentSession,
                currentIndex,
                quizWordsLength: currentSession?.quizWords?.length || 0,
                hasNextValue,
                condition: currentIndex < (currentSession?.quizWords?.length || 0)
              });
              return hasNextValue;
            })()}
            hasPrevious={currentIndex > 0}
            canRollback={!!lastResponse}
            lastScoreChange={0}
            isSessionComplete={false}
            showFeedback={true}
            onToggleFeedback={() => {}}
            sourceLanguageName={props.configuration.sourceLanguageName}
            targetLanguageName={props.configuration.targetLanguageName}
            hint={hint}
            isLoadingHint={isLoadingHint}
          />

          {/* Session Controls */}
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

export default ClassicQuizMode;
