import React from 'react';
import { StudySession } from '../../utils/studyAlgorithm';

interface StudyResultProps {
  session: StudySession;
  sessionStats: {
    totalWords: number;
    correctAnswers: number;
    incorrectAnswers: number;
    accuracy: number;
    avgScoreChange: number;
    longestStreak: number;
    currentStreak: number;
  };
  onStartNewSession: () => void;
  onGoHome: () => void;
}

const StudyResult: React.FC<StudyResultProps> = ({
  session,
  sessionStats,
  onStartNewSession,
  onGoHome
}) => {
  const duration = session ? Math.round((Date.now() - session.startTime) / 60000) : 0; // minutes
  
  const getPerformanceMessage = () => {
    const { accuracy, longestStreak } = sessionStats;
    
    if (accuracy >= 90 && longestStreak >= 5) {
      return { message: "Outstanding Performance! 🌟", color: "emerald", emoji: "🏆" };
    } else if (accuracy >= 80 && longestStreak >= 3) {
      return { message: "Excellent Work! 🎉", color: "blue", emoji: "⭐" };
    } else if (accuracy >= 70) {
      return { message: "Great Progress! 👏", color: "indigo", emoji: "💪" };
    } else if (accuracy >= 60) {
      return { message: "Good Effort! 👍", color: "amber", emoji: "📚" };
    } else {
      return { message: "Keep Practicing! 💪", color: "orange", emoji: "🎯" };
    }
  };

  const performance = getPerformanceMessage();

  const getScoreChangeMessage = () => {
    if (sessionStats.avgScoreChange < -0.2) {
      return { text: "Words are getting easier! 📉", color: "emerald" };
    } else if (sessionStats.avgScoreChange > 0.2) {
      return { text: "Challenge level increased! 📈", color: "rose" };
    } else {
      return { text: "Maintaining difficulty level ➡️", color: "blue" };
    }
  };

  const scoreChange = getScoreChangeMessage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        {/* Main Result Card */}
        <div className="relative bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/30 overflow-hidden p-8">
          {/* Background Decorations */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100/40 to-indigo-100/40 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-indigo-100/40 to-purple-100/40 rounded-full translate-y-12 -translate-x-12"></div>
          
          <div className="relative z-10">
            {/* Header */}
            <div className="text-center mb-8">
              <div className={`w-20 h-20 bg-gradient-to-br from-${performance.color}-400 to-${performance.color}-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl ring-4 ring-${performance.color}-100`}>
                <div className="text-3xl">{performance.emoji}</div>
              </div>
              
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-indigo-800 bg-clip-text text-transparent mb-2">
                Study Session Complete!
              </h1>
              <p className={`text-xl font-semibold text-${performance.color}-600`}>
                {performance.message}
              </p>
            </div>

            {/* Statistics Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {/* Total Words */}
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200/50 text-center">
                <div className="text-2xl font-bold text-slate-800 mb-1">{sessionStats.totalWords}</div>
                <div className="text-xs font-medium text-slate-600">Words Studied</div>
              </div>

              {/* Accuracy */}
              <div className={`bg-gradient-to-br from-${performance.color}-50 to-${performance.color}-100 rounded-xl p-4 border border-${performance.color}-200/50 text-center`}>
                <div className={`text-2xl font-bold text-${performance.color}-800 mb-1`}>
                  {sessionStats.accuracy.toFixed(1)}%
                </div>
                <div className={`text-xs font-medium text-${performance.color}-700`}>Accuracy</div>
              </div>

              {/* Longest Streak */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-100 rounded-xl p-4 border border-amber-200/50 text-center">
                <div className="text-2xl font-bold text-amber-800 mb-1">{sessionStats.longestStreak}</div>
                <div className="text-xs font-medium text-amber-700">Best Streak</div>
              </div>

              {/* Duration */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-100 rounded-xl p-4 border border-indigo-200/50 text-center">
                <div className="text-2xl font-bold text-indigo-800 mb-1">{duration}m</div>
                <div className="text-xs font-medium text-indigo-700">Duration</div>
              </div>
            </div>

            {/* Detailed Stats */}
            <div className="space-y-4 mb-8">
              {/* Known vs Unknown */}
              <div className="bg-white/60 rounded-xl p-4 backdrop-blur-sm border border-white/50">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-slate-700">Knowledge Breakdown</span>
                  <span className="text-sm text-slate-600">
                    {sessionStats.correctAnswers} known, {sessionStats.incorrectAnswers} to practice
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                  <div className="h-full flex">
                    <div 
                      className="bg-gradient-to-r from-emerald-500 to-green-600 transition-all duration-1000 ease-out"
                      style={{ width: `${(sessionStats.correctAnswers / sessionStats.totalWords) * 100}%` }}
                    ></div>
                    <div 
                      className="bg-gradient-to-r from-rose-500 to-red-600 transition-all duration-1000 ease-out"
                      style={{ width: `${(sessionStats.incorrectAnswers / sessionStats.totalWords) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Score Change Info */}
              <div className={`bg-${scoreChange.color}-50 rounded-xl p-4 border border-${scoreChange.color}-200/50`}>
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 bg-${scoreChange.color}-500 rounded-lg flex items-center justify-center`}>
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div>
                    <div className={`font-semibold text-${scoreChange.color}-800`}>Difficulty Adjustment</div>
                    <div className={`text-sm text-${scoreChange.color}-700`}>{scoreChange.text}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={onStartNewSession}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center space-x-2"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Study Again</span>
              </button>

              <button
                onClick={onGoHome}
                className="w-full bg-white/80 backdrop-blur-sm text-slate-700 font-semibold py-3 px-6 rounded-xl border border-slate-200 hover:bg-white hover:shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span>Back to Home</span>
              </button>
            </div>

            {/* Encouragement Message */}
            <div className="mt-6 text-center">
              <p className="text-sm text-slate-600">
                {sessionStats.accuracy >= 80 
                  ? "Excellent progress! Your vocabulary is improving steadily. 🚀"
                  : sessionStats.accuracy >= 60
                  ? "Good work! Keep practicing to strengthen your vocabulary. 📚"
                  : "Every study session helps! Consistency is key to improvement. 💪"
                }
              </p>
            </div>
          </div>
        </div>

        {/* Fun Stats Card */}
        {sessionStats.longestStreak >= 5 && (
          <div className="mt-6 bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl p-6 text-white text-center">
            <div className="text-2xl mb-2">🔥</div>
            <div className="font-bold text-lg">Streak Master!</div>
            <div className="text-emerald-100">
              You achieved a {sessionStats.longestStreak}-word streak! Amazing focus! 🎯
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudyResult;



