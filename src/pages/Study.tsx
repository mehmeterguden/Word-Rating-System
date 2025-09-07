import React, { useState, useEffect } from 'react';
import { Word, DifficultyLevel } from '../types';
import { useStudyAlgorithm } from '../hooks/useStudyAlgorithm';
import StudyCard from '../components/study/StudyCard';
import StudyProgress from '../components/study/StudyProgress';
import StudyResult from '../components/study/StudyResult';

interface StudyProps {
  words: Word[];
  updateDifficulty: (id: number, difficulty: DifficultyLevel) => void;
}

const Study: React.FC<StudyProps> = ({ words, updateDifficulty }) => {
  const [availableWords, setAvailableWords] = useState<Word[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [lastResponse, setLastResponse] = useState<{ isKnown: boolean; timestamp: number } | null>(null);
  const [isSessionComplete, setIsSessionComplete] = useState(false);

  const {
    currentSession,
    isStudyActive,
    currentWord,
    currentIndex,
    studyWords,
    startStudySession,
    endStudySession,
    respondToWord,
    skipWord,
    goToPreviousWord,
    rollbackResponse,
    sessionProgress,
    sessionStats,
    hasNextWord,
    hasPreviousWord,
    lastScoreChange: hookLastScoreChange
  } = useStudyAlgorithm({ updateDifficulty });

  // Initialize available words (exclude Very Easy - level 1)
  useEffect(() => {
    const evaluatedWords = words.filter(word => 
      word.isEvaluated && 
      word.difficulty && 
      word.difficulty > 1 // Exclude Very Easy (level 1)
    );
    setAvailableWords(evaluatedWords);
  }, [words]);

  // Handle session end
  useEffect(() => {
    if (!isStudyActive && currentSession && currentSession.responses.length > 0) {
      setShowResult(true);
      setIsSessionComplete(true);
    }
  }, [isStudyActive, currentSession]);

  // Clear result animation after delay
  useEffect(() => {
    if (lastResponse) {
      const timer = setTimeout(() => {
        setLastResponse(null);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [lastResponse]);

  const handleStartStudy = () => {
    if (availableWords.length === 0) return;
    
    // Select words for study (all evaluated words for now)
    const wordsToStudy = [...availableWords];
    
    console.log('🎓 Starting study session with', wordsToStudy.length, 'words');
    startStudySession(wordsToStudy);
    setShowResult(false);
    setLastResponse(null);
    setIsSessionComplete(false);
  };

  const handleKnowWord = (responseTime?: number) => {
    setLastResponse({ isKnown: true, timestamp: Date.now() });
    respondToWord(true, responseTime);
  };

  const handleDontKnowWord = (responseTime?: number) => {
    setLastResponse({ isKnown: false, timestamp: Date.now() });
    respondToWord(false, responseTime);
  };

  const handleSkipWord = () => {
    skipWord();
  };

  const handleStartNewSession = () => {
    setShowResult(false);
    setLastResponse(null);
    handleStartStudy();
  };

  const handleGoHome = () => {
    endStudySession();
    setShowResult(false);
    setLastResponse(null);
    // Navigation is now handled by React Router
    window.location.href = '/';
  };

  // Show result screen
  if (showResult && currentSession) {
    return (
      <StudyResult
        session={currentSession}
        sessionStats={sessionStats}
        onStartNewSession={handleStartNewSession}
        onGoHome={handleGoHome}
      />
    );
  }

  // Study session active
  if (isStudyActive && currentWord) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto p-6">
          {/* Progress Component */}
          <StudyProgress
            currentIndex={currentIndex}
            totalWords={studyWords.length}
            progress={sessionProgress}
            currentDifficulty={currentWord.difficulty}
            sessionStats={sessionStats}
          />

          {/* Main Content Area */}
          <div className="flex justify-center mt-8">
            {/* Study Card - Centered */}
            <div className="w-full max-w-4xl">
              <StudyCard
                word={currentWord}
                onKnow={handleKnowWord}
                onDontKnow={handleDontKnowWord}
                onSkip={hasNextWord ? handleSkipWord : undefined}
                onPrevious={hasPreviousWord ? goToPreviousWord : undefined}
                onRollback={lastResponse ? rollbackResponse : undefined}
                disabled={false}
                showResult={lastResponse !== null}
                isCorrect={lastResponse?.isKnown}
                hasPrevious={hasPreviousWord}
                canRollback={!!lastResponse}
                lastScoreChange={hookLastScoreChange}
                isSessionComplete={isSessionComplete}
              />
            </div>
          </div>

          {/* Session Controls */}
          <div className="mt-8 flex justify-center">
            <button
              onClick={() => {
                endStudySession();
                window.location.href = '/';
              }}
              className="flex items-center space-x-2 text-slate-600 hover:text-slate-800 font-medium py-2 px-4 rounded-lg hover:bg-white/60 transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>End Session</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Initial screen - start study
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="relative bg-gradient-to-br from-white via-blue-50/50 to-indigo-50/50 backdrop-blur-xl rounded-2xl shadow-xl border border-blue-200/50 p-6 mb-6 overflow-hidden">
          {/* Background Decorations */}
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-100/40 to-indigo-100/40 rounded-full -translate-y-10 translate-x-10"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-indigo-100/40 to-blue-100/40 rounded-full translate-y-8 -translate-x-8"></div>
          
          <div className="relative z-10 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg ring-2 ring-blue-100">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-800 to-indigo-800 bg-clip-text text-transparent mb-2">
              Study Mode
            </h1>
            <p className="text-slate-600 text-lg mb-4">
              Test your knowledge and improve your vocabulary
            </p>
            
            {/* Statistics Preview */}
            {availableWords.length > 0 && (
              <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto mb-4">
                <div className="bg-white/70 rounded-lg p-3 backdrop-blur-sm border border-blue-200/50 text-center">
                  <div className="text-xl font-bold text-blue-600 mb-1">{availableWords.length}</div>
                  <div className="text-xs text-slate-600">Words Ready</div>
                </div>
                <div className="bg-white/70 rounded-lg p-3 backdrop-blur-sm border border-blue-200/50 text-center">
                  <div className="text-xl font-bold text-indigo-600 mb-1">
                    {Math.round(availableWords.reduce((sum, word) => sum + (word.difficulty || 0), 0) / availableWords.length * 10) / 10}
                  </div>
                  <div className="text-xs text-slate-600">Avg. Difficulty</div>
                </div>
                <div className="bg-white/70 rounded-lg p-3 backdrop-blur-sm border border-blue-200/50 text-center">
                  <div className="text-xl font-bold text-purple-600 mb-1">
                    ~{Math.ceil(availableWords.length * 1.5)}m
                  </div>
                  <div className="text-xs text-slate-600">Est. Time</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="text-center">
          {availableWords.length === 0 ? (
            // No words available
            <div className="relative bg-gradient-to-br from-white via-blue-50/50 to-indigo-50/50 backdrop-blur-xl rounded-2xl shadow-xl border border-blue-200/50 p-8 max-w-lg mx-auto overflow-hidden">
              {/* Background Decorations */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-100/40 to-indigo-100/40 rounded-full -translate-y-10 translate-x-10"></div>
              <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-indigo-100/40 to-blue-100/40 rounded-full translate-y-8 -translate-x-8"></div>
              
              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg ring-2 ring-amber-100">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-800 to-amber-800 bg-clip-text text-transparent mb-3">
                  No Words Ready for Study
                </h2>
                <p className="text-slate-600 mb-6">
                  You need evaluated words to start a study session
                </p>
                
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-xl border border-amber-200/50 mb-6">
                  <p className="text-amber-700 font-medium text-sm">
                    💡 First evaluate some words to unlock study mode
                  </p>
                </div>
                
                <button
                  onClick={handleGoHome}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                >
                  Go to Word Evaluation
                </button>
              </div>
            </div>
          ) : (
            // Start study session
            <div className="relative bg-gradient-to-br from-white via-blue-50/50 to-indigo-50/50 backdrop-blur-xl rounded-2xl shadow-xl border border-blue-200/50 p-8 max-w-2xl mx-auto overflow-hidden">
              {/* Background Decorations */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-100/40 to-indigo-100/40 rounded-full -translate-y-10 translate-x-10"></div>
              <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-indigo-100/40 to-blue-100/40 rounded-full translate-y-8 -translate-x-8"></div>
              
              <div className="relative z-10">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-6 shadow-lg ring-2 ring-blue-100">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-800 to-indigo-800 bg-clip-text text-transparent mb-3">
                  Ready to Study?
                </h2>
                <p className="text-slate-600 mb-6">
                  Test your knowledge and improve your vocabulary with our adaptive learning system
                </p>

                {/* Enhanced Features Section */}
                <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 p-6 rounded-xl border border-blue-200/30 mb-6">
                  <h3 className="font-semibold text-blue-800 mb-4 text-center text-sm">Study Features</h3>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex items-center space-x-3 bg-white/60 p-3 rounded-lg border border-blue-200/50">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-blue-800">Adaptive Difficulty</div>
                        <div className="text-xs text-blue-600">Smart difficulty adjustment based on performance</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3 bg-white/60 p-3 rounded-lg border border-blue-200/50">
                      <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-indigo-800">Streak Bonuses</div>
                        <div className="text-xs text-indigo-600">Earn bonus points for consecutive correct answers</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3 bg-white/60 p-3 rounded-lg border border-blue-200/50">
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-purple-800">Progress Tracking</div>
                        <div className="text-xs text-purple-600">Monitor your learning progress and achievements</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={handleStartStudy}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 flex items-center justify-center space-x-3 mx-auto"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Start Study Session</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Study;
