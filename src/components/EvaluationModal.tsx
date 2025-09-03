import React, { useState, useEffect } from 'react';
import { Word, DifficultyLevel } from '../types';

interface EvaluationModalProps {
  currentWord: Word | null;
  totalWords: number;
  progressPercentage: number;
  currentIndex: number;
  onRate: (difficulty: DifficultyLevel) => void;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
}

const EvaluationModal: React.FC<EvaluationModalProps> = ({
  currentWord,
  totalWords,
  progressPercentage,
  currentIndex,
  onRate,
  onClose,
  onPrevious,
  onNext
}) => {
  const [clickedRating, setClickedRating] = useState<number | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // Reset reveal state when word changes
  useEffect(() => {
    setIsRevealed(false);
  }, [currentWord?.id]);

  // Keyboard event handlers
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
          const rating = parseInt(event.key) as DifficultyLevel;
          handleRate(rating);
          break;
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          if (currentIndex > 0) {
            onPrevious();
          }
          break;
        case 'ArrowRight':
        case ' ':
          if (event.key === ' ') {
            event.preventDefault();
            setIsRevealed(!isRevealed);
          } else if (currentIndex < totalWords - 1) {
            onNext();
          }
          break;

      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onPrevious, onNext, currentIndex, totalWords, isRevealed]);

  const handleRate = (rating: DifficultyLevel) => {
    setClickedRating(rating);
    setTimeout(() => {
      onRate(rating);
      setClickedRating(null);
    }, 800);
  };

  const getRatingButtonColor = (rating: number, isSelected: boolean = false) => {
    if (isSelected) {
      switch (rating) {
        case 1: return 'bg-gradient-to-br from-green-400 to-green-600 text-white shadow-lg scale-110';
        case 2: return 'bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow-lg scale-110';
        case 3: return 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white shadow-lg scale-110';
        case 4: return 'bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-lg scale-110';
        case 5: return 'bg-gradient-to-br from-red-400 to-red-600 text-white shadow-lg scale-110';
        default: return 'bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow-lg scale-110';
      }
    } else {
      switch (rating) {
        case 1: return 'bg-green-100 text-green-700 hover:bg-green-200 hover:scale-105';
        case 2: return 'bg-blue-100 text-blue-700 hover:bg-blue-200 hover:scale-105';
        case 3: return 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 hover:scale-105';
        case 4: return 'bg-orange-100 text-orange-700 hover:bg-orange-200 hover:scale-105';
        case 5: return 'bg-red-100 text-red-700 hover:bg-red-200 hover:scale-105';
        default: return 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105';
      }
    }
  };

  const getDifficultyLabel = (rating: number): string => {
    switch (rating) {
      case 1: return 'Very Easy';
      case 2: return 'Easy';
      case 3: return 'Medium';
      case 4: return 'Hard';
      case 5: return 'Very Hard';
      default: return 'Not Rated';
    }
  };

  const getDifficultyBadgeColor = (difficulty: number) => {
    switch (difficulty) {
      case 1: return 'bg-gradient-to-r from-green-400 to-green-600';
      case 2: return 'bg-gradient-to-r from-blue-400 to-blue-600';
      case 3: return 'bg-gradient-to-r from-yellow-400 to-yellow-600';
      case 4: return 'bg-gradient-to-r from-orange-400 to-orange-600';
      case 5: return 'bg-gradient-to-r from-red-400 to-red-600';
      default: return 'bg-gradient-to-r from-gray-400 to-gray-600';
    }
  };

  if (!currentWord) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onClose}
                className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <h2 className="text-xl font-semibold">Word Evaluation</h2>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Progress */}
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">
                  {currentIndex + 1} / {totalWords}
                </span>
                <div className="w-24 h-2 bg-white/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white transition-all duration-500 ease-out"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Info Icon */}
              <div className="relative">
                <button
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                  className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
                
                {showTooltip && (
                  <div className="absolute top-full right-0 mt-2 p-3 bg-gray-800 text-white text-sm rounded-lg shadow-lg whitespace-nowrap z-[9999]">
                    <div className="space-y-1">
                      <div><strong>1-5:</strong> Rate difficulty</div>
                      <div><strong>Space:</strong> Reveal answer</div>
                      <div><strong>←→:</strong> Navigate</div>
                      <div><strong>ESC:</strong> Close</div>
                    </div>
                    <div className="absolute bottom-full right-4 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-800"></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Flashcard */}
        <div className="p-8">
          <div className="mb-8">
            {/* Flashcard Container */}
            <div className="relative bg-gradient-to-br from-slate-50 to-gray-100 rounded-3xl p-8 shadow-xl border border-gray-200">
              {/* First Language (Always Visible) */}
              <div className="text-center mb-6">
                <h3 className="text-3xl font-bold text-gray-800 mb-2">
                  {currentWord.text1}
                </h3>
              </div>
              
              {/* Divider */}
              <div className="flex items-center justify-center mb-6">
                <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                <div className="mx-4 text-gray-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>
                <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
              </div>
              
              {/* Second Language (Revealable) */}
              <div className="text-center">
                {isRevealed ? (
                  <div className="space-y-2">
                    <h3 className="text-3xl font-bold text-gray-800">
                      {currentWord.text2}
                    </h3>
                  </div>
                ) : (
                  <div className="flex justify-center items-center">
                    <button
                      onClick={() => setIsRevealed(true)}
                      className="group relative min-h-[80px] w-80 flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-200 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 overflow-hidden"
                    >
                      {/* Background pattern */}
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-100/20 via-transparent to-purple-100/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      
                      {/* Main content */}
                      <div className="relative flex items-center space-x-3">
                        <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full shadow-lg group-hover:shadow-xl transition-all duration-300">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-bold text-gray-700 group-hover:text-gray-800 transition-colors duration-300">
                            Click to reveal
                          </div>
                          <div className="text-sm text-gray-500 group-hover:text-gray-600 transition-colors duration-300">
                            Press Space key
                          </div>
                        </div>
                      </div>
                      
                      {/* Pulse animation */}
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-400/20 to-purple-400/20 animate-pulse opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </button>
                  </div>
                )}
                
                {/* Hide Button - Only show when revealed */}
                {isRevealed && (
                  <div className="flex justify-center mt-6">
                    <button
                      onClick={() => setIsRevealed(false)}
                      className="group relative px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 active:scale-95 bg-gradient-to-r from-gray-100 to-gray-200 border-2 border-gray-300 text-gray-600 hover:from-gray-200 hover:to-gray-300 hover:border-gray-400 hover:text-gray-700 shadow-lg hover:shadow-xl overflow-hidden"
                    >
                      {/* Background pattern */}
                      <div className="absolute inset-0 bg-gradient-to-r from-gray-200/20 via-transparent to-gray-300/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      
                      {/* Content */}
                      <div className="relative flex items-center space-x-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                        </svg>
                        <span>Hide Answer</span>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Selected Rating Indicator */}
          {currentWord.isEvaluated && (
            <div className="mb-6 text-center">
              <div className={`inline-flex items-center space-x-3 px-6 py-3 rounded-full text-lg font-bold animate-fadeIn shadow-lg ${getDifficultyBadgeColor(currentWord.difficulty)}`}>
                <span className="text-2xl">⭐</span>
                <span className="text-white">Difficulty: {getDifficultyLabel(currentWord.difficulty)}</span>
              </div>
            </div>
          )}

          {/* Rating Buttons */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
              {currentWord.isEvaluated ? 'You can change your rating below:' : 'How would you rate this word?'}
            </h3>
            
            <div className="grid grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5].map((rating) => (
                <div key={rating} className="flex flex-col items-center space-y-3">
                  <div className="relative">
                    <button
                      onClick={() => handleRate(rating as DifficultyLevel)}
                      className={`w-16 h-16 rounded-2xl text-xl font-bold transition-all duration-300 transform hover:scale-110 active:scale-95 shadow-lg hover:shadow-xl ${
                        clickedRating === rating ? 'animate-bounce shadow-2xl' : ''
                      } ${
                        clickedRating === rating 
                          ? 'ring-4 ring-yellow-400 shadow-yellow-200'
                          : currentWord.difficulty === rating && currentWord.isEvaluated
                          ? getRatingButtonColor(rating, true) + ' rating-glow rating-selected'
                          : getRatingButtonColor(rating)
                      }`}
                    >
                      {rating}
                    </button>
                    
                    {/* Selected rating indicator */}
                    {currentWord.difficulty === rating && currentWord.isEvaluated && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg animate-pulse border-2 border-white">
                        <span className="text-white text-xs font-bold">✓</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Difficulty Label */}
                  <div className="text-center">
                    <div className={`text-sm font-semibold px-3 py-2 rounded-lg ${
                      currentWord.difficulty === rating && currentWord.isEvaluated
                        ? getRatingButtonColor(rating, true) + ' rating-glow rating-selected'
                        : getRatingButtonColor(rating)
                    }`}>
                      {getDifficultyLabel(rating)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between">
            <button
              onClick={onPrevious}
              disabled={currentIndex === 0}
              className={`group relative px-6 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center space-x-3 overflow-hidden ${
                currentIndex > 0
                  ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 text-blue-700 hover:from-blue-100 hover:to-indigo-100 hover:border-blue-300 hover:text-blue-800 shadow-lg hover:shadow-xl'
                  : 'bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {/* Background pattern for enabled state */}
              {currentIndex > 0 && (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-200/20 via-transparent to-indigo-200/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              )}
              
              {/* Content */}
              <div className="relative flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Previous</span>
              </div>
            </button>

            <button
              onClick={onClose}
              className="group relative px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 active:scale-95 bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 text-red-700 hover:from-red-100 hover:to-pink-100 hover:border-red-300 hover:text-red-800 shadow-lg hover:shadow-xl overflow-hidden"
            >
              {/* Background pattern */}
              <div className="absolute inset-0 bg-gradient-to-r from-red-200/20 via-transparent to-pink-200/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              {/* Content */}
              <div className="relative flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Stop Evaluation</span>
              </div>
            </button>

            <button
              onClick={onNext}
              disabled={currentIndex === totalWords - 1}
              className={`group relative px-6 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center space-x-3 overflow-hidden ${
                currentIndex < totalWords - 1
                  ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 text-green-700 hover:from-green-100 hover:to-emerald-100 hover:border-green-300 hover:text-green-800 shadow-lg hover:shadow-xl'
                  : 'bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {/* Background pattern for enabled state */}
              {currentIndex < totalWords - 1 && (
                <div className="absolute inset-0 bg-gradient-to-r from-green-200/20 via-transparent to-emerald-200/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              )}
              
              {/* Content */}
              <div className="relative flex items-center space-x-2">
                <span>Next</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EvaluationModal;
