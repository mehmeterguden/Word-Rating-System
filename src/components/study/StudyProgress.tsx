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
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl ring-1 ring-slate-200 p-6 mb-6">
      {/* Progress Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 00-2-2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-indigo-800 bg-clip-text text-transparent">
              Study Progress
            </h3>
            <p className="text-sm text-slate-600">
              Word {currentIndex + 1} of {totalWords}
            </p>
          </div>
        </div>
        
        {/* Current Difficulty Badge */}
        <div className={`px-4 py-2 rounded-xl font-semibold text-sm bg-${difficultyColor}-100 text-${difficultyColor}-700 ring-1 ring-${difficultyColor}-200`}>
          Level {currentDifficulty} - {difficultyLabel}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-slate-700">Overall Progress</span>
          <span className="text-sm font-bold text-indigo-600">{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden shadow-inner">
          <div 
            className="h-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-500 ease-out shadow-sm"
            style={{ width: `${progress}%` }}
          >
            <div className="h-full bg-gradient-to-r from-white/20 to-transparent rounded-full"></div>
          </div>
        </div>
        <div className="flex justify-between text-xs text-slate-500 mt-1">
          <span>Start</span>
          <span>Complete</span>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Correct Answers */}
        <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-4 border border-emerald-200/50">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-xs font-medium text-emerald-700">Known</span>
          </div>
          <div className="text-2xl font-bold text-emerald-800">{sessionStats.correctAnswers}</div>
        </div>

        {/* Incorrect Answers */}
        <div className="bg-gradient-to-br from-rose-50 to-red-50 rounded-xl p-4 border border-rose-200/50">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-8 h-8 bg-rose-500 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <span className="text-xs font-medium text-rose-700">Unknown</span>
          </div>
          <div className="text-2xl font-bold text-rose-800">{sessionStats.incorrectAnswers}</div>
        </div>

        {/* Accuracy */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200/50">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 00-2-2z" />
              </svg>
            </div>
            <span className="text-xs font-medium text-blue-700">Accuracy</span>
          </div>
          <div className={`text-2xl font-bold ${getAccuracyColor(sessionStats.accuracy)}`}>
            {sessionStats.accuracy.toFixed(1)}%
          </div>
        </div>

        {/* Current Streak */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200/50">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-xs font-medium text-amber-700">Streak</span>
          </div>
          <div className="flex items-end space-x-1">
            <div className="text-2xl font-bold text-amber-800">{sessionStats.currentStreak}</div>
            {sessionStats.longestStreak > sessionStats.currentStreak && (
              <div className="text-sm text-amber-600 pb-1">
                (best: {sessionStats.longestStreak})
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Streak Indicator */}
      {sessionStats.currentStreak > 0 && (
        <div className="mt-4 text-center">
          <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full ${getStreakColor(sessionStats.currentStreak)}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="font-semibold">
              {sessionStats.currentStreak === 1 ? 'Good start!' : 
               sessionStats.currentStreak < 3 ? 'Keep going!' :
               sessionStats.currentStreak < 5 ? 'Great streak!' :
               sessionStats.currentStreak < 10 ? 'Amazing streak!' :
               'Incredible! 🔥'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudyProgress;

