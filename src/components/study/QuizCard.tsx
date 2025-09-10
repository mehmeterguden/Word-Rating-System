import React, { useState, useEffect } from 'react';
import { Word, DifficultyLevel } from '../../types';
import { QuizQuestion } from '../../utils/quizAi';

interface QuizCardProps {
  word: Word;
  question: QuizQuestion;
  onAnswer: (isCorrect: boolean, responseTime: number) => void;
  onNext?: () => void;
  onSkip?: () => void;
  onPrevious?: () => void;
  onRollback?: () => void;
  onHint?: () => void;
  disabled?: boolean;
  showResult?: boolean;
  isCorrect?: boolean;
  hasNext?: boolean;
  hasPrevious?: boolean;
  canRollback?: boolean;
  lastScoreChange?: number;
  isSessionComplete?: boolean;
  showFeedback?: boolean;
  onToggleFeedback?: () => void;
  sourceLanguageName: string;
  targetLanguageName: string;
  hint?: string | null;
  isLoadingHint?: boolean;
}

const QuizCard: React.FC<QuizCardProps> = ({
  word,
  question,
  onAnswer,
  onNext,
  onSkip,
  onPrevious,
  onRollback,
  onHint,
  disabled = false,
  showResult = false,
  isCorrect = false,
  hasNext = false,
  hasPrevious = false,
  canRollback = false,
  lastScoreChange = 0,
  isSessionComplete = false,
  showFeedback = true,
  onToggleFeedback,
  sourceLanguageName,
  targetLanguageName,
  hint = null,
  isLoadingHint = false
}) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [startTime] = useState(Date.now());

  // Debug logging
  console.log('🎯 QuizCard Render State:', {
    showResult,
    hasNext,
    onNext: !!onNext,
    isCorrect,
    selectedOption,
    disabled,
    questionWord: question?.word,
    wordId: word?.id
  });
  
  // Check if Next button should be visible
  const shouldShowNext = showResult && onNext && hasNext;
  console.log('🔍 Next Button Visibility Check:', {
    showResult,
    hasOnNext: !!onNext,
    hasNext,
    shouldShowNext,
    disabled
  });

  // Reset state when question changes
  useEffect(() => {
    setSelectedOption(null);
  }, [question.word]);

  const handleOptionSelect = (optionIndex: number) => {
    if (disabled || showResult || selectedOption !== null) return;
    
    setSelectedOption(optionIndex);
    const responseTime = Date.now() - startTime;
    const isCorrectAnswer = question.options[optionIndex].isCorrect;
    
    // Show result immediately but don't auto-advance
    onAnswer(isCorrectAnswer, responseTime);
  };

  const getDifficultyColor = (level: DifficultyLevel) => {
    const colors = {
      0: 'bg-slate-100 text-slate-600',
      1: 'bg-green-100 text-green-700',
      2: 'bg-blue-100 text-blue-700',
      3: 'bg-yellow-100 text-yellow-700',
      4: 'bg-orange-100 text-orange-700',
      5: 'bg-red-100 text-red-700'
    };
    return colors[level] || colors[0];
  };

  const getDifficultyLabel = (level: DifficultyLevel) => {
    const labels = {
      0: 'Not Set',
      1: 'Very Easy',
      2: 'Easy',
      3: 'Medium',
      4: 'Hard',
      5: 'Very Hard'
    };
    return labels[level] || labels[0];
  };

  const getOptionStyle = (optionIndex: number) => {
    if (!showResult) {
      return selectedOption === optionIndex
        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-400 text-blue-800 shadow-lg ring-2 ring-blue-200'
        : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:shadow-md';
    }

    const option = question.options[optionIndex];
    if (option.isCorrect) {
      return 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-400 text-green-800 shadow-lg ring-2 ring-green-200';
    }
    if (selectedOption === optionIndex && !option.isCorrect) {
      return 'bg-gradient-to-r from-red-50 to-rose-50 border-red-400 text-red-800 shadow-lg ring-2 ring-red-200';
    }
    return 'bg-slate-50 border-slate-200 text-slate-500';
  };

  const getOptionIcon = (optionIndex: number) => {
    const optionLetters = ['A', 'B', 'C', 'D'];
    
    if (!showResult) {
      return selectedOption === optionIndex ? (
        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg ring-2 ring-blue-200">
          <span className="text-white font-bold text-lg">{optionLetters[optionIndex]}</span>
        </div>
      ) : (
        <div className="w-10 h-10 border-2 border-slate-300 rounded-full flex items-center justify-center bg-white hover:border-blue-400 transition-colors">
          <span className="text-slate-600 font-bold text-lg">{optionLetters[optionIndex]}</span>
        </div>
      );
    }

    const option = question.options[optionIndex];
    if (option.isCorrect) {
      return (
        <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg ring-2 ring-green-200">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      );
    }
    if (selectedOption === optionIndex && !option.isCorrect) {
      return (
        <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-rose-600 rounded-full flex items-center justify-center shadow-lg ring-2 ring-red-200">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      );
    }
    return (
      <div className="w-10 h-10 border-2 border-slate-300 rounded-full flex items-center justify-center bg-slate-50">
        <span className="text-slate-400 font-bold text-lg">{optionLetters[optionIndex]}</span>
      </div>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Main Quiz Card */}
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-600 p-6 text-white relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full translate-y-8 -translate-x-8"></div>
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-1">Quiz Challenge</h2>
                  <p className="text-indigo-100 text-sm">Find the correct translation</p>
                </div>
              </div>
              <div className="text-right">
                <div className={`px-3 py-1.5 rounded-xl text-xs font-bold ${getDifficultyColor(word.difficulty)} shadow-lg`}>
                  {getDifficultyLabel(word.difficulty)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Question */}
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="relative inline-block mb-6">
              <div className="text-4xl font-bold text-slate-800 mb-4 bg-gradient-to-r from-slate-800 via-indigo-800 to-purple-800 bg-clip-text text-transparent">
                {question.word}
              </div>
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-24 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full"></div>
            </div>
            <div className="text-lg text-slate-600 font-medium">
              What is the correct translation in <span className="font-bold text-indigo-600">{sourceLanguageName}</span>?
            </div>
            <div className="mt-2 text-sm text-slate-500">
              Choose the most accurate translation from the options below
            </div>
            
            {/* Hint Section */}
            {onHint && (
              <div className="mt-6">
                <button
                  onClick={onHint}
                  disabled={disabled || isLoadingHint || showResult}
                  className="px-4 py-2 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 rounded-xl font-medium hover:from-amber-200 hover:to-orange-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 mx-auto"
                >
                  {isLoadingHint ? (
                    <>
                      <div className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading hint...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Hint</span>
                    </>
                  )}
                </button>
                
                {hint && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-medium text-blue-800 mb-1">Hint:</div>
                        <div className="text-blue-700">{hint}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {question.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleOptionSelect(index)}
                disabled={disabled || showResult || selectedOption !== null}
                className={`
                  relative p-6 rounded-2xl border-2 transition-all duration-300 text-left group
                  ${getOptionStyle(index)}
                  ${disabled || showResult || selectedOption !== index ? 'cursor-not-allowed' : 'cursor-pointer'}
                  ${!showResult && selectedOption !== index ? 'hover:shadow-xl transform hover:scale-[1.02] hover:-translate-y-1' : ''}
                `}
              >
                <div className="flex items-center space-x-4">
                  {getOptionIcon(index)}
                  <div className="flex-1">
                    <div className="text-xl font-bold group-hover:text-slate-800 transition-colors">
                      {option.text}
                    </div>
                  </div>
                </div>
                
                {/* Hover Effect Overlay */}
                {!showResult && selectedOption !== index && (
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                )}
              </button>
            ))}
          </div>

          {/* Result Feedback */}
          {showResult && (
            <div className={`text-center p-6 rounded-2xl mb-6 shadow-lg relative overflow-hidden ${
              isCorrect 
                ? 'bg-gradient-to-r from-green-50 to-emerald-100 border-2 border-green-300' 
                : 'bg-gradient-to-r from-red-50 to-rose-100 border-2 border-red-300'
            }`}>
              <div className="relative z-10">
                <div className="flex items-center justify-center space-x-4 mb-4">
                  {isCorrect ? (
                    <>
                      <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <span className="text-2xl font-bold text-green-700 block">Perfect!</span>
                        <span className="text-sm text-green-600">Well done!</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-rose-600 rounded-full flex items-center justify-center shadow-lg">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                      <div>
                        <span className="text-2xl font-bold text-red-700 block">Try Again!</span>
                        <span className="text-sm text-red-600">Keep learning!</span>
                      </div>
                    </>
                  )}
                </div>
                
                <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 mb-4">
                  <div className="text-lg text-slate-700 mb-1">
                    The correct answer is:
                  </div>
                  <div className="text-2xl font-bold text-slate-800">
                    {question.correctAnswer}
                  </div>
                </div>
                
                {lastScoreChange !== 0 && (
                  <div className={`text-sm font-bold px-4 py-2 rounded-full inline-block ${
                    lastScoreChange > 0 
                      ? 'bg-green-200 text-green-800' 
                      : 'bg-red-200 text-red-800'
                  }`}>
                    {lastScoreChange > 0 ? '+' : ''}{lastScoreChange.toFixed(1)} points
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center gap-4">
            {/* Next Question Button - Only show when result is shown */}
            {showResult && onNext && hasNext && (
              <button
                onClick={() => {
                  console.log('🔄 Next Question Button Clicked');
                  console.log('📊 Button State:', { showResult, onNext: !!onNext, hasNext, disabled });
                  onNext();
                }}
                disabled={disabled}
                className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-bold text-base hover:shadow-lg transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                <span>Next Question</span>
              </button>
            )}

            {/* Previous Button */}
            {onPrevious && hasPrevious && (
              <button
                onClick={onPrevious}
                disabled={disabled}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Previous</span>
              </button>
            )}

            {/* Skip Button */}
            {onSkip && (
              <button
                onClick={onSkip}
                disabled={disabled}
                className="px-4 py-2 bg-amber-100 text-amber-700 rounded-lg font-medium hover:bg-amber-200 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Skip</span>
              </button>
            )}

            {/* Rollback Button */}
            {onRollback && canRollback && (
              <button
                onClick={onRollback}
                disabled={disabled}
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium hover:bg-blue-200 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
                <span>Undo</span>
              </button>
            )}

            {/* Toggle Feedback Button */}
            {onToggleFeedback && (
              <button
                onClick={onToggleFeedback}
                className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2 text-sm ${
                  showFeedback 
                    ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' 
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{showFeedback ? 'Hide' : 'Show'} Feedback</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizCard;

