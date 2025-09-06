import React, { useState, useEffect } from 'react';
import { Word, DifficultyLevel } from '../types';
import { useStudyAlgorithm } from '../hooks/useStudyAlgorithm';
import StudyCard from '../components/study/StudyCard';
import StudyProgress from '../components/study/StudyProgress';
import StudyResult from '../components/study/StudyResult';
import WordStatsPanel from '../components/study/WordStatsPanel';

interface StudyProps {
  words: Word[];
  onGoHome: () => void;
  updateDifficulty: (id: number, difficulty: DifficultyLevel) => void;
}

const Study: React.FC<StudyProps> = ({ words, onGoHome, updateDifficulty }) => {
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
    onGoHome();
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
          <div className="flex flex-col lg:flex-row gap-8 mt-8">
            {/* Study Card - Left Side */}
            <div className="flex-1">
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

            {/* Word Statistics Panel - Right Side */}
            <div className="flex-shrink-0 lg:w-80 w-full">
              <WordStatsPanel
                word={currentWord}
                sessionStats={sessionStats}
                currentIndex={currentIndex}
                totalWords={studyWords.length}
              />
            </div>
          </div>

          {/* Session Controls */}
          <div className="mt-8 flex justify-center">
            <button
              onClick={() => {
                endStudySession();
                onGoHome();
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-20">
          {availableWords.length === 0 ? (
            // No words available
            <div className="relative bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30 backdrop-blur-sm rounded-3xl p-16 shadow-2xl border border-white/30 max-w-lg mx-auto overflow-hidden">
              {/* Background decorations */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100/40 to-indigo-100/40 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-indigo-100/40 to-blue-100/40 rounded-full translate-y-12 -translate-x-12"></div>
              
              <div className="relative z-10">
                <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center mx-auto mb-6 shadow-lg ring-4 ring-amber-100">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                
                <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-amber-800 bg-clip-text text-transparent mb-3">
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
            <div className="relative bg-gradient-to-br from-white via-indigo-50/30 to-purple-50/30 backdrop-blur-sm rounded-3xl p-16 shadow-2xl border border-white/30 max-w-2xl mx-auto overflow-hidden">
              {/* Background decorations */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-100/40 to-purple-100/40 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-100/40 to-indigo-100/40 rounded-full translate-y-12 -translate-x-12"></div>
              
              <div className="relative z-10">
                <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-xl ring-4 ring-indigo-100">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 via-indigo-800 to-purple-800 bg-clip-text text-transparent mb-4">
                  Ready to Study?
                </h1>
                <p className="text-xl text-slate-600 mb-8 leading-relaxed">
                  Test your knowledge and improve your vocabulary with our adaptive learning system
                </p>

                {/* Stats Preview */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                  <div className="bg-white/60 rounded-xl p-4 backdrop-blur-sm border border-white/50 text-center">
                    <div className="text-2xl font-bold text-indigo-600 mb-1">{availableWords.length}</div>
                    <div className="text-sm text-slate-600">Words Ready</div>
                  </div>
                  <div className="bg-white/60 rounded-xl p-4 backdrop-blur-sm border border-white/50 text-center">
                    <div className="text-2xl font-bold text-purple-600 mb-1">
                      {Math.round(availableWords.reduce((sum, word) => sum + (word.difficulty || 0), 0) / availableWords.length * 10) / 10}
                    </div>
                    <div className="text-sm text-slate-600">Avg. Difficulty</div>
                  </div>
                  <div className="bg-white/60 rounded-xl p-4 backdrop-blur-sm border border-white/50 text-center">
                    <div className="text-2xl font-bold text-blue-600 mb-1">
                      ~{Math.ceil(availableWords.length * 1.5)}m
                    </div>
                    <div className="text-sm text-slate-600">Est. Time</div>
                  </div>
                </div>

                {/* Features */}
                <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 p-6 rounded-2xl border border-indigo-200/50 backdrop-blur-sm mb-8">
                  <h3 className="font-semibold text-indigo-800 mb-4 text-center">Study Features</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                      <span className="text-indigo-700">Adaptive difficulty adjustment</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span className="text-purple-700">Streak bonus system</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-blue-700">Progress tracking</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      <span className="text-emerald-700">Performance analytics</span>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={handleStartStudy}
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-12 py-4 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center justify-center space-x-3 mx-auto"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Start Study Session</span>
                </button>

                <div className="mt-6">
                  <button
                    onClick={handleGoHome}
                    className="text-slate-600 hover:text-slate-800 font-medium py-2 px-4 rounded-lg hover:bg-white/60 transition-all duration-200 flex items-center space-x-2 mx-auto"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span>Back to Home</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Study;
