import React, { useState, useEffect } from 'react';
import { getDifficultyColor, getDifficultyLabel } from '../../utils/studyAlgorithm';
import { getLanguageByName } from '../../utils/languages';
import { getWordImage, preloadImage, getRemainingLimits } from '../../utils/imageApi';

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
  showFeedback?: boolean;
  onToggleFeedback?: () => void;
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
  showFeedback = true,
  onToggleFeedback,
  lastScoreChange
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const [showSecondWord, setShowSecondWord] = useState(false);
  const [isFlippedMode, setIsFlippedMode] = useState(false); // false = text1->text2, true = text2->text1
  const [startTime, setStartTime] = useState<number | null>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  
  // Image states
  const [showImage, setShowImage] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageSource, setImageSource] = useState<string>('');
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [apiLimits, setApiLimits] = useState({ unsplash: 50, pixabay: 5000 });

  const difficultyColor = getDifficultyColor(word.difficulty);
  const difficultyLabel = getDifficultyLabel(word.difficulty);

  // Audio pronunciation function
  const speakWord = (text: string, languageName?: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Set language if available
      if (languageName) {
        const language = getLanguageByName(languageName);
        if (language) {
          utterance.lang = language.code;
        }
      }
      
      // Set voice properties for better pronunciation
      utterance.rate = 0.8;
      utterance.pitch = 1;
      utterance.volume = 1;
      
      // Try to find a voice that matches the language
      const voices = speechSynthesis.getVoices();
      const preferredVoice = voices.find(voice => 
        languageName && getLanguageByName(languageName) ? 
        voice.lang.startsWith(getLanguageByName(languageName)?.code || 'en') : 
        voice.lang.startsWith('en')
      );
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      
      speechSynthesis.speak(utterance);
    } else {
      console.warn('Speech synthesis not supported');
    }
  };

  // Reset flip state when word changes
  useEffect(() => {
    setIsFlipped(false);
    setShowAnimation(false);
    setShowSecondWord(false); // Hide second word when moving to next word
    setStartTime(Date.now());
    setResponseTime(null);
    // Reset image states when word changes
    setShowImage(false);
    setImageUrl(null);
    setImageSource('');
    setImageError(false);
    setImageLoading(false);
    // Don't close feedback when word changes - let it stay persistent
  }, [word.id]);

  // Update API limits periodically
  useEffect(() => {
    const updateLimits = () => {
      setApiLimits(getRemainingLimits());
    };
    
    updateLimits(); // Initial load
    const interval = setInterval(updateLimits, 5000); // Update every 5 seconds
    
    return () => clearInterval(interval);
  }, []);

  // Feedback visibility is now controlled by parent component via showFeedback prop

  // Keyboard event handlers
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (disabled) return;
      
      switch (event.key) {
        case ' ':
          event.preventDefault();
          setShowSecondWord(!showSecondWord);
          break;
        case 'ArrowLeft':
          event.preventDefault();
          handleDontKnow();
          break;
        case 'ArrowRight':
          event.preventDefault();
          handleKnow();
          break;
        case 'ArrowUp':
          event.preventDefault();
          if (onPrevious) onPrevious();
          break;
        case 'ArrowDown':
          event.preventDefault();
          if (onSkip) onSkip();
          break;
        case 'r':
        case 'R':
          event.preventDefault();
          if (onRollback) onRollback();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [disabled, showSecondWord, onSkip]);

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

  const handleFlipMode = () => {
    setIsFlippedMode(!isFlippedMode);
    setShowSecondWord(false); // Hide the revealed word when flipping mode
  };

  // Image loading function
  const handleImageClick = async (forceReload = false) => {
    if (imageUrl && !forceReload) {
      setShowImage(true);
      return;
    }

    setImageLoading(true);
    setImageError(false);
    
    if (forceReload) {
      setImageUrl(null);
      setImageSource('');
    }

    try {
      const currentWord = isFlippedMode ? word.text2! : word.text1;
      const result = await getWordImage(currentWord, forceReload);
      
      if (result.url) {
        // Resmi önceden yükle
        const loaded = await preloadImage(result.url);
        
        if (loaded) {
          setImageUrl(result.url);
          setImageSource(result.source);
          setShowImage(true);
          // API limit'lerini güncelle
          setApiLimits(getRemainingLimits());
        } else {
          setImageError(true);
        }
      } else {
        setImageError(true);
      }
    } catch (error) {
      console.error('Error loading image:', error);
      setImageError(true);
    } finally {
      setImageLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Advanced Developer Debug Panel */}
      {lastScoreChange && showFeedback && (
        <div className="feedback-persistent">
          <div className={`bg-slate-900 text-white rounded-2xl shadow-2xl border-2 p-6 relative max-w-6xl ${
            lastScoreChange.isKnown 
              ? 'border-emerald-400' 
              : 'border-rose-400'
          }`}>
            {/* Close Button */}
            <button
              onClick={onToggleFeedback}
              className="close-btn absolute top-3 right-3 w-7 h-7 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center transition-colors group"
              title="Hide feedback panel"
            >
              <svg className="w-4 h-4 text-slate-300 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="pr-10">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
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
                
              </div>

              {/* Vertical Grouped Data */}
              <div className="space-y-3">
                {/* Response & Score Group */}
                <div className="bg-slate-800 rounded-lg p-3">
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <div className="text-slate-400 mb-1">Response</div>
                      <div className={`font-mono text-sm ${
                        lastScoreChange.isKnown ? 'text-emerald-300' : 'text-rose-300'
                      }`}>
                        {lastScoreChange.isKnown ? 'Known' : 'Unknown'}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400 mb-1">Score Change</div>
                      <div className="font-mono text-sm text-blue-300">
                        {lastScoreChange.previousScore.toFixed(1)} → {lastScoreChange.newScore.toFixed(1)}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400 mb-1">Level Change</div>
                      <div className="font-mono text-sm text-purple-300">
                        {lastScoreChange.previousLevel} → {lastScoreChange.newLevel}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400 mb-1">Net Change</div>
                      <div className={`font-mono text-sm ${
                        lastScoreChange.scoreDifference < 0 ? 'text-emerald-300' : 'text-rose-300'
                      }`}>
                        {lastScoreChange.scoreDifference > 0 ? '+' : ''}{lastScoreChange.scoreDifference.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Score Breakdown Group */}
                <div className="bg-slate-800 rounded-lg p-3">
                  <div className="space-y-2">
                    <div className="text-slate-400 text-xs mb-2">Score Breakdown</div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Base Score:</span>
                        <span className="font-mono text-blue-300">{lastScoreChange.previousScore.toFixed(1)}</span>
                      </div>
                      {lastScoreChange.isKnown ? (
                        <>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Correct Answer:</span>
                            <span className="font-mono text-emerald-300">+{Math.abs(lastScoreChange.scoreDifference).toFixed(2)}</span>
                          </div>
                          {(lastScoreChange.algorithmDetails.consecutiveCorrectForWord || 0) > 0 && (
                            <div className="flex justify-between">
                              <span className="text-slate-400">Word Streak Bonus:</span>
                              <span className="font-mono text-emerald-300">+{((lastScoreChange.algorithmDetails.consecutiveCorrectForWord || 0) * 0.1).toFixed(1)}</span>
                            </div>
                          )}
                          {lastScoreChange.previousScore <= 1.0 && (
                            <div className="flex justify-between">
                              <span className="text-slate-400">Mastery Bonus:</span>
                              <span className="font-mono text-emerald-300">+0.5</span>
                            </div>
                          )}
                          {(lastScoreChange.algorithmDetails.timingFactor || 1) > 1.0 && (
                            <div className="flex justify-between">
                              <span className="text-slate-400">Time Bonus:</span>
                              <span className="font-mono text-emerald-300">+{((lastScoreChange.algorithmDetails.timingFactor || 1) - 1).toFixed(2)}</span>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Incorrect Answer:</span>
                            <span className="font-mono text-rose-300">{lastScoreChange.scoreDifference.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Base Penalty:</span>
                            <span className="font-mono text-rose-300">-{Math.abs(lastScoreChange.scoreDifference * 0.6).toFixed(2)}</span>
                          </div>
                          {(lastScoreChange.algorithmDetails.recentFailures || 0) > 0 && (
                            <div className="flex justify-between">
                              <span className="text-slate-400">Recent Failures Penalty:</span>
                              <span className="font-mono text-rose-300">-{((lastScoreChange.algorithmDetails.recentFailures || 0) * 0.1).toFixed(1)}</span>
                            </div>
                          )}
                          {lastScoreChange.previousScore > 2.0 && (
                            <div className="flex justify-between">
                              <span className="text-slate-400">High Score Penalty:</span>
                              <span className="font-mono text-rose-300">-{((lastScoreChange.previousScore - 2.0) * 0.2).toFixed(1)}</span>
                            </div>
                          )}
                          {(lastScoreChange.algorithmDetails.timingFactor || 1) < 1.0 && (
                            <div className="flex justify-between">
                              <span className="text-slate-400">Slow Response Penalty:</span>
                              <span className="font-mono text-rose-300">-{((1 - (lastScoreChange.algorithmDetails.timingFactor || 1)) * 0.3).toFixed(2)}</span>
                            </div>
                          )}
                          {(lastScoreChange.algorithmDetails.consecutiveCorrectForWord || 0) > 0 && (
                            <div className="flex justify-between">
                              <span className="text-slate-400">Streak Break Penalty:</span>
                              <span className="font-mono text-rose-300">-{((lastScoreChange.algorithmDetails.consecutiveCorrectForWord || 0) * 0.05).toFixed(2)}</span>
                            </div>
                          )}
                        </>
                      )}
                      <div className="border-t border-slate-600 pt-1">
                        <div className="flex justify-between font-semibold">
                          <span className="text-slate-300">Final Score:</span>
                          <span className={`font-mono ${
                            lastScoreChange.scoreDifference < 0 ? 'text-emerald-300' : 'text-rose-300'
                          }`}>
                            {lastScoreChange.newScore.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Streaks & Performance Group */}
                <div className="bg-slate-800 rounded-lg p-3">
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <div className="text-slate-400 mb-1">Consecutive</div>
                      <div className="font-mono text-sm text-emerald-300">
                        {lastScoreChange.consecutiveCorrect}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400 mb-1">Word Streak</div>
                      <div className="font-mono text-sm text-cyan-300">
                        {lastScoreChange.algorithmDetails.consecutiveCorrectForWord || 0}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400 mb-1">Recent Failures</div>
                      <div className="font-mono text-sm text-rose-300">
                        {lastScoreChange.algorithmDetails.recentFailures || 0}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400 mb-1">Mastery</div>
                      <div className={`font-mono text-sm ${
                        lastScoreChange.previousScore <= 1.0 ? 'text-emerald-300' : 'text-slate-300'
                      }`}>
                        {lastScoreChange.previousScore <= 1.0 ? 'Yes' : 'No'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Algorithm Group */}
                <div className="bg-slate-800 rounded-lg p-3">
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <div className="text-slate-400 mb-1">Difficulty</div>
                      <div className={`font-mono text-sm ${
                        lastScoreChange.algorithmDetails.isEasy ? 'text-green-300' :
                        lastScoreChange.algorithmDetails.isMedium ? 'text-yellow-300' : 'text-red-300'
                      }`}>
                        {lastScoreChange.algorithmDetails.isEasy ? 'Easy' :
                         lastScoreChange.algorithmDetails.isMedium ? 'Medium' : 'Hard'}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400 mb-1">Learning Rate</div>
                      <div className="font-mono text-sm text-blue-300">
                        {lastScoreChange.algorithmDetails.learningRate.toFixed(2)}x
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400 mb-1">Time Factor</div>
                      <div className="font-mono text-sm text-purple-300">
                        {lastScoreChange.algorithmDetails.timeFactor.toFixed(2)}x
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400 mb-1">Timing Factor</div>
                      <div className={`font-mono text-sm ${
                        (lastScoreChange.algorithmDetails.timingFactor || 1) > 1.0 ? 'text-emerald-300' :
                        (lastScoreChange.algorithmDetails.timingFactor || 1) < 1.0 ? 'text-rose-300' : 'text-slate-300'
                      }`}>
                        {(lastScoreChange.algorithmDetails.timingFactor || 1).toFixed(2)}x
                      </div>
                    </div>
                  </div>
                </div>

                {/* Timing Group */}
                <div className="bg-slate-800 rounded-lg p-3">
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <div className="text-slate-400 mb-1">Response Time</div>
                      <div className="font-mono text-sm text-yellow-300">
                        {lastScoreChange.algorithmDetails.responseTime ? 
                          (lastScoreChange.algorithmDetails.responseTime / 1000).toFixed(2) + 's' : 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400 mb-1">Avg Response</div>
                      <div className="font-mono text-sm text-yellow-300">
                        {lastScoreChange.algorithmDetails.averageResponseTime ? 
                          (lastScoreChange.algorithmDetails.averageResponseTime / 1000).toFixed(2) + 's' : 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400 mb-1">Time Ratio</div>
                      <div className={`font-mono text-sm ${
                        (lastScoreChange.algorithmDetails.timeRatio || 1) < 0.5 ? 'text-emerald-300' :
                        (lastScoreChange.algorithmDetails.timeRatio || 1) < 0.8 ? 'text-green-300' :
                        (lastScoreChange.algorithmDetails.timeRatio || 1) < 1.2 ? 'text-blue-300' : 'text-amber-300'
                      }`}>
                        {(lastScoreChange.algorithmDetails.timeRatio || 1).toFixed(2)}x
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400 mb-1">Away Detection</div>
                      <div className={`font-mono text-sm ${
                        lastScoreChange.algorithmDetails.isLikelyAway ? 'text-amber-300' : 'text-green-300'
                      }`}>
                        {lastScoreChange.algorithmDetails.isLikelyAway ? 'Yes' : 'No'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bonus & Penalty Details Group */}
                <div className="bg-slate-800 rounded-lg p-3">
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <div className="text-slate-400 mb-1">Word Streak Bonus</div>
                      <div className="font-mono text-sm text-emerald-300">
                        {(lastScoreChange.algorithmDetails.consecutiveCorrectForWord || 0) > 0 ? 
                          `+${((lastScoreChange.algorithmDetails.consecutiveCorrectForWord || 0) * 0.1).toFixed(1)}` : 
                          '0.0'
                        }
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400 mb-1">Mastery Bonus</div>
                      <div className={`font-mono text-sm ${
                        lastScoreChange.previousScore <= 1.0 ? 'text-emerald-300' : 'text-slate-300'
                      }`}>
                        {lastScoreChange.previousScore <= 1.0 ? '+0.5' : '0.0'}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400 mb-1">Time Bonus</div>
                      <div className={`font-mono text-sm ${
                        (lastScoreChange.algorithmDetails.timingFactor || 1) > 1.0 ? 'text-emerald-300' :
                        (lastScoreChange.algorithmDetails.timingFactor || 1) < 1.0 ? 'text-rose-300' : 'text-slate-300'
                      }`}>
                        {lastScoreChange.algorithmDetails.timingFactor ? 
                          `${(lastScoreChange.algorithmDetails.timingFactor - 1).toFixed(2)}` : 
                          '0.00'
                        }
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400 mb-1">Learning Rate</div>
                      <div className="font-mono text-sm text-blue-300">
                        {lastScoreChange.algorithmDetails.learningRate.toFixed(2)}x
                      </div>
                    </div>
                  </div>
                </div>

                {/* Time & Debug Group */}
                <div className="bg-slate-800 rounded-lg p-3">
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <div className="text-slate-400 mb-1">Hours Since</div>
                      <div className="font-mono text-sm text-cyan-300">
                        {lastScoreChange.algorithmDetails.hoursSinceStudied?.toFixed(1) || '0.0'}h
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400 mb-1">Word ID</div>
                      <div className="font-mono text-sm text-slate-300">
                        {lastScoreChange.wordId}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400 mb-1">Session</div>
                      <div className="font-mono text-sm text-slate-300">
                        {Date.now().toString(36).substring(0, 8)}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400 mb-1">Algorithm</div>
                      <div className="font-mono text-sm text-slate-300">
                        v2.0
                      </div>
                    </div>
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

        {/* Show Feedback Button when feedback is hidden */}
        {lastScoreChange && !showFeedback && onToggleFeedback && (
          <div className="fixed bottom-4 left-4 z-50">
            <button
              onClick={onToggleFeedback}
              className={`group relative px-3 py-2 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center space-x-2 ${
                lastScoreChange.isKnown 
                  ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white' 
                  : 'bg-gradient-to-r from-rose-500 to-red-600 text-white'
              }`}
              title="Show feedback panel"
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                lastScoreChange.isKnown ? 'bg-emerald-600' : 'bg-rose-600'
              }`}>
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {lastScoreChange.isKnown ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  )}
                </svg>
              </div>
              <span className="text-sm">Feedback</span>
            </button>
          </div>
        )}

        {/* Main Card */}
        <div 
          className={`relative bg-gradient-to-br from-white/95 via-blue-50/50 to-indigo-50/50 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 overflow-hidden transition-all duration-300 ${
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
                  <p className="text-sm text-slate-600">
                    {isFlippedMode ? 
                      `${word.language2Name || 'Known'} → ${word.language1Name || 'Target'}` : 
                      `${word.language1Name || 'Target'} → ${word.language2Name || 'Known'}`
                    }
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Flip Mode Button */}
                <button
                  onClick={handleFlipMode}
                  className="group relative px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center space-x-2"
                  title="Switch study direction"
                >
                  <div className="p-1 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors duration-300">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                  </div>
                  <span className="text-sm font-bold">Flip</span>
                </button>
                
                {/* Difficulty Badge */}
                <div className={`px-3 py-1.5 rounded-lg font-semibold text-sm bg-${difficultyColor}-100 text-${difficultyColor}-700 ring-1 ring-${difficultyColor}-200`}>
                  {difficultyLabel}
                </div>
              </div>
            </div>
          </div>

          {/* Flashcard Container */}
          <div className="relative z-10 px-8 pb-8">
            {/* Card Display Area */}
            <div className="relative w-full">
        {/* First Language Card - Always Visible */}
        <div className="mb-6">
          <div className="bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-3xl p-8 shadow-2xl border border-white/30 relative overflow-hidden h-[180px] flex items-center justify-center hover:shadow-3xl transition-all duration-500 hover:scale-[1.02] group">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-4 right-4 w-20 h-20 bg-white/20 rounded-full blur-xl"></div>
              <div className="absolute bottom-4 left-4 w-16 h-16 bg-white/20 rounded-full blur-lg"></div>
            </div>
            
            <div className="relative z-10 text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="text-5xl font-bold text-white drop-shadow-2xl group-hover:scale-105 transition-transform duration-300">
                  {isFlippedMode ? word.text2 : word.text1}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => speakWord(isFlippedMode ? word.text2! : word.text1, isFlippedMode ? word.language2Name : word.language1Name)}
                    className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all duration-200 hover:scale-110 active:scale-95 shadow-lg"
                    title="Listen pronunciation"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/>
                    </svg>
                  </button>
                  <button
                    onClick={() => handleImageClick()}
                    disabled={imageLoading}
                    className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all duration-200 hover:scale-110 active:scale-95 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Show image"
                  >
                    {imageLoading ? (
                      <svg className="w-6 h-6 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <div className="text-white/90 font-semibold text-xl tracking-wide">
                {isFlippedMode ? (word.language2Name || 'Türkçe') : (word.language1Name || 'English')}
              </div>
            </div>
            
            {/* Shine Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          </div>
        </div>

              {/* Second Language Card - Hidden by default */}
              <div 
                className="cursor-pointer transition-all duration-500 hover:scale-[1.02] group"
                onClick={() => setShowSecondWord(!showSecondWord)}
              >
                <div className={`rounded-3xl p-8 shadow-2xl border relative overflow-hidden h-[180px] flex items-center justify-center hover:shadow-3xl transition-all duration-500 ${
                  showSecondWord 
                    ? 'bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 border-white/30' 
                    : 'bg-gradient-to-br from-slate-400 via-slate-500 to-slate-600 border-white/20'
                }`}>
                  {/* Background Pattern */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-4 right-4 w-20 h-20 bg-white/20 rounded-full blur-xl"></div>
                    <div className="absolute bottom-4 left-4 w-16 h-16 bg-white/20 rounded-full blur-lg"></div>
                  </div>
                  
                  <div className="relative z-10 text-center">
                    <div className={`flex items-center justify-center gap-3 mb-4 ${
                      showSecondWord ? '' : 'opacity-50'
                    }`}>
                      <div className={`text-5xl font-bold drop-shadow-2xl group-hover:scale-105 transition-transform duration-300 ${
                        showSecondWord ? 'text-white' : 'text-slate-200'
                      }`}>
                        {showSecondWord ? (isFlippedMode ? (word.text1 || 'No translation') : (word.text2 || 'No translation')) : (
                          <div className="flex items-center justify-center space-x-2">
                            {Array.from({ length: (isFlippedMode ? word.text1?.length : word.text2?.length) || 6 }, (_, i) => (
                              <div key={i} className="w-3 h-10 bg-slate-300 rounded-full animate-pulse" style={{animationDelay: `${i * 0.1}s`}}></div>
                            ))}
                          </div>
                        )}
                      </div>
                      {showSecondWord && (isFlippedMode ? word.text1 : word.text2) && (
                        <button
                          onClick={() => speakWord(isFlippedMode ? word.text1! : word.text2!, isFlippedMode ? word.language1Name : word.language2Name)}
                          className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all duration-200 hover:scale-110 active:scale-95 shadow-lg"
                          title="Listen pronunciation"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/>
                          </svg>
                        </button>
                      )}
                    </div>
                    <div className={`font-semibold text-xl tracking-wide ${
                      showSecondWord ? 'text-white/90' : 'text-slate-300'
                    }`}>
                      {isFlippedMode ? (word.language1Name || 'English') : (word.language2Name || 'Türkçe')}
                    </div>
                    {!showSecondWord && (
                      <div className="text-slate-300 text-sm mt-3 font-medium">
                        Click or press Space to reveal
                      </div>
                    )}
                  </div>
                  
                  {/* Shine Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
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


            {/* Action Buttons */}
            <div className="mt-6 space-y-4">
              {/* Primary Action Buttons */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={handleDontKnow}
                  disabled={disabled}
                  className="flex items-center justify-center space-x-3 bg-gradient-to-r from-rose-500 to-red-600 text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>Don't Know</span>
                  <span className="text-xs bg-white/20 px-2 py-1 rounded">←</span>
                </button>

                <button
                  onClick={handleKnow}
                  disabled={disabled}
                  className="flex items-center justify-center space-x-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>I Know This</span>
                  <span className="text-xs bg-white/20 px-2 py-1 rounded">→</span>
                </button>
              </div>

              {/* Secondary Actions */}
            {/* Navigation Controls */}
            <div className="flex justify-between items-center w-full">
              {/* Previous Button - Always Visible */}
              <button
                onClick={hasPrevious && onPrevious ? onPrevious : undefined}
                disabled={disabled || !hasPrevious}
                className={`group flex items-center justify-center w-12 h-12 rounded-full shadow-lg transition-all duration-300 border ${
                  hasPrevious && onPrevious
                    ? 'bg-gradient-to-br from-slate-100 to-slate-200 hover:from-blue-100 hover:to-blue-200 text-slate-600 hover:text-blue-600 hover:shadow-xl cursor-pointer hover:scale-110 active:scale-95 border-slate-200 hover:border-blue-300'
                    : 'bg-gradient-to-br from-slate-50 to-slate-100 text-slate-300 cursor-not-allowed border-slate-100'
                }`}
              >
                <svg className="w-6 h-6 transition-transform duration-200 group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              {/* Next Button - Always Visible */}
              <button
                onClick={onSkip ? handleSkip : undefined}
                disabled={disabled || !onSkip}
                className={`group flex items-center justify-center w-12 h-12 rounded-full shadow-lg transition-all duration-300 border ${
                  onSkip
                    ? 'bg-gradient-to-br from-slate-100 to-slate-200 hover:from-emerald-100 hover:to-emerald-200 text-slate-600 hover:text-emerald-600 hover:shadow-xl cursor-pointer hover:scale-110 active:scale-95 border-slate-200 hover:border-emerald-300'
                    : 'bg-gradient-to-br from-slate-50 to-slate-100 text-slate-300 cursor-not-allowed border-slate-100'
                }`}
              >
                <svg className="w-6 h-6 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
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

      {/* Image Modal */}
      {showImage && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">
                    {isFlippedMode ? word.text2 : word.text1}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {isFlippedMode ? (word.language2Name || 'Türkçe') : (word.language1Name || 'English')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleImageClick(true)}
                  disabled={imageLoading}
                  className="p-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Reload image"
                >
                  <svg className={`w-4 h-4 ${imageLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
                <button
                  onClick={() => setShowImage(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Modal Content */}
            <div className="p-4">
              {imageError ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">Image not found</h3>
                  <p className="text-slate-500 mb-4">Sorry, we couldn't find an image for this word.</p>
                  <button
                    onClick={() => setShowImage(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                  >
                    Close
                  </button>
                </div>
              ) : imageUrl ? (
                <div className="relative">
                  <img
                    src={imageUrl}
                    alt={isFlippedMode ? word.text2 : word.text1}
                    className="w-full h-auto rounded-lg shadow-lg"
                    onError={() => setImageError(true)}
                  />
                  <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                    via {imageSource === 'unsplash' ? 'Unsplash' : imageSource === 'pixabay' ? 'Pixabay' : 'Cache'}
                  </div>
                </div>
              ) : null}
            </div>
            
            {/* API Limits Display */}
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-200">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span>Unsplash: {apiLimits.unsplash}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span>Pixabay: {apiLimits.pixabay}</span>
                  </div>
                </div>
                <div className="text-slate-400">
                  Daily limits
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
          bottom: 1rem;
          left: 1rem;
          z-index: 50;
          animation: fadeIn 0.5s ease-in-out;
          max-width: 28rem;
          min-width: 24rem;
          max-height: 70vh;
          overflow-y: auto;
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
