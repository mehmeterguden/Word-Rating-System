import React from 'react';
import { Word } from '../../types';
import { StudyResponse } from '../../utils/studyAlgorithm';

interface StudyWord extends Word {
  internalScore: number;
  consecutiveCorrect: number;
  lastStudiedTime?: number;
  studyResponses: StudyResponse[];
}

interface WordStatsPanelProps {
  word: StudyWord;
  sessionStats: {
    totalWords: number;
    correctAnswers: number;
    incorrectAnswers: number;
    accuracy: number;
    avgScoreChange: number;
    longestStreak: number;
    currentStreak: number;
  };
  currentIndex: number;
  totalWords: number;
}

const WordStatsPanel: React.FC<WordStatsPanelProps> = ({
  word,
  sessionStats,
  currentIndex,
  totalWords
}) => {
  // Calculate word-specific statistics
  const wordResponses = word.studyResponses || [];
  const correctResponses = wordResponses.filter((r: StudyResponse) => r.isKnown).length;
  const totalResponses = wordResponses.length;
  const wordAccuracy = totalResponses > 0 ? (correctResponses / totalResponses) * 100 : 0;
  
  // Calculate consecutive streak for this word
  const consecutiveCorrect = word.consecutiveCorrectForWord || 0;
  
  // Calculate average response time for this word
  const responseTimes = wordResponses.map((r: StudyResponse) => r.responseTime).filter((t: number) => t > 0);
  const avgResponseTime = responseTimes.length > 0 
    ? responseTimes.reduce((sum: number, time: number) => sum + time, 0) / responseTimes.length 
    : 0;

  // Calculate score trend
  const scoreHistory = wordResponses.map((r: StudyResponse) => r.newScore);
  const scoreTrend = scoreHistory.length > 1 
    ? scoreHistory[scoreHistory.length - 1] - scoreHistory[0]
    : 0;

  // Calculate recent performance (last 5 responses)
  const recentResponses = wordResponses.slice(-5);
  const recentCorrect = recentResponses.filter((r: StudyResponse) => r.isKnown).length;
  const recentAccuracy = recentResponses.length > 0 ? (recentCorrect / recentResponses.length) * 100 : 0;

  // Calculate improvement rate
  const improvementRate = scoreHistory.length > 1 
    ? ((scoreHistory[scoreHistory.length - 1] - scoreHistory[0]) / scoreHistory[0]) * 100
    : 0;

  // Get difficulty color
  const getDifficultyColor = (level: number) => {
    if (level <= 1) return 'emerald';
    if (level <= 2) return 'green';
    if (level <= 3) return 'yellow';
    if (level <= 4) return 'orange';
    return 'red';
  };

  const difficultyColor = getDifficultyColor(word.difficulty);
  const difficultyLabel = ['Very Easy', 'Easy', 'Medium', 'Hard', 'Very Hard', 'Expert'][word.difficulty] || 'Unknown';

  return (
    <div className="w-full lg:w-80 bg-white/60 backdrop-blur-sm rounded-2xl shadow-xl border border-white/30 p-6 h-fit sticky top-6">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-800">Word Statistics</h3>
          <p className="text-sm text-slate-600">Current word analysis</p>
        </div>
      </div>

      {/* Current Word Info */}
      <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl p-4 mb-6 border border-slate-200">
        <div className="text-center">
          <div className="text-2xl font-bold text-slate-800 mb-2">{word.text1}</div>
          <div className="text-sm text-slate-600 mb-3">{word.text2}</div>
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-${difficultyColor}-100 text-${difficultyColor}-700 mb-3`}>
            {difficultyLabel} (Level {word.difficulty})
          </div>
          
          {/* Learning Progress Bar */}
          {totalResponses > 0 && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-slate-600 mb-1">
                <span>Learning Progress</span>
                <span>{Math.min(totalResponses, 10)}/10</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((totalResponses / 10) * 100, 100)}%` }}
                ></div>
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {totalResponses >= 10 ? 'Mastered!' : `${10 - totalResponses} more to master`}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Word Performance Stats */}
      <div className="space-y-4 mb-6">
        <h4 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">Word Performance</h4>
        
        {/* Accuracy */}
        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-slate-700">Accuracy</span>
          </div>
          <div className="text-right">
            <div className="font-bold text-slate-800">{wordAccuracy.toFixed(1)}%</div>
            <div className="text-xs text-slate-500">{correctResponses}/{totalResponses} correct</div>
          </div>
        </div>

        {/* Consecutive Streak */}
        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-slate-700">Current Streak</span>
          </div>
          <div className="text-right">
            <div className="font-bold text-slate-800">{consecutiveCorrect}</div>
            <div className="text-xs text-slate-500">in a row</div>
          </div>
        </div>

        {/* Average Response Time */}
        {avgResponseTime > 0 && (
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-slate-700">Avg. Time</span>
            </div>
            <div className="text-right">
              <div className="font-bold text-slate-800">{(avgResponseTime / 1000).toFixed(1)}s</div>
              <div className="text-xs text-slate-500">response time</div>
            </div>
          </div>
        )}

        {/* Score Trend */}
        {scoreHistory.length > 1 && (
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                </svg>
              </div>
              <span className="text-sm font-medium text-slate-700">Score Trend</span>
            </div>
            <div className="text-right">
              <div className={`font-bold ${scoreTrend > 0 ? 'text-emerald-600' : scoreTrend < 0 ? 'text-red-600' : 'text-slate-600'}`}>
                {scoreTrend > 0 ? '+' : ''}{scoreTrend.toFixed(1)}
              </div>
              <div className="text-xs text-slate-500">over time</div>
            </div>
          </div>
        )}

        {/* Recent Performance */}
        {recentResponses.length > 0 && (
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <span className="text-sm font-medium text-slate-700">Recent (5)</span>
            </div>
            <div className="text-right">
              <div className="font-bold text-slate-800">{recentAccuracy.toFixed(0)}%</div>
              <div className="text-xs text-slate-500">{recentCorrect}/{recentResponses.length} correct</div>
            </div>
          </div>
        )}

        {/* Improvement Rate */}
        {Math.abs(improvementRate) > 0.1 && (
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-slate-700">Improvement</span>
            </div>
            <div className="text-right">
              <div className={`font-bold ${improvementRate > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {improvementRate > 0 ? '+' : ''}{improvementRate.toFixed(1)}%
              </div>
              <div className="text-xs text-slate-500">score change</div>
            </div>
          </div>
        )}
      </div>

      {/* Session Stats */}
      <div className="space-y-4 mb-6">
        <h4 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">Session Progress</h4>
        
        {/* Progress */}
        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <span className="text-sm font-medium text-slate-700">Progress</span>
          </div>
          <div className="text-right">
            <div className="font-bold text-slate-800">{currentIndex + 1}/{totalWords}</div>
            <div className="text-xs text-slate-500">words studied</div>
          </div>
        </div>

        {/* Session Accuracy */}
        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-slate-700">Session Accuracy</span>
          </div>
          <div className="text-right">
            <div className="font-bold text-slate-800">{sessionStats.accuracy.toFixed(1)}%</div>
            <div className="text-xs text-slate-500">{sessionStats.correctAnswers}/{sessionStats.totalWords}</div>
          </div>
        </div>

        {/* Current Streak */}
        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-slate-700">Session Streak</span>
          </div>
          <div className="text-right">
            <div className="font-bold text-slate-800">{sessionStats.currentStreak}</div>
            <div className="text-xs text-slate-500">current streak</div>
          </div>
        </div>
      </div>

      {/* Internal Score Info */}
      <div className="space-y-4">
        <h4 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">Technical Details</h4>
        
        {/* Internal Score */}
        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-slate-700">Internal Score</span>
          </div>
          <div className="text-right">
            <div className="font-bold text-slate-800">{(word.internalScore || 0).toFixed(2)}</div>
            <div className="text-xs text-slate-500">algorithm score</div>
          </div>
        </div>

        {/* Study Count */}
        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-cyan-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <span className="text-sm font-medium text-slate-700">Study Count</span>
          </div>
          <div className="text-right">
            <div className="font-bold text-slate-800">{totalResponses}</div>
            <div className="text-xs text-slate-500">times studied</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-slate-200">
        <div className="text-xs text-slate-500 text-center">
          💡 Statistics update in real-time as you study
        </div>
      </div>
    </div>
  );
};

export default WordStatsPanel;
