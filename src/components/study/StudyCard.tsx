import React, { useState, useEffect } from 'react';
import { getDifficultyColor, getDifficultyLabel } from '../../utils/studyAlgorithm';

interface StudyCardProps {
  word: {
    id: number;
    text1: string;
    text2?: string;
    difficulty: number;
    language1Name?: string;
    language2Name?: string;
  };
  onKnow: (responseTime?: number) => void;
  onDontKnow: (responseTime?: number) => void;
  onSkip?: () => void;
  onPrevious?: () => void;
  onRollback?: () => void;
  disabled?: boolean;
  showResult?: boolean;
  isCorrect?: boolean;
  hasPrevious?: boolean;
  canRollback?: boolean;
  isSessionComplete?: boolean;
  lastScoreChange?: {
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
      responseTime?: number;
      averageResponseTime?: number;
      timeRatio?: number;
      timingFactor?: number;
      timingBonus?: number;
      timingPenalty?: number;
      consecutiveCorrectForWord?: number;
      consecutiveWordBonus?: number;
      isLikelyAway?: boolean;
      consecutiveTimingMultiplier?: number;
    };
  } | null;
}

const StudyCard: React.FC<StudyCardProps> = ({
  word,
  onKnow,
  onDontKnow,
  onSkip,
  onPrevious,
  onRollback,
  disabled = false,
  showResult = false,
  isCorrect,
  hasPrevious = false,
  canRollback = false,
  isSessionComplete = false,
  lastScoreChange
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);

  const difficultyColor = getDifficultyColor(word.difficulty);
  const difficultyLabel = getDifficultyLabel(word.difficulty);

  // Reset flip state when word changes
  useEffect(() => {
    setIsFlipped(false);
    setShowAnimation(false);
    setStartTime(Date.now());
    setResponseTime(null);
    // Don't close feedback when word changes - let it stay persistent
  }, [word.id]);

  // Show feedback when score change is available
  useEffect(() => {
    if (lastScoreChange) {
      setShowFeedback(true);
      // Don't auto-hide - let user close manually or wait for new feedback
    }
  }, [lastScoreChange]);

  // Keep feedback visible when showResult changes (but don't close it)
  useEffect(() => {
    if (showResult && lastScoreChange) {
      setShowFeedback(true);
    }
  }, [showResult, lastScoreChange]);

  // Reset feedback only when component unmounts or session ends
  useEffect(() => {
    return () => {
      // Cleanup function - only reset when component unmounts
    };
  }, []);

  // Reset feedback only when session ends (not when word changes)
  // But keep feedback open if session is complete
  useEffect(() => {
    if (!showResult && !lastScoreChange && !isSessionComplete) {
      setShowFeedback(false);
    }
  }, [showResult, lastScoreChange, isSessionComplete]);

  // Keep feedback visible when word changes (don't close it)
  useEffect(() => {
    if (lastScoreChange) {
      setShowFeedback(true);
    }
  }, [lastScoreChange]);

  // Show animation when result is displayed
  useEffect(() => {
    if (showResult) {
      setShowAnimation(true);
      const timer = setTimeout(() => setShowAnimation(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [showResult]);

  const handleFlip = () => {
    if (!disabled) {
      setIsFlipped(!isFlipped);
    }
  };

  const handleKnow = () => {
    if (!disabled && startTime) {
      const time = Date.now() - startTime;
      setResponseTime(time);
      onKnow(time);
    }
  };

  const handleDontKnow = () => {
    if (!disabled && startTime) {
      const time = Date.now() - startTime;
      setResponseTime(time);
      onDontKnow(time);
    }
  };

  const handleSkip = () => {
    if (!disabled && onSkip) {
      onSkip();
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Advanced Developer Debug Panel */}
      {lastScoreChange && showFeedback && (
        <div className="feedback-persistent">
          <div className={`bg-slate-900 text-white rounded-2xl shadow-2xl border-2 p-6 relative max-w-4xl ${
            lastScoreChange.isKnown 
              ? 'border-emerald-400' 
              : 'border-rose-400'
          }`}>
            {/* Close Button */}
            <button
              onClick={() => setShowFeedback(false)}
              className="close-btn absolute top-3 right-3 w-7 h-7 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center transition-colors group"
              title="Close debug panel"
            >
              <svg className="w-4 h-4 text-slate-300 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="pr-10">
              {/* Header */}
              <div className="flex items-center space-x-4 mb-6">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                  lastScoreChange.isKnown 
                    ? 'bg-emerald-500' 
                    : 'bg-rose-500'
                }`}>
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {lastScoreChange.isKnown ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    )}
                  </svg>
                </div>
                <div>
                  <div className="font-bold text-xl">
                    {lastScoreChange.isKnown ? '✅ Correct!' : '❌ Keep Learning!'}
                  </div>
                  <div className="text-slate-400 text-sm">
                    Word: <span className="font-mono text-emerald-300">"{lastScoreChange.wordText}"</span> (ID: {lastScoreChange.wordId})
                  </div>
                </div>
              </div>

              {/* Main Score Change */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-800 rounded-lg p-4">
                  <div className="font-semibold text-slate-300 mb-2">Score Change</div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-2xl">
                      {lastScoreChange.previousScore.toFixed(1)} → {lastScoreChange.newScore.toFixed(1)}
                    </span>
                    <span className={`px-3 py-1 rounded text-sm font-bold ${
                      lastScoreChange.scoreDifference < 0 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-rose-600 text-white'
                    }`}>
                      {lastScoreChange.scoreDifference > 0 ? '+' : ''}{lastScoreChange.scoreDifference.toFixed(1)}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-800 rounded-lg p-4">
                  <div className="font-semibold text-slate-300 mb-2">Level Change</div>
                  <div className="flex items-center justify-between">
                    <span className="text-xl">
                      Level {lastScoreChange.previousLevel} → Level {lastScoreChange.newLevel}
                    </span>
                    {lastScoreChange.levelDifference !== 0 && (
                      <span className={`px-3 py-1 rounded text-sm font-bold ${
                        lastScoreChange.levelDifference < 0 
                          ? 'bg-emerald-600 text-white' 
                          : 'bg-amber-600 text-white'
                      }`}>
                        {lastScoreChange.levelDifference < 0 ? 'Easier!' : 'Harder!'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Algorithm Details */}
              <div className="bg-slate-800 rounded-lg p-4 mb-4">
                <div className="font-semibold text-slate-300 mb-3">🧠 Algorithm Analysis</div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                  {/* Difficulty Category */}
                  <div className="space-y-2">
                    <div className="font-semibold text-slate-400">Difficulty Category</div>
                    <div className="flex space-x-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        lastScoreChange.algorithmDetails.isEasy ? 'bg-green-600 text-white' : 'bg-slate-600'
                      }`}>
                        Easy
                      </span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        lastScoreChange.algorithmDetails.isMedium ? 'bg-yellow-600 text-white' : 'bg-slate-600'
                      }`}>
                        Medium
                      </span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        lastScoreChange.algorithmDetails.isHard ? 'bg-red-600 text-white' : 'bg-slate-600'
                      }`}>
                        Hard
                      </span>
                    </div>
                  </div>

                  {/* Learning Rate */}
                  <div>
                    <div className="font-semibold text-slate-400">Learning Rate</div>
                    <div className="text-emerald-300 font-mono">
                      {lastScoreChange.algorithmDetails.learningRate.toFixed(2)}x
                    </div>
                  </div>

                  {/* Time Factor */}
                  <div>
                    <div className="font-semibold text-slate-400">Time Factor</div>
                    <div className="text-blue-300 font-mono">
                      {lastScoreChange.algorithmDetails.timeFactor.toFixed(2)}x
                    </div>
                    {lastScoreChange.algorithmDetails.hoursSinceStudied && (
                      <div className="text-xs text-slate-500">
                        {lastScoreChange.algorithmDetails.hoursSinceStudied.toFixed(1)}h ago
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Detailed Calculation */}
              {lastScoreChange.isKnown ? (
                <div className="bg-slate-800 rounded-lg p-4 mb-4">
                  <div className="font-semibold text-slate-300 mb-3">✅ Correct Answer Calculation</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="font-semibold text-slate-400">Base Decrement</div>
                      <div className="text-emerald-300 font-mono">
                        {lastScoreChange.algorithmDetails.baseDecrement?.toFixed(2) || 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold text-slate-400">Consecutive Bonus</div>
                      <div className="text-yellow-300 font-mono">
                        {lastScoreChange.algorithmDetails.consecutiveBonus?.toFixed(2) || 'N/A'}x
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold text-slate-400">Mastery Bonus</div>
                      <div className="text-purple-300 font-mono">
                        +{lastScoreChange.algorithmDetails.masteryBonus?.toFixed(2) || '0.00'}
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold text-slate-400">Total Decrement</div>
                      <div className="text-emerald-300 font-mono font-bold">
                        {lastScoreChange.algorithmDetails.totalDecrement?.toFixed(2) || 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-800 rounded-lg p-4 mb-4">
                  <div className="font-semibold text-slate-300 mb-3">❌ Incorrect Answer Calculation</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="font-semibold text-slate-400">Base Increment</div>
                      <div className="text-rose-300 font-mono">
                        {lastScoreChange.algorithmDetails.baseIncrement?.toFixed(2) || 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold text-slate-400">Recent Failures</div>
                      <div className="text-orange-300 font-mono">
                        {lastScoreChange.algorithmDetails.recentFailures || 0}
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold text-slate-400">Failure Penalty</div>
                      <div className="text-red-300 font-mono">
                        +{lastScoreChange.algorithmDetails.failurePenalty?.toFixed(2) || '0.00'}
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold text-slate-400">Total Increment</div>
                      <div className="text-rose-300 font-mono font-bold">
                        {lastScoreChange.algorithmDetails.totalIncrement?.toFixed(2) || 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Consecutive Streak */}
              {lastScoreChange.consecutiveCorrect > 0 && (
                <div className="bg-slate-800 rounded-lg p-4 mb-4">
                  <div className="font-semibold text-slate-300 mb-2">🔥 Consecutive Streak</div>
                  <div className="flex items-center space-x-4">
                    <span className="text-emerald-400 font-bold text-lg">
                      {lastScoreChange.consecutiveCorrect} consecutive correct!
                    </span>
                    <span className="text-xs text-slate-400">
                      (Bonus: {((Math.pow(1.5, lastScoreChange.consecutiveCorrect) - 1) * 100).toFixed(0)}%)
                    </span>
                  </div>
                </div>
              )}

              {/* Advanced Timing Analysis */}
              {lastScoreChange.algorithmDetails.responseTime && (
                <div className="bg-slate-800 rounded-lg p-4 mb-4">
                  <div className="font-semibold text-slate-300 mb-3">⏱️ Advanced Response Time Analysis</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="font-semibold text-slate-400">Current Response</div>
                      <div className="text-blue-300 font-mono">
                        {(lastScoreChange.algorithmDetails.responseTime / 1000).toFixed(2)}s
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold text-slate-400">Average Response</div>
                      <div className="text-purple-300 font-mono">
                        {lastScoreChange.algorithmDetails.averageResponseTime ? 
                          (lastScoreChange.algorithmDetails.averageResponseTime / 1000).toFixed(2) + 's' : 
                          'N/A'
                        }
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold text-slate-400">Time Ratio</div>
                      <div className={`font-mono ${
                        (lastScoreChange.algorithmDetails.timeRatio || 1) < 0.5 ? 'text-emerald-300' :
                        (lastScoreChange.algorithmDetails.timeRatio || 1) < 0.7 ? 'text-green-300' :
                        (lastScoreChange.algorithmDetails.timeRatio || 1) < 0.9 ? 'text-yellow-300' :
                        (lastScoreChange.algorithmDetails.timeRatio || 1) < 1.1 ? 'text-blue-300' :
                        (lastScoreChange.algorithmDetails.timeRatio || 1) < 1.5 ? 'text-orange-300' :
                        'text-red-300'
                      }`}>
                        {lastScoreChange.algorithmDetails.timeRatio?.toFixed(2) || 'N/A'}x
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold text-slate-400">Timing Factor</div>
                      <div className={`font-mono ${
                        (lastScoreChange.algorithmDetails.timingFactor || 1) > 1.0 ? 'text-emerald-300' :
                        (lastScoreChange.algorithmDetails.timingFactor || 1) < 1.0 ? 'text-red-300' :
                        'text-slate-300'
                      }`}>
                        {lastScoreChange.algorithmDetails.timingFactor?.toFixed(2) || '1.00'}x
                      </div>
                    </div>
                  </div>
                  
                  {/* Advanced Timing Details */}
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="font-semibold text-slate-400">Speed Category</div>
                      <div className={`font-semibold ${
                        (lastScoreChange.algorithmDetails.timeRatio || 1) < 0.5 ? 'text-emerald-300' :
                        (lastScoreChange.algorithmDetails.timeRatio || 1) < 0.7 ? 'text-green-300' :
                        (lastScoreChange.algorithmDetails.timeRatio || 1) < 0.9 ? 'text-yellow-300' :
                        (lastScoreChange.algorithmDetails.timeRatio || 1) < 1.1 ? 'text-blue-300' :
                        (lastScoreChange.algorithmDetails.timeRatio || 1) < 1.5 ? 'text-orange-300' :
                        'text-red-300'
                      }`}>
                        {(lastScoreChange.algorithmDetails.timeRatio || 1) < 0.5 ? '⚡ Lightning' :
                         (lastScoreChange.algorithmDetails.timeRatio || 1) < 0.7 ? '🚀 Very Fast' :
                         (lastScoreChange.algorithmDetails.timeRatio || 1) < 0.9 ? '🏃 Fast' :
                         (lastScoreChange.algorithmDetails.timeRatio || 1) < 1.1 ? '🚶 Normal' :
                         (lastScoreChange.algorithmDetails.timeRatio || 1) < 1.5 ? '🐌 Slow' :
                         '🐢 Very Slow'}
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold text-slate-400">Away Detection</div>
                      <div className={`font-semibold ${
                        lastScoreChange.algorithmDetails.isLikelyAway ? 'text-amber-300' : 'text-slate-300'
                      }`}>
                        {lastScoreChange.algorithmDetails.isLikelyAway ? '🚪 Likely Away' : '👤 Active'}
                      </div>
                      {lastScoreChange.algorithmDetails.isLikelyAway && (
                        <div className="text-xs text-amber-400 mt-1">
                          Smart filtering applied
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Timing Bonuses and Penalties */}
                  {(lastScoreChange.algorithmDetails.timingBonus || 0) > 0 && (
                    <div className="mt-3 p-3 bg-emerald-900/30 rounded border border-emerald-500/30">
                      <div className="text-emerald-300 text-sm font-semibold mb-1">
                        ⚡ Speed Bonus: +{((lastScoreChange.algorithmDetails.timingBonus || 0) * 100).toFixed(1)}%
                      </div>
                      {(lastScoreChange.algorithmDetails.consecutiveTimingMultiplier || 1) > 1 && (
                        <div className="text-emerald-400 text-xs">
                          🔥 Consecutive Multiplier: {(lastScoreChange.algorithmDetails.consecutiveTimingMultiplier || 1).toFixed(2)}x
                        </div>
                      )}
                    </div>
                  )}
                  {(lastScoreChange.algorithmDetails.timingPenalty || 0) > 0 && (
                    <div className="mt-3 p-3 bg-red-900/30 rounded border border-red-500/30">
                      <div className="text-red-300 text-sm font-semibold">
                        🐌 Speed Penalty: -{((lastScoreChange.algorithmDetails.timingPenalty || 0) * 100).toFixed(1)}%
                        {lastScoreChange.algorithmDetails.isLikelyAway && (
                          <span className="text-amber-300 text-xs ml-2">(Reduced - Away Detection)</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Consecutive Word Bonus */}
              {(lastScoreChange.algorithmDetails.consecutiveCorrectForWord || 0) > 0 && (
                <div className="bg-slate-800 rounded-lg p-4 mb-4">
                  <div className="font-semibold text-slate-300 mb-2">🎯 Same Word Streak</div>
                  <div className="flex items-center space-x-4">
                    <span className="text-cyan-400 font-bold text-lg">
                      {lastScoreChange.algorithmDetails.consecutiveCorrectForWord} consecutive for this word!
                    </span>
                    <span className="text-xs text-slate-400">
                      (Word Bonus: {(((lastScoreChange.algorithmDetails.consecutiveWordBonus || 1) - 1) * 100).toFixed(0)}%)
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-slate-500">
                    This word gets exponentially easier each time you get it right!
                  </div>
                </div>
              )}

              {/* Debug Info */}
              <div className="bg-slate-800 rounded-lg p-4">
                <div className="font-semibold text-slate-300 mb-2">🔧 Debug Info</div>
                <div className="text-xs text-slate-400 space-y-1">
                  <div>Response: {lastScoreChange.isKnown ? 'Known' : 'Unknown'}</div>
                  <div>Score Range: 0.5 - 5.5 (internal) → 1 - 5 (display)</div>
                  <div>Algorithm: Advanced Adaptive Learning</div>
                  <div className="text-slate-500 mt-2 pt-2 border-t border-slate-700">
                    💡 This debug panel stays until you close it or get new feedback
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Word Card */}
      <div className="relative">
        {/* Result Animation Overlay */}
        {showAnimation && (
          <div className={`absolute inset-0 rounded-3xl ${
            isCorrect ? 'bg-emerald-500/20' : 'bg-rose-500/20'
          } flex items-center justify-center z-50 backdrop-blur-sm animate-pulse`}>
            <div className={`w-20 h-20 rounded-full ${
              isCorrect ? 'bg-emerald-500' : 'bg-rose-500'
            } flex items-center justify-center shadow-2xl`}>
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isCorrect ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                )}
              </svg>
            </div>
          </div>
        )}

        {/* Main Card */}
        <div 
          className={`relative bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/30 overflow-hidden transition-all duration-300 ${
            disabled ? 'opacity-75' : 'hover:shadow-3xl hover:scale-[1.02]'
          } ${showAnimation ? 'scale-105' : ''}`}
          style={{ perspective: '1000px' }}
        >
          {/* Background Decorations */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100/40 to-indigo-100/40 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-indigo-100/40 to-purple-100/40 rounded-full translate-y-12 -translate-x-12"></div>

          {/* Card Header */}
          <div className="relative z-10 px-8 pt-8 pb-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">Study Mode</h3>
                  <p className="text-sm text-slate-600">{word.language1Name || 'Target'} → {word.language2Name || 'Known'}</p>
                </div>
              </div>
              
              {/* Difficulty Badge */}
              <div className={`px-3 py-1.5 rounded-lg font-semibold text-sm bg-${difficultyColor}-100 text-${difficultyColor}-700 ring-1 ring-${difficultyColor}-200`}>
                {difficultyLabel}
              </div>
            </div>
          </div>

          {/* Flashcard Container */}
          <div className="relative z-10 px-8 pb-8">
            {/* Card Display Area */}
            <div className="relative w-full">
              {/* First Language Card - Always Visible */}
              <div 
                className="mb-6 cursor-pointer transition-all duration-300 hover:scale-105"
                onClick={handleFlip}
              >
                <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-3xl p-8 shadow-2xl border-4 border-white/20 relative overflow-hidden">
                  {/* Background Pattern */}
                  <div className="absolute inset-0">
                    <div className="absolute top-4 right-4 w-16 h-16 bg-white/10 rounded-full"></div>
                    <div className="absolute bottom-6 left-6 w-12 h-12 bg-white/10 rounded-full"></div>
                    <div className="absolute top-1/2 left-4 w-8 h-8 bg-white/10 rounded-full"></div>
                  </div>
                  
                  <div className="relative z-10 text-center">
                    <div className="text-5xl font-bold text-white mb-4 drop-shadow-lg">
                      {word.text1}
                    </div>
                    <div className="text-white/80 font-medium text-lg">
                      {word.language1Name || 'English'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Second Language Card - Revealed after flip */}
              <div 
                className={`transition-all duration-500 ${
                  isFlipped 
                    ? 'opacity-100 transform translate-y-0' 
                    : 'opacity-0 transform translate-y-4 pointer-events-none'
                }`}
              >
                <div className="bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-3xl p-8 shadow-2xl border-4 border-white/20 relative overflow-hidden">
                  {/* Background Pattern */}
                  <div className="absolute inset-0">
                    <div className="absolute top-6 left-4 w-14 h-14 bg-white/10 rounded-full"></div>
                    <div className="absolute bottom-8 right-6 w-10 h-10 bg-white/10 rounded-full"></div>
                    <div className="absolute top-1/3 right-8 w-6 h-6 bg-white/10 rounded-full"></div>
                  </div>
                  
                  <div className="relative z-10 text-center">
                    <div className="text-4xl font-bold text-white mb-4 drop-shadow-lg">
                      {word.text2 || 'No translation'}
                    </div>
                    <div className="text-white/80 font-medium text-lg">
                      {word.language2Name || 'Türkçe'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Flip Hint */}
              {!isFlipped && (
                <div className="text-center mt-4">
                  <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-slate-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span className="text-sm font-medium">Click to reveal meaning</span>
                  </div>
                </div>
              )}

              {/* Action Hint */}
              {isFlipped && (
                <div className="text-center mt-4">
                  <div className="inline-flex items-center space-x-2 bg-emerald-100 text-emerald-700 rounded-full px-4 py-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-medium">Do you know this word?</span>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation Buttons */}
            {(hasPrevious || canRollback) && (
              <div className="mt-6 flex justify-center space-x-4">
                {hasPrevious && onPrevious && (
                  <button
                    onClick={onPrevious}
                    disabled={disabled}
                    className="flex items-center space-x-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span className="text-sm font-medium">Previous</span>
                  </button>
                )}
                
                {canRollback && onRollback && (
                  <button
                    onClick={onRollback}
                    disabled={disabled}
                    className="flex items-center space-x-2 px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                    <span className="text-sm font-medium">Undo</span>
                  </button>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-6 space-y-4">
              {/* Primary Action Buttons */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={handleKnow}
                  disabled={disabled}
                  className="flex items-center justify-center space-x-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>I Know This</span>
                </button>

                <button
                  onClick={handleDontKnow}
                  disabled={disabled}
                  className="flex items-center justify-center space-x-3 bg-gradient-to-r from-rose-500 to-red-600 text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>Don't Know</span>
                </button>
              </div>

              {/* Secondary Actions */}
              <div className="flex justify-center">
                {onSkip && (
                  <button
                    onClick={handleSkip}
                    disabled={disabled}
                    className="flex items-center space-x-2 text-slate-600 hover:text-slate-800 font-medium py-2 px-4 rounded-lg hover:bg-slate-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Skip for Now</span>
                  </button>
                )}
              </div>
            </div>

            {/* Hint Text */}
            {!isFlipped && (
              <div className="mt-4 text-center">
                <p className="text-xs text-slate-500">
                  💡 Click the card to see the meaning, then choose if you knew it
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-in-out;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .feedback-persistent {
          position: fixed;
          bottom: 1.5rem;
          left: 1.5rem;
          z-index: 50;
          animation: fadeIn 0.5s ease-in-out;
          max-width: 28rem;
          min-width: 20rem;
        }
        .feedback-persistent:hover {
          transform: translateY(-2px);
          transition: transform 0.2s ease-in-out;
        }
        .feedback-persistent .close-btn {
          opacity: 0.7;
          transition: opacity 0.2s ease-in-out;
        }
        .feedback-persistent:hover .close-btn {
          opacity: 1;
        }
        .feedback-persistent .close-btn:hover {
          transform: scale(1.1);
        }
        .feedback-persistent .close-btn:active {
          transform: scale(0.95);
        }
        .feedback-persistent .close-btn:focus {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
        }
        .feedback-persistent .close-btn:focus:not(:focus-visible) {
          outline: none;
        }
        .feedback-persistent .close-btn:focus-visible {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
        }
        .feedback-persistent .close-btn:focus-visible:not(:focus-visible) {
          outline: none;
        }
      `}</style>
    </div>
  );
};

export default StudyCard;
