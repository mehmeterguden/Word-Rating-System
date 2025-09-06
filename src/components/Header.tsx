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
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left side - Title and description */}
          <div className="flex-1">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 via-blue-800 to-indigo-800 bg-clip-text text-transparent">
                  Word Rating System
                </h1>
                <p className="text-slate-600 text-sm font-medium">
                  Organize your words and determine their difficulty levels
                </p>
              </div>
            </div>
          </div>
          
          {/* Right side - Compact Progress Stats */}
          {words.length > 0 && (
            <div className="bg-gradient-to-r from-white/95 via-blue-50/90 to-indigo-50/90 backdrop-blur-sm rounded-2xl px-8 py-5 shadow-xl border border-white/60 relative overflow-hidden min-w-[600px]">
              {/* Background decorations */}
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-blue-100/30 to-indigo-100/30 rounded-full -translate-y-8 translate-x-8"></div>
              <div className="absolute bottom-0 left-0 w-12 h-12 bg-gradient-to-tr from-indigo-100/30 to-purple-100/30 rounded-full translate-y-6 -translate-x-6"></div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-between w-full gap-8">
                  {/* Progress section */}
                  <div className="flex items-center space-x-6 flex-1">
                    <div className="text-center">
                      <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        {getProgressPercentage()}%
                      </div>
                      <div className="text-xs text-slate-500 font-medium tracking-wide">Complete</div>
                    </div>
                    
                    <div className="flex-1 max-w-xs">
                      <div className="w-full bg-gradient-to-r from-slate-200/70 to-slate-300/60 rounded-full h-4 overflow-hidden shadow-inner border border-slate-300/50">
                        <div 
                          className={`h-4 rounded-full bg-gradient-to-r ${getProgressColor(getProgressPercentage())} transition-all duration-1000 ease-out shadow-lg relative`}
                          style={{ width: `${getProgressPercentage()}%` }}
                        >
                          <div className="absolute inset-0 bg-white/20 rounded-full"></div>
                          <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/10 rounded-full"></div>
                        </div>
                      </div>
                      <div className="flex justify-between mt-1 text-xs text-slate-500">
                        <span>0%</span>
                        <span>100%</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Word counts */}
                  <div className="flex items-center space-x-4 bg-white/60 rounded-xl px-5 py-3 backdrop-blur-sm border border-white/80 flex-shrink-0">
                    <div className="text-center">
                      <div className="text-lg font-bold text-emerald-600">
                        {words.filter(w => w.isEvaluated).length}
                      </div>
                      <div className="text-xs text-slate-500 font-medium">Evaluated</div>
                    </div>
                    
                    <div className="w-px h-6 bg-slate-300/60"></div>
                    
                    <div className="text-center">
                      <div className="text-lg font-bold text-amber-600">
                        {words.filter(w => !w.isEvaluated).length}
                      </div>
                      <div className="text-xs text-slate-500 font-medium">Pending</div>
                    </div>
                    
                    <div className="w-px h-6 bg-slate-300/60"></div>
                    
                    <div className="text-center">
                      <div className="text-lg font-bold text-slate-700">
                        {words.length}
                      </div>
                      <div className="text-xs text-slate-500 font-medium">Total</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Header;
