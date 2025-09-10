import React, { useState } from 'react';
import { Word } from '../../types';

interface QuizSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  responses: Array<{
    wordId: number;
    isCorrect: boolean;
    responseTime: number;
    timestamp: Date;
  }>;
  currentQuestionIndex: number;
  usedWordIds: Set<number>;
  quizWords: Word[];
}

interface SessionStats {
  totalWords: number;
  correctAnswers: number;
  incorrectAnswers: number;
  accuracy: number;
  currentStreak: number;
  longestStreak: number;
}

interface QuizFeedbackProps {
  session: QuizSession | null;
  stats: SessionStats;
  currentIndex: number;
  isGeneratingMore: boolean;
  hintRequests: number;
  isVisible: boolean;
  onToggle: () => void;
}

const QuizFeedback: React.FC<QuizFeedbackProps> = ({
  session,
  stats,
  currentIndex,
  isGeneratingMore,
  hintRequests,
  isVisible,
  onToggle
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'data' | 'system' | 'debug'>('overview');
  const [showRawData, setShowRawData] = useState(false);

  if (!session) return null;

  const now = Date.now();
  const sessionDuration = Math.floor((now - session.startTime.getTime()) / 1000);
  const wordsPerMinute = sessionDuration > 0 ? (session.responses.length / (sessionDuration / 60)) : 0;
  
  const skippedWords = session.responses.filter(r => r.responseTime === 0).length;
  const averageResponseTime = session.responses.length > 0 
    ? session.responses.reduce((sum, r) => sum + r.responseTime, 0) / session.responses.length / 1000
    : 0;
  
  const currentBatch = Math.ceil((currentIndex + 1) / 5);
  const totalBatches = Math.ceil(session.quizWords.length / 5);
  const wordsRemaining = session.quizWords.length - currentIndex - 1;
  
  const recentWords = session.quizWords.slice(Math.max(0, currentIndex - 2), currentIndex + 3);

  // Advanced analytics
  const difficultyDistribution = session.quizWords.reduce((acc, word) => {
    const level = word.difficulty || 0;
    acc[level] = (acc[level] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const responseTimeHistory = session.responses.map(r => r.responseTime / 1000);
  const accuracyHistory = session.responses.map((_, index) => {
    const responses = session.responses.slice(0, index + 1);
    const correct = responses.filter(r => r.isCorrect).length;
    return (correct / responses.length) * 100;
  });

  const timeDistribution = {
    '0-2s': session.responses.filter(r => r.responseTime < 2000).length,
    '2-5s': session.responses.filter(r => r.responseTime >= 2000 && r.responseTime < 5000).length,
    '5-10s': session.responses.filter(r => r.responseTime >= 5000 && r.responseTime < 10000).length,
    '10s+': session.responses.filter(r => r.responseTime >= 10000).length,
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getPerformanceColor = (value: number, thresholds: [number, number, number]) => {
    if (value >= thresholds[2]) return 'text-green-600';
    if (value >= thresholds[1]) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAccuracyColor = () => getPerformanceColor(stats.accuracy, [70, 85, 95]);
  const getSpeedColor = () => getPerformanceColor(wordsPerMinute, [5, 10, 15]);

  const exportSessionData = () => {
    const data = {
      session: {
        id: session.id,
        startTime: session.startTime.toISOString(),
        duration: sessionDuration,
        totalWords: session.quizWords.length,
        wordsUsed: session.usedWordIds.size,
        responses: session.responses.length
      },
      performance: {
        accuracy: stats.accuracy,
        correctAnswers: stats.correctAnswers,
        incorrectAnswers: stats.incorrectAnswers,
        currentStreak: stats.currentStreak,
        longestStreak: stats.longestStreak,
        wordsPerMinute,
        averageResponseTime,
        hintRequests,
        skippedWords
      },
      words: session.quizWords.map(word => ({
        id: word.id,
        text1: word.text1,
        text2: word.text2,
        difficulty: word.difficulty,
        isUsed: session.usedWordIds.has(word.id)
      })),
      responses: session.responses.map(r => ({
        wordId: r.wordId,
        isCorrect: r.isCorrect,
        responseTime: r.responseTime,
        timestamp: r.timestamp.toISOString()
      })),
      analytics: {
        difficultyDistribution,
        timeDistribution,
        responseTimeHistory,
        accuracyHistory
      }
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quiz-session-${session.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'performance', label: 'Performance', icon: '⚡' },
    { id: 'data', label: 'Data', icon: '📈' },
    { id: 'system', label: 'System', icon: '🔧' },
    { id: 'debug', label: 'Debug', icon: '🐛' }
  ];

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className={`fixed top-4 left-4 z-50 p-3 rounded-xl shadow-lg transition-all duration-300 ${
          isVisible 
            ? 'bg-indigo-600 text-white' 
            : 'bg-white text-indigo-600 border-2 border-indigo-200 hover:border-indigo-300'
        }`}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </button>

      {/* Feedback Panel */}
      {isVisible && (
        <div className="fixed top-0 left-0 h-full w-[420px] bg-white shadow-2xl z-40 overflow-y-auto border-r border-slate-200">
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Developer Analytics</h2>
                <p className="text-sm text-slate-500">Real-time quiz data & metrics</p>
              </div>
              <button
                onClick={onToggle}
                className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex space-x-1 mb-6 bg-slate-100 rounded-lg p-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  <span className="mr-1">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="space-y-6">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Session Stats */}
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-4">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Session Overview</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-slate-600">Duration</div>
                        <div className="font-bold text-slate-800">{formatTime(sessionDuration)}</div>
                      </div>
                      <div>
                        <div className="text-slate-600">Speed</div>
                        <div className={`font-bold ${getSpeedColor()}`}>
                          {wordsPerMinute.toFixed(1)} wpm
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-600">Progress</div>
                        <div className="font-bold text-slate-800">
                          {currentIndex + 1} / {session.quizWords.length}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-600">Batch</div>
                        <div className="font-bold text-slate-800">
                          {currentBatch} / {totalBatches}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Performance Metrics */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-800">Performance</h3>
                    
                    <div className="bg-white rounded-xl p-4 border border-slate-200">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-slate-600">Accuracy</span>
                        <span className={`font-bold text-lg ${getAccuracyColor()}`}>
                          {stats.accuracy.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(stats.accuracy, 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-green-50 rounded-xl p-3 border border-green-200">
                        <div className="text-green-600 text-sm">Correct</div>
                        <div className="text-2xl font-bold text-green-700">{stats.correctAnswers}</div>
                      </div>
                      <div className="bg-red-50 rounded-xl p-3 border border-red-200">
                        <div className="text-red-600 text-sm">Incorrect</div>
                        <div className="text-2xl font-bold text-red-700">{stats.incorrectAnswers}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-50 rounded-xl p-3 border border-blue-200">
                        <div className="text-blue-600 text-sm">Current Streak</div>
                        <div className="text-xl font-bold text-blue-700">{stats.currentStreak}</div>
                      </div>
                      <div className="bg-purple-50 rounded-xl p-3 border border-purple-200">
                        <div className="text-purple-600 text-sm">Best Streak</div>
                        <div className="text-xl font-bold text-purple-700">{stats.longestStreak}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Performance Tab */}
              {activeTab === 'performance' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-slate-800">Detailed Performance</h3>
                  
                  {/* Response Time Analysis */}
                  <div className="bg-white rounded-xl p-4 border border-slate-200">
                    <h4 className="font-semibold text-slate-700 mb-3">Response Time Distribution</h4>
                    <div className="space-y-2">
                      {Object.entries(timeDistribution).map(([range, count]) => (
                        <div key={range} className="flex justify-between items-center">
                          <span className="text-sm text-slate-600">{range}</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-20 bg-slate-200 rounded-full h-2">
                              <div 
                                className="bg-indigo-500 h-2 rounded-full"
                                style={{ width: `${(count / session.responses.length) * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-slate-700">{count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Accuracy Trend */}
                  <div className="bg-white rounded-xl p-4 border border-slate-200">
                    <h4 className="font-semibold text-slate-700 mb-3">Accuracy Trend</h4>
                    <div className="h-20 flex items-end space-x-1">
                      {accuracyHistory.slice(-20).map((accuracy, index) => (
                        <div
                          key={index}
                          className="flex-1 bg-indigo-500 rounded-t"
                          style={{ height: `${accuracy}%` }}
                          title={`${accuracy.toFixed(1)}%`}
                        ></div>
                      ))}
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="bg-white rounded-xl p-4 border border-slate-200">
                    <h4 className="font-semibold text-slate-700 mb-3">Recent Activity</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Hints Used</span>
                        <span className="font-medium">{hintRequests}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Skipped Words</span>
                        <span className="font-medium">{skippedWords}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Avg Response Time</span>
                        <span className="font-medium">{averageResponseTime.toFixed(1)}s</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Data Tab */}
              {activeTab === 'data' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-slate-800">Data Management</h3>
                    <button
                      onClick={exportSessionData}
                      className="px-3 py-1 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Export Data
                    </button>
                  </div>

                  {/* Word Statistics */}
                  <div className="bg-white rounded-xl p-4 border border-slate-200">
                    <h4 className="font-semibold text-slate-700 mb-3">Word Statistics</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Total Generated</span>
                        <span className="font-medium">{session.quizWords.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Words Used</span>
                        <span className="font-medium">{session.usedWordIds.size}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Words Remaining</span>
                        <span className="font-medium">{wordsRemaining}</span>
                      </div>
                    </div>
                  </div>

                  {/* Difficulty Distribution */}
                  <div className="bg-white rounded-xl p-4 border border-slate-200">
                    <h4 className="font-semibold text-slate-700 mb-3">Difficulty Distribution</h4>
                    <div className="space-y-2">
                      {Object.entries(difficultyDistribution).map(([level, count]) => (
                        <div key={level} className="flex justify-between items-center">
                          <span className="text-sm text-slate-600">Level {level}</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-16 bg-slate-200 rounded-full h-2">
                              <div 
                                className="bg-purple-500 h-2 rounded-full"
                                style={{ width: `${(count / session.quizWords.length) * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-slate-700">{count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Current Words */}
                  <div className="bg-white rounded-xl p-4 border border-slate-200">
                    <h4 className="font-semibold text-slate-700 mb-3">Current Words</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {recentWords.map((word, index) => {
                        const actualIndex = Math.max(0, currentIndex - 2) + index;
                        const isCurrent = actualIndex === currentIndex;
                        const isUsed = actualIndex < currentIndex;
                        
                        return (
                          <div 
                            key={word.id}
                            className={`p-2 rounded-lg text-sm ${
                              isCurrent 
                                ? 'bg-indigo-100 text-indigo-800 border border-indigo-300' 
                                : isUsed 
                                  ? 'bg-green-50 text-green-700' 
                                  : 'bg-slate-50 text-slate-600'
                            }`}
                          >
                            <div className="font-medium">{word.text1}</div>
                            <div className="text-xs opacity-75">{word.text2} • Level {word.difficulty}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* System Tab */}
              {activeTab === 'system' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-slate-800">System Status</h3>
                  
                  {/* System Health */}
                  <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-4 border border-emerald-200">
                    <h4 className="font-semibold text-emerald-800 mb-3">System Health</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-emerald-700">Quiz Engine Active</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-emerald-700">AI Generation Ready</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-emerald-700">Progressive Loading Enabled</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${isGeneratingMore ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                        <span className="text-emerald-700">
                          {isGeneratingMore ? 'Generating Words...' : 'Word Generation Ready'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* API Usage */}
                  <div className="bg-white rounded-xl p-4 border border-slate-200">
                    <h4 className="font-semibold text-slate-700 mb-3">API Usage</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Quiz Questions Generated</span>
                        <span className="font-medium">{session.quizWords.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Hints Generated</span>
                        <span className="font-medium">{hintRequests}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Total API Calls</span>
                        <span className="font-medium">{session.quizWords.length + hintRequests}</span>
                      </div>
                    </div>
                  </div>

                  {/* Memory Usage */}
                  <div className="bg-white rounded-xl p-4 border border-slate-200">
                    <h4 className="font-semibold text-slate-700 mb-3">Memory Usage</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Words in Memory</span>
                        <span className="font-medium">{session.quizWords.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Responses Stored</span>
                        <span className="font-medium">{session.responses.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Used Word IDs</span>
                        <span className="font-medium">{session.usedWordIds.size}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Debug Tab */}
              {activeTab === 'debug' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-slate-800">Debug Information</h3>
                    <button
                      onClick={() => setShowRawData(!showRawData)}
                      className="px-3 py-1 bg-slate-600 text-white text-sm rounded-lg hover:bg-slate-700 transition-colors"
                    >
                      {showRawData ? 'Hide' : 'Show'} Raw Data
                    </button>
                  </div>

                  {/* Session Debug */}
                  <div className="bg-white rounded-xl p-4 border border-slate-200">
                    <h4 className="font-semibold text-slate-700 mb-3">Session Debug</h4>
                    <div className="space-y-2 text-sm font-mono">
                      <div><span className="text-slate-600">Session ID:</span> {session.id}</div>
                      <div><span className="text-slate-600">Start Time:</span> {session.startTime.toISOString()}</div>
                      <div><span className="text-slate-600">Current Index:</span> {currentIndex}</div>
                      <div><span className="text-slate-600">Total Words:</span> {session.quizWords.length}</div>
                      <div><span className="text-slate-600">Used Words:</span> {session.usedWordIds.size}</div>
                    </div>
                  </div>

                  {/* Performance Debug */}
                  <div className="bg-white rounded-xl p-4 border border-slate-200">
                    <h4 className="font-semibold text-slate-700 mb-3">Performance Debug</h4>
                    <div className="space-y-2 text-sm font-mono">
                      <div><span className="text-slate-600">Session Duration:</span> {sessionDuration}s</div>
                      <div><span className="text-slate-600">Words Per Minute:</span> {wordsPerMinute.toFixed(2)}</div>
                      <div><span className="text-slate-600">Avg Response Time:</span> {averageResponseTime.toFixed(2)}s</div>
                      <div><span className="text-slate-600">Accuracy:</span> {stats.accuracy.toFixed(2)}%</div>
                    </div>
                  </div>

                  {/* Raw Data */}
                  {showRawData && (
                    <div className="bg-slate-900 rounded-xl p-4 text-green-400 text-xs font-mono overflow-x-auto">
                      <pre>{JSON.stringify({
                        session: {
                          id: session.id,
                          startTime: session.startTime,
                          responses: session.responses.length,
                          quizWords: session.quizWords.length
                        },
                        stats,
                        currentIndex,
                        hintRequests,
                        isGeneratingMore
                      }, null, 2)}</pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default QuizFeedback;