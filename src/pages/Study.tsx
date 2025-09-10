import React, { useState, useEffect, useRef } from 'react';
import { Word, DifficultyLevel } from '../types';
import { useStudyAlgorithm } from '../hooks/useStudyAlgorithm';
import StudyCard from '../components/study/StudyCard';
import StudyProgress from '../components/study/StudyProgress';
import StudyResult from '../components/study/StudyResult';
import StudyAiAnalysis from '../components/study/StudyAiAnalysis';
import QuizModeSelector from '../components/study/QuizModeSelector';
import ClassicQuizMode from '../components/study/ClassicQuizMode';
import SpeedQuizMode from '../components/study/SpeedQuizMode';
import { QuizConfiguration, QuizSession, QuizStats } from '../types/QuizTypes';

interface StudyProps {
  words: Word[];
  updateDifficulty: (id: number, difficulty: DifficultyLevel) => void;
  sourceLanguageName: string;
  targetLanguageName: string;
  explanationLanguageName?: string;
}

const Study: React.FC<StudyProps> = ({ words, updateDifficulty, sourceLanguageName, targetLanguageName, explanationLanguageName = 'English' }) => {
  const [availableWords, setAvailableWords] = useState<Word[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [lastResponse, setLastResponse] = useState<{ isKnown: boolean; timestamp: number } | null>(null);
  const [isSessionComplete, setIsSessionComplete] = useState(false);
  const [showAiAnalysis, setShowAiAnalysis] = useState(false);
  const [showAiPrompt, setShowAiPrompt] = useState(false);
  const [showFeedback, setShowFeedback] = useState(true);
  const [studyContainerHeight, setStudyContainerHeight] = useState(600);
  const [studyMode, setStudyMode] = useState<'study' | 'quiz' | 'quiz-selector'>('study');
  const [quizConfiguration, setQuizConfiguration] = useState<QuizConfiguration | null>(null);
  const [quizSession, setQuizSession] = useState<QuizSession | null>(null);
  const [quizStats, setQuizStats] = useState<QuizStats | null>(null);
  const studyContainerRef = useRef<HTMLDivElement>(null);
  const wasAiAnalysisOpenRef = useRef(false);
  const previousWordIdRef = useRef<number | null>(null);

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

  // Track when AI analysis is opened and hide prompt
  useEffect(() => {
    if (showAiAnalysis) {
      wasAiAnalysisOpenRef.current = true;
      setShowAiPrompt(false); // Always hide prompt when AI analysis is opened
    }
  }, [showAiAnalysis]);

  // Show AI prompt only when word actually changes (not on initial load)
  useEffect(() => {
    if (isStudyActive && currentWord && showAiAnalysis) {
      // Check if this is a real word change (not initial load)
      if (previousWordIdRef.current !== null && previousWordIdRef.current !== currentWord.id) {
        // This is a real word change, show the prompt
        setShowAiPrompt(true);
      }
      // Update the previous word ID
      previousWordIdRef.current = currentWord.id;
    }
  }, [currentWord?.id, isStudyActive, showAiAnalysis]);

  // Measure study container height
  useEffect(() => {
    const updateHeight = () => {
      if (studyContainerRef.current) {
        const height = studyContainerRef.current.offsetHeight;
        setStudyContainerHeight(height);
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, [currentWord, showResult]);

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

  const handleStartQuiz = () => {
    setStudyMode('quiz-selector');
  };

  const handleQuizModeSelect = (configuration: QuizConfiguration) => {
    setQuizConfiguration(configuration);
    setStudyMode('quiz');
  };

  const handleQuizEnd = () => {
    setStudyMode('study');
    setQuizConfiguration(null);
    setQuizSession(null);
    setQuizStats(null);
  };

  const handleQuizResult = (session: QuizSession, stats: QuizStats) => {
    setQuizSession(session);
    setQuizStats(stats);
    setStudyMode('study');
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
    window.location.href = '/home';
  };

  const handleAnalyzeWithAi = () => {
    setShowAiPrompt(false);
    // Trigger AI analysis refresh
    const event = new CustomEvent('refresh-ai-analysis');
    window.dispatchEvent(event);
  };

  const handleNotNow = () => {
    setShowAiPrompt(false);
  };


  const handleEndQuiz = () => {
    setStudyMode('study');
    setShowResult(false);
    setLastResponse(null);
    setQuizConfiguration(null);
    setQuizSession(null);
    setQuizStats(null);
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

  // Quiz mode selector
  if (studyMode === 'quiz-selector') {
    return (
      <QuizModeSelector
        words={availableWords}
        onModeSelect={handleQuizModeSelect}
        onBack={() => setStudyMode('study')}
      />
    );
  }

  // Quiz mode active
  if (studyMode === 'quiz' && quizConfiguration) {
    const quizProps = {
      words: availableWords,
      updateDifficulty: updateDifficulty as (id: number, difficulty: number) => void,
      configuration: quizConfiguration,
      onEndQuiz: handleQuizEnd,
      onShowResult: handleQuizResult
    };

    if (quizConfiguration.mode === 'classic') {
      return <ClassicQuizMode {...quizProps} />;
    } else if (quizConfiguration.mode === 'speed') {
      return <SpeedQuizMode {...quizProps} />;
    }
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

          {/* Main Content Area with Grid Layout */}
          <div className={`grid gap-4 mt-8 ${showAiAnalysis ? 'md:grid-cols-[minmax(0,1fr)_480px]' : 'md:grid-cols-1'}`}>
            {/* Left: Study Card Container */}
            <div className="relative flex flex-col" ref={studyContainerRef}>
              <div className="flex justify-center relative">
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
                    showFeedback={showFeedback}
                    onToggleFeedback={() => setShowFeedback(!showFeedback)}
                  />
                </div>

                {/* AI Analysis Button - Inside Study Card Area */}
                {!showAiAnalysis && (
                  <div className="absolute top-4 right-4 z-10">
                    <button
                      onClick={() => setShowAiAnalysis(true)}
                      className="group relative px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center space-x-2 overflow-hidden"
                    >
                      {/* Background pattern */}
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-700 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      
                      {/* Content */}
                      <div className="relative flex items-center space-x-2">
                        <div className="p-1 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors duration-300">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                        </div>
                        <span className="text-sm font-bold">AI Analysis</span>
                      </div>
                    </button>
                  </div>
                )}
              </div>

          {/* Session Controls */}
              <div className="mt-8 flex justify-center items-center gap-6">
            <button
              onClick={() => {
                endStudySession();
                    window.location.href = '/';
              }}
                  className="group relative px-6 py-3 text-slate-600 hover:text-slate-800 font-medium rounded-xl hover:bg-white/60 transition-all duration-200 flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>End Session</span>
            </button>
          </div>
            </div>

            {/* Right: AI Analysis Panel */}
            {showAiAnalysis && (
              <aside 
                className="bg-white rounded-3xl shadow-2xl ring-1 ring-slate-200 flex flex-col overflow-hidden"
                style={{ height: `${Math.max(400, studyContainerHeight - 100)}px` }}
              >
                {/* AI Panel Header */}
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white/70 backdrop-blur">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-800">AI Analysis</div>
                      <div className="text-xs text-slate-500">{currentWord?.text1} • {sourceLanguageName} → {targetLanguageName}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        // Refresh AI analysis
                        const event = new CustomEvent('refresh-ai-analysis');
                        window.dispatchEvent(event);
                      }}
                      className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all duration-200"
                      title="Refresh AI Analysis"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setShowAiAnalysis(false)}
                      className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all duration-200"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* AI Panel Content */}
                <div className="flex-1 overflow-y-auto p-4">
                  {/* AI Analysis Prompt */}
                  {showAiPrompt && (
                    <div className="mb-4 rounded-2xl border border-blue-200 bg-blue-50/60 p-4 shadow-sm">
                      <div className="text-center mb-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg ring-2 ring-blue-100">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-bold text-blue-800 mb-1">Analyze this word with AI?</h3>
                        <p className="text-blue-600 text-xs">Get detailed analysis for "{currentWord?.text1}"</p>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={handleAnalyzeWithAi}
                          className="flex-1 px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 shadow"
                        >
                          Analyze
                        </button>
                        <button
                          onClick={handleNotNow}
                          className="flex-1 px-3 py-2 rounded-lg bg-white text-blue-700 text-sm font-medium ring-1 ring-blue-200 hover:bg-blue-50"
                        >
                          Not now
                        </button>
                      </div>
                    </div>
                  )}

                  <StudyAiAnalysis
                    currentWord={currentWord}
                    sourceLanguageName={sourceLanguageName}
                    targetLanguageName={targetLanguageName}
                    isOpen={true}
                    onClose={() => setShowAiAnalysis(false)}
                    isEmbedded={true}
                  />
                </div>
              </aside>
            )}
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
            
            {/* Enhanced Statistics Dashboard */}
            {availableWords.length > 0 && (
              <div className="space-y-6">
                {/* Main Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-blue-200/50 text-center shadow-lg hover:shadow-xl transition-all duration-300">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-md">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <div className="text-2xl font-bold text-blue-700 mb-1">{availableWords.length}</div>
                    <div className="text-sm font-medium text-blue-600">Words Ready</div>
                  </div>
                  
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-emerald-200/50 text-center shadow-lg hover:shadow-xl transition-all duration-300">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-md">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="text-2xl font-bold text-emerald-700 mb-1">
                      {words.filter(w => w.isEvaluated).length}
                    </div>
                    <div className="text-sm font-medium text-emerald-600">Evaluated</div>
                  </div>
                  
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-amber-200/50 text-center shadow-lg hover:shadow-xl transition-all duration-300">
                    <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-md">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div className="text-2xl font-bold text-amber-700 mb-1">
                      {Math.round(availableWords.reduce((sum, word) => sum + (word.difficulty || 0), 0) / availableWords.length * 10) / 10}
                    </div>
                    <div className="text-sm font-medium text-amber-600">Avg. Level</div>
                  </div>
                </div>

                {/* Mode Selection */}
                <div className="mt-8">
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                      onClick={handleStartStudy}
                      className="group relative px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl font-bold text-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-3"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="relative flex items-center space-x-3">
                        <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-all duration-300">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                        <span className="tracking-wide">Study Mode</span>
                      </div>
                    </button>

                    <button
                      onClick={handleStartQuiz}
                      className="group relative px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-2xl font-bold text-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-3"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-700 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="relative flex items-center space-x-3">
                        <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-all duration-300">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <span className="tracking-wide">Quiz Mode</span>
                      </div>
                    </button>
                  </div>
                  
                  <div className="mt-4 text-center">
                    <p className="text-slate-500 text-sm">
                      Choose between traditional study mode or challenging quiz mode with multiple choice questions
                    </p>
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="text-center">
          {availableWords.length === 0 ? (
            // No words available - Enhanced design
            <div className="relative bg-gradient-to-br from-white via-amber-50/30 to-orange-50/30 backdrop-blur-xl rounded-3xl shadow-2xl border border-amber-200/50 p-12 max-w-2xl mx-auto overflow-hidden">
              {/* Background Decorations */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-100/40 to-orange-100/40 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-orange-100/40 to-amber-100/40 rounded-full translate-y-12 -translate-x-12"></div>
              
              <div className="relative z-10">
                <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl ring-4 ring-amber-100">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                
                <h2 className="text-3xl font-bold bg-gradient-to-r from-amber-800 via-orange-800 to-red-800 bg-clip-text text-transparent mb-4">
                  No Words Ready for Study
                </h2>
                <p className="text-slate-600 mb-8 text-lg leading-relaxed">
                  You need evaluated words to start a study session. First, add and evaluate some words to unlock the study mode.
                </p>
                
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 rounded-2xl border border-amber-200/50 mb-8">
                  <div className="flex items-center justify-center space-x-3 mb-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                    </div>
                    <span className="text-amber-800 font-bold text-lg">Getting Started</span>
                  </div>
                  <p className="text-amber-700 font-medium text-center">
                    💡 First evaluate some words to unlock study mode and start your learning journey!
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={handleGoHome}
                    className="group relative px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl font-bold text-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-3 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative flex items-center space-x-3">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                      <span>Go to Word Evaluation</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default Study;
