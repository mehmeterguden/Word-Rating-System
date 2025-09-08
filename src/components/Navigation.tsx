import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Page, Word, WordSet } from '../types';

interface NavigationProps {
  currentPage: Page;
  words: Word[];
  onStartEvaluation: () => void;
  wordSets: WordSet[];
  activeSetId: string | null;
  onSetActive: (setId: string) => void;
  developerMode?: boolean;
}

const Navigation: React.FC<NavigationProps> = ({ 
  currentPage, 
  words, 
  onStartEvaluation,
  wordSets,
  activeSetId,
  onSetActive,
  developerMode = false
}) => {
  const navigate = useNavigate();
  const [showSetSelector, setShowSetSelector] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const unevaluatedCount = words.filter(word => !word.isEvaluated).length;
  const evaluatedCount = words.filter(word => word.isEvaluated).length;
  const activeSet = wordSets.find(set => set.id === activeSetId);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSetSelector(false);
      }
    };

    if (showSetSelector) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSetSelector]);

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-6">
        <nav className="flex items-center justify-between py-2">
          {/* Left side - Navigation buttons */}
          <div className="flex space-x-1">
            <button
              onClick={() => navigate('/home')}
              className={`px-6 py-4 text-sm font-medium transition-all duration-200 rounded-xl ${
                currentPage === 'home'
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg transform scale-105'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 hover:shadow-md'
              }`}
            >
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span>Home</span>
              </div>
            </button>
            <button
              onClick={() => navigate('/add')}
              className={`px-6 py-4 text-sm font-medium transition-all duration-200 rounded-xl ${
                currentPage === 'add'
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg transform scale-105'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 hover:shadow-md'
              }`}
            >
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Add Words</span>
              </div>
            </button>
            <button
              onClick={() => navigate('/sets')}
              className={`px-6 py-4 text-sm font-medium transition-all duration-200 rounded-xl ${
                currentPage === 'sets'
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg transform scale-105'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 hover:shadow-md'
              }`}
            >
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <span>Sets</span>
              </div>
            </button>
            <button
              onClick={onStartEvaluation}
              disabled={unevaluatedCount === 0}
              className={`px-6 py-4 text-sm font-medium transition-all duration-200 rounded-xl ${
                unevaluatedCount === 0
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : currentPage === 'evaluate'
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg transform scale-105'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 hover:shadow-md'
              }`}
            >
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Evaluate</span>
                {unevaluatedCount > 0 && (
                  <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                    {unevaluatedCount}
                  </span>
                )}
              </div>
            </button>
            <button
              onClick={() => navigate('/study')}
              disabled={evaluatedCount === 0}
              className={`px-6 py-4 text-sm font-medium transition-all duration-200 rounded-xl ${
                evaluatedCount === 0
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : currentPage === 'study'
                  ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg transform scale-105'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 hover:shadow-md'
              }`}
            >
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <span>Study</span>
                {evaluatedCount > 0 && (
                  <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                    {evaluatedCount}
                  </span>
                )}
              </div>
            </button>
            <button
              onClick={() => navigate('/settings')}
              className={`px-6 py-4 text-sm font-medium transition-all duration-200 rounded-xl ${
                currentPage === 'settings'
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg transform scale-105'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 hover:shadow-md'
              }`}
            >
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.89 3.31.877 2.42 2.42a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.89 1.543-.877 3.31-2.42 2.42a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.89-3.31-.877-2.42-2.42a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35.497-.12.902-.426 1.065-2.573-.89-1.543.877-3.31 2.42-2.42.622.358 1.4.153 2.573-1.066z"/>
                </svg>
                <span>Settings</span>
              </div>
            </button>

          </div>

          {/* Right side - Debug and Set Selector */}
          <div className="flex items-center space-x-4">
            {/* Auth Links */}
            <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowSetSelector(!showSetSelector)}
              className="flex items-center space-x-3 px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl hover:from-blue-100 hover:to-indigo-100 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full animate-pulse"></div>
                <span className="font-medium text-gray-700">
                  {activeSet ? activeSet.name : 'Select Set'}
                </span>
                <span className="text-sm text-gray-500">
                  ({activeSet ? activeSet.wordCount : 0})
                </span>
              </div>
              <svg 
                className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${showSetSelector ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Set Selector Dropdown */}
            {showSetSelector && (
              <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Word Sets</h3>
                    <button
                      onClick={() => setShowSetSelector(false)}
                      className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {wordSets.map((set) => (
                      <div
                        key={set.id}
                        className={`p-3 rounded-lg cursor-pointer transition-all duration-200 border-2 ${
                          set.id === activeSetId
                            ? 'border-blue-300 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-md'
                            : 'border-transparent hover:border-gray-200 hover:bg-gray-50'
                        }`}
                        onClick={() => {
                          onSetActive(set.id);
                          setShowSetSelector(false);
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`w-3 h-3 rounded-full ${
                              set.id === activeSetId 
                                ? 'bg-gradient-to-r from-blue-500 to-indigo-500' 
                                : 'bg-gray-300'
                            }`}></div>
                            <div>
                              <div className="font-medium text-gray-800">{set.name}</div>
                              {set.description && (
                                <div className="text-sm text-gray-500">{set.description}</div>
                              )}
                              <div className="text-xs text-gray-400 mt-1">
                                {set.wordCount} words • {new Date(set.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          
                          {set.id === activeSetId && (
                            <div className="flex items-center space-x-1">
                              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              <span className="text-xs text-blue-600 font-medium">Active</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => {
                        navigate('/sets');
                        setShowSetSelector(false);
                      }}
                      className="w-full px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200 hover:border-blue-300 transition-all duration-200 font-medium"
                    >
                      Manage Sets
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        </nav>
      </div>
    </div>
  );
};

export default Navigation;
