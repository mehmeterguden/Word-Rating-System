import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Word } from '../types';

interface EvaluationOptionsProps {
  words: Word[];
  onStartEvaluation: (selectedWords: Word[]) => void;
  isEvaluationActive?: boolean;
}

const EvaluationOptions: React.FC<EvaluationOptionsProps> = ({
  words,
  onStartEvaluation,
  isEvaluationActive = false
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [evaluationMode, setEvaluationMode] = useState<'sequential' | 'random' | 'custom'>('sequential');
  const [customCount, setCustomCount] = useState<number>(10);
  const [selectedWordId, setSelectedWordId] = useState<number | null>(null);

  const unevaluatedWords = words.filter(word => !word.isEvaluated);
  const totalUnevaluated = unevaluatedWords.length;

  // Check for wordId in URL parameters
  useEffect(() => {
    const wordId = searchParams.get('wordId');
    if (wordId) {
      const id = parseInt(wordId, 10);
      setSelectedWordId(id);
      console.log('🔍 EvaluationOptions: Looking for word with ID:', id);
      console.log('🔍 EvaluationOptions: Available words:', words.map(w => ({ id: w.id, text1: w.text1, isEvaluated: w.isEvaluated })));
      
      // Find the word and start evaluation immediately
      const word = words.find(w => w.id === id);
      if (word) {
        console.log('✅ EvaluationOptions: Word found:', word);
        // Start evaluation regardless of evaluation status
        onStartEvaluation([word]);
        // Clear the URL parameter but don't redirect - let the modal handle the UI
        setSearchParams({});
      } else {
        // Word not found, redirect to home
        console.warn('❌ EvaluationOptions: Word not found with ID:', id);
        setSearchParams({});
        navigate('/');
      }
    }
  }, [searchParams, words, onStartEvaluation, setSearchParams, navigate]);

  const handleStartEvaluation = () => {
    let selectedWords: Word[] = [];

    switch (evaluationMode) {
      case 'sequential':
        selectedWords = unevaluatedWords;
        break;
      case 'random':
        selectedWords = [...unevaluatedWords].sort(() => Math.random() - 0.5);
        break;
      case 'custom':
        const shuffled = [...unevaluatedWords].sort(() => Math.random() - 0.5);
        selectedWords = shuffled.slice(0, Math.min(customCount, totalUnevaluated));
        break;
    }

    onStartEvaluation(selectedWords);
  };

  // If evaluation is active, don't show the options page
  if (isEvaluationActive) {
    return null;
  }

  if (totalUnevaluated === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 flex items-center justify-center p-4">
        <div className="relative bg-gradient-to-br from-white via-blue-50/50 to-indigo-50/50 backdrop-blur-xl rounded-2xl shadow-xl border border-blue-200/50 p-8 text-center max-w-md mx-auto overflow-hidden">
          {/* Background Decorations */}
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-100/40 to-indigo-100/40 rounded-full -translate-y-10 translate-x-10"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-indigo-100/40 to-blue-100/40 rounded-full translate-y-8 -translate-x-8"></div>
          
          <div className="relative z-10">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg ring-2 ring-blue-100">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-800 to-indigo-800 bg-clip-text text-transparent mb-3">
              All Words Evaluated!
            </h1>
            <p className="text-slate-600 mb-6 leading-relaxed">
              Congratulations! You have successfully evaluated all the words in your list. Ready to start studying?
            </p>
            
            <div className="space-y-3">
              <button
                onClick={() => window.location.href = '/study'}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 active:scale-95"
              >
                Start Study Session
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="w-full text-blue-600 hover:text-blue-800 font-medium py-2 px-4 rounded-xl hover:bg-blue-50 transition-all duration-200"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Compact Header Section */}
        <div className="relative bg-gradient-to-br from-white via-blue-50/50 to-indigo-50/50 backdrop-blur-xl rounded-2xl shadow-xl border border-blue-200/50 p-6 mb-6 overflow-hidden">
          {/* Background Decorations */}
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-100/40 to-indigo-100/40 rounded-full -translate-y-10 translate-x-10"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-indigo-100/40 to-blue-100/40 rounded-full translate-y-8 -translate-x-8"></div>
          
          <div className="relative z-10 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg ring-2 ring-blue-100">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-800 to-indigo-800 bg-clip-text text-transparent mb-2">
              Evaluation Mode
            </h1>
            <p className="text-slate-600 text-lg mb-4">
              Choose how you want to evaluate your words
            </p>
            
            {/* Compact Statistics */}
            <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto">
              <div className="bg-white/70 rounded-lg p-3 backdrop-blur-sm border border-blue-200/50 text-center">
                <div className="text-xl font-bold text-blue-600 mb-1">{totalUnevaluated}</div>
                <div className="text-xs text-slate-600">To Evaluate</div>
              </div>
              <div className="bg-white/70 rounded-lg p-3 backdrop-blur-sm border border-blue-200/50 text-center">
                <div className="text-xl font-bold text-indigo-600 mb-1">{words.length - totalUnevaluated}</div>
                <div className="text-xs text-slate-600">Completed</div>
              </div>
              <div className="bg-white/70 rounded-lg p-3 backdrop-blur-sm border border-blue-200/50 text-center">
                <div className="text-xl font-bold text-blue-700 mb-1">
                  {Math.round(((words.length - totalUnevaluated) / words.length) * 100)}%
                </div>
                <div className="text-xs text-slate-600">Progress</div>
              </div>
            </div>
          </div>
        </div>

        {/* Evaluation Mode Selection */}
        <div className="relative bg-gradient-to-br from-white via-blue-50/50 to-indigo-50/50 backdrop-blur-xl rounded-2xl shadow-xl border border-blue-200/50 p-6 mb-6 overflow-hidden">
          {/* Background Decorations */}
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-blue-100/40 to-indigo-100/40 rounded-full -translate-y-8 translate-x-8"></div>
          <div className="absolute bottom-0 left-0 w-12 h-12 bg-gradient-to-tr from-indigo-100/40 to-blue-100/40 rounded-full translate-y-6 -translate-x-6"></div>
          
          <div className="relative z-10">
            <h3 className="text-xl font-bold bg-gradient-to-r from-blue-800 to-indigo-800 bg-clip-text text-transparent mb-4 text-center">
              Select Evaluation Mode
            </h3>
            
            <div className="space-y-3">
              {/* Sequential Mode */}
              <label className={`relative flex items-center p-4 rounded-xl cursor-pointer transition-all duration-200 hover:scale-[1.01] group ${
                evaluationMode === 'sequential' 
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg ring-2 ring-blue-200' 
                  : 'bg-white/80 hover:bg-white border border-blue-200 hover:border-blue-300 shadow-md hover:shadow-lg'
              }`}>
                <input
                  type="radio"
                  name="evaluationMode"
                  value="sequential"
                  checked={evaluationMode === 'sequential'}
                  onChange={(e) => setEvaluationMode(e.target.value as 'sequential' | 'random' | 'custom')}
                  className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <div className="ml-3 flex-1">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      evaluationMode === 'sequential' ? 'bg-white/20' : 'bg-blue-100'
                    }`}>
                      <svg className={`w-4 h-4 ${evaluationMode === 'sequential' ? 'text-white' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                      </svg>
                    </div>
                    <div>
                      <div className={`font-semibold text-base ${evaluationMode === 'sequential' ? 'text-white' : 'text-slate-800'}`}>
                        Sequential Evaluation
                      </div>
                      <div className={`text-sm ${evaluationMode === 'sequential' ? 'text-white/80' : 'text-slate-600'}`}>
                        Evaluate all {totalUnevaluated} words in order
                      </div>
                    </div>
                  </div>
                </div>
              </label>

              {/* Random Mode */}
              <label className={`relative flex items-center p-4 rounded-xl cursor-pointer transition-all duration-200 hover:scale-[1.01] group ${
                evaluationMode === 'random' 
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg ring-2 ring-blue-200' 
                  : 'bg-white/80 hover:bg-white border border-blue-200 hover:border-blue-300 shadow-md hover:shadow-lg'
              }`}>
                <input
                  type="radio"
                  name="evaluationMode"
                  value="random"
                  checked={evaluationMode === 'random'}
                  onChange={(e) => setEvaluationMode(e.target.value as 'sequential' | 'random' | 'custom')}
                  className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <div className="ml-3 flex-1">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      evaluationMode === 'random' ? 'bg-white/20' : 'bg-blue-100'
                    }`}>
                      <svg className={`w-4 h-4 ${evaluationMode === 'random' ? 'text-white' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    </div>
                    <div>
                      <div className={`font-semibold text-base ${evaluationMode === 'random' ? 'text-white' : 'text-slate-800'}`}>
                        Random Evaluation
                      </div>
                      <div className={`text-sm ${evaluationMode === 'random' ? 'text-white/80' : 'text-slate-600'}`}>
                        Evaluate all {totalUnevaluated} words in random order
                      </div>
                    </div>
                  </div>
                </div>
              </label>

              {/* Custom Count Mode */}
              <label className={`relative flex items-center p-4 rounded-xl cursor-pointer transition-all duration-200 hover:scale-[1.01] group ${
                evaluationMode === 'custom' 
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg ring-2 ring-blue-200' 
                  : 'bg-white/80 hover:bg-white border border-blue-200 hover:border-blue-300 shadow-md hover:shadow-lg'
              }`}>
                <input
                  type="radio"
                  name="evaluationMode"
                  value="custom"
                  checked={evaluationMode === 'custom'}
                  onChange={(e) => setEvaluationMode(e.target.value as 'sequential' | 'random' | 'custom')}
                  className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <div className="ml-3 flex-1">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      evaluationMode === 'custom' ? 'bg-white/20' : 'bg-blue-100'
                    }`}>
                      <svg className={`w-4 h-4 ${evaluationMode === 'custom' ? 'text-white' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                    </div>
                    <div>
                      <div className={`font-semibold text-base ${evaluationMode === 'custom' ? 'text-white' : 'text-slate-800'}`}>
                        Custom Count
                      </div>
                      <div className={`text-sm ${evaluationMode === 'custom' ? 'text-white/80' : 'text-slate-600'}`}>
                        Evaluate a specific number of words randomly
                      </div>
                    </div>
                  </div>
                  {evaluationMode === 'custom' && (
                    <div className="mt-3 flex items-center space-x-2">
                      <input
                        type="number"
                        min="1"
                        max={totalUnevaluated}
                        value={customCount}
                        onChange={(e) => setCustomCount(Math.min(parseInt(e.target.value) || 1, totalUnevaluated))}
                        className="w-20 px-3 py-1 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:border-white/50 focus:ring-1 focus:ring-white/20 font-semibold text-sm"
                        placeholder="10"
                      />
                      <span className="text-white/80 font-medium text-sm">
                        of {totalUnevaluated} words
                      </span>
                    </div>
                  )}
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="relative bg-gradient-to-br from-white via-blue-50/50 to-indigo-50/50 backdrop-blur-xl rounded-2xl shadow-xl border border-blue-200/50 p-6 overflow-hidden">
          {/* Background Decorations */}
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-blue-100/40 to-indigo-100/40 rounded-full -translate-y-8 translate-x-8"></div>
          <div className="absolute bottom-0 left-0 w-12 h-12 bg-gradient-to-tr from-indigo-100/40 to-blue-100/40 rounded-full translate-y-6 -translate-x-6"></div>
          
        <div className="relative z-10">
          <button
            onClick={handleStartEvaluation}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl font-bold hover:scale-105 active:scale-95"
          >
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Start Evaluation</span>
            </div>
          </button>
        </div>
        </div>
      </div>
    </div>
  );
};

export default EvaluationOptions;
