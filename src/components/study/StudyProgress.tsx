import React from 'react';
import { getDifficultyColor, getDifficultyLabel } from '../../utils/studyAlgorithm';

interface StudyProgressProps {
  currentIndex: number;
  totalWords: number;
  progress: number;
  currentDifficulty: number;
  sessionStats: {
    totalWords: number;
    correctAnswers: number;
    incorrectAnswers: number;
    accuracy: number;
    currentStreak: number;
    longestStreak: number;
  };
}

const StudyProgress: React.FC<StudyProgressProps> = ({
  currentIndex,
  totalWords,
  progress,
  currentDifficulty,
  sessionStats
}) => {
  const difficultyColor = getDifficultyColor(currentDifficulty);
  const difficultyLabel = getDifficultyLabel(currentDifficulty);

  const getStreakColor = (streak: number) => {
    if (streak >= 5) return 'text-emerald-600 bg-emerald-50';
    if (streak >= 3) return 'text-blue-600 bg-blue-50';
    if (streak >= 1) return 'text-amber-600 bg-amber-50';
    return 'text-slate-600 bg-slate-50';
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 80) return 'text-emerald-600';
    if (accuracy >= 60) return 'text-blue-600';
    if (accuracy >= 40) return 'text-amber-600';
    return 'text-rose-600';
  };

  return (
    <div className="relative bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30 backdrop-blur-xl rounded-2xl shadow-xl border border-white/40 p-5 mb-6 overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-indigo-100/40 to-purple-100/40 rounded-full -translate-y-10 translate-x-10"></div>
      <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-purple-100/40 to-indigo-100/40 rounded-full translate-y-8 -translate-x-8"></div>
      
      {/* Progress Header */}
      <div className="relative z-10 flex items-center justify-between mb-5">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg ring-2 ring-indigo-100">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 00-2-2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold bg-gradient-to-r from-slate-800 via-indigo-800 to-purple-800 bg-clip-text text-transparent">
              Study Progress
            </h3>
            <p className="text-slate-600 text-sm font-medium">
              Word {currentIndex + 1} of {totalWords}
            </p>
          </div>
        </div>
        
        {/* Current Difficulty Badge */}
        <div className={`px-4 py-2 rounded-xl font-semibold text-xs bg-gradient-to-r from-${difficultyColor}-100 to-${difficultyColor}-200 text-${difficultyColor}-800 ring-1 ring-${difficultyColor}-200 shadow-md`}>
          Level {currentDifficulty} - {difficultyLabel}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative z-10 mb-5">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-semibold text-slate-700">Overall Progress</span>
          <span className="text-sm font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">{Math.round(progress)}%</span>
        </div>
        <div className="relative w-full bg-gradient-to-r from-slate-200 to-slate-300 rounded-xl h-3 overflow-hidden shadow-inner ring-1 ring-slate-200">
          <div 
            className="h-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-xl transition-all duration-700 ease-out shadow-lg relative overflow-hidden"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/30 via-white/10 to-transparent rounded-xl"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
          </div>
        </div>
        <div className="flex justify-between text-xs text-slate-500 mt-1 font-medium">
          <span>Start</span>
          <span>Complete</span>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Correct Answers */}
        <div className="relative bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100 rounded-xl p-4 border border-emerald-200/60 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 group overflow-hidden">
          <div className="absolute top-0 right-0 w-12 h-12 bg-emerald-200/30 rounded-full -translate-y-6 translate-x-6"></div>
          <div className="relative z-10">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center shadow-md">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-emerald-700">Known</span>
            </div>
            <div className="text-2xl font-bold text-emerald-800">{sessionStats.correctAnswers}</div>
          </div>
        </div>

        {/* Incorrect Answers */}
        <div className="relative bg-gradient-to-br from-rose-50 via-red-50 to-rose-100 rounded-xl p-4 border border-rose-200/60 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 group overflow-hidden">
          <div className="absolute top-0 right-0 w-12 h-12 bg-rose-200/30 rounded-full -translate-y-6 translate-x-6"></div>
          <div className="relative z-10">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-8 h-8 bg-gradient-to-br from-rose-500 to-red-600 rounded-lg flex items-center justify-center shadow-md">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-rose-700">Unknown</span>
            </div>
            <div className="text-2xl font-bold text-rose-800">{sessionStats.incorrectAnswers}</div>
          </div>
        </div>

        {/* Accuracy */}
        <div className="relative bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 rounded-xl p-4 border border-blue-200/60 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 group overflow-hidden">
          <div className="absolute top-0 right-0 w-12 h-12 bg-blue-200/30 rounded-full -translate-y-6 translate-x-6"></div>
          <div className="relative z-10">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 00-2-2z" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-blue-700">Accuracy</span>
            </div>
            <div className={`text-2xl font-bold ${getAccuracyColor(sessionStats.accuracy)}`}>
              {sessionStats.accuracy.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Current Streak */}
        <div className="relative bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 rounded-xl p-4 border border-amber-200/60 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 group overflow-hidden">
          <div className="absolute top-0 right-0 w-12 h-12 bg-amber-200/30 rounded-full -translate-y-6 translate-x-6"></div>
          <div className="relative z-10">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center shadow-md">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-amber-700">Streak</span>
            </div>
            <div className="flex items-end space-x-1">
              <div className="text-2xl font-bold text-amber-800">{sessionStats.currentStreak}</div>
              {sessionStats.longestStreak > sessionStats.currentStreak && (
                <div className="text-xs text-amber-600 pb-1 font-medium">
                  (best: {sessionStats.longestStreak})
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Streak Indicator */}
      {sessionStats.currentStreak > 0 && (
        <div className="relative z-10 mt-5 text-center">
          <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-xl ${getStreakColor(sessionStats.currentStreak)} shadow-md border border-current/20`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="font-semibold text-sm">
              {sessionStats.currentStreak === 1 ? 'Good start! 🎯' : 
               sessionStats.currentStreak < 3 ? 'Keep going! 💪' :
               sessionStats.currentStreak < 5 ? 'Great streak! ⭐' :
               sessionStats.currentStreak < 10 ? 'Amazing streak! 🚀' :
               'Incredible! 🔥'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudyProgress;


