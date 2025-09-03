import React from 'react';
import { Word } from '../types';

interface HeaderProps {
  words: Word[];
}

const Header: React.FC<HeaderProps> = ({ words }) => {
  const getProgressPercentage = () => {
    const totalWords = words.length;
    const evaluatedWords = words.filter(word => word.isEvaluated).length;
    return totalWords > 0 ? Math.round((evaluatedWords / totalWords) * 100) : 0;
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'from-emerald-500 to-green-600';
    if (percentage >= 60) return 'from-blue-500 to-indigo-600';
    if (percentage >= 40) return 'from-amber-500 to-orange-600';
    if (percentage >= 20) return 'from-orange-500 to-red-600';
    return 'from-red-500 to-rose-600';
  };

  return (
    <div className="bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          {/* Left side - Title and description */}
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 via-blue-800 to-indigo-800 bg-clip-text text-transparent">
                Word Rating System
              </h1>
            </div>
            <p className="text-slate-600 text-base font-medium">
              Organize your words and determine their difficulty levels
            </p>
          </div>
          
          {/* Right side - Stats */}
          <div className="flex items-center space-x-8">
            {/* Total Words */}
            <div className="text-center bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-lg border border-white/20">
              <div className="text-3xl font-bold text-slate-800 mb-1">{words.length}</div>
              <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Total</div>
              <div className="w-12 h-1 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full mx-auto mt-2"></div>
            </div>
            
            {/* Progress */}
            <div className="text-center bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-lg border border-white/20">
              <div className="text-3xl font-bold text-blue-600 mb-1">{getProgressPercentage()}%</div>
              <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Completed</div>
              <div className="w-12 h-1 bg-gradient-to-r from-emerald-400 to-green-400 rounded-full mx-auto mt-2"></div>
            </div>
            
            {/* Evaluated Count */}
            <div className="text-center bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-lg border border-white/20">
              <div className="text-3xl font-bold text-slate-800 mb-1">
                {words.filter(w => w.isEvaluated).length}
              </div>
              <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Evaluated</div>
              <div className="w-12 h-1 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full mx-auto mt-2"></div>
            </div>
          </div>
        </div>
        
        {/* Progress Bar - Only show if there are words */}
        {words.length > 0 && (
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/30 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <span className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Overall Progress</span>
              </div>
              <span className="text-sm text-slate-600 font-medium">
                {words.filter(w => w.isEvaluated).length} / {words.length} words
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden shadow-inner">
              <div 
                className={`h-3 rounded-full bg-gradient-to-r ${getProgressColor(getProgressPercentage())} transition-all duration-1000 ease-out shadow-lg`}
                style={{ width: `${getProgressPercentage()}%` }}
              ></div>
            </div>
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-slate-500">0%</span>
              <span className="text-xs text-slate-500">100%</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Header;
