import React, { useState } from 'react';
import { QuizModeSelectorProps, QuizConfiguration, QuizMode } from '../../types/QuizTypes';

const QuizModeSelector: React.FC<QuizModeSelectorProps> = ({
  words,
  onModeSelect,
  onBack
}) => {
  const [selectedMode, setSelectedMode] = useState<QuizMode | null>(null);
  const [selectedDifficulties, setSelectedDifficulties] = useState<Set<number>>(new Set([1, 2, 3, 4, 5]));
  const [timePerQuestion, setTimePerQuestion] = useState(30);
  const [enableHints, setEnableHints] = useState(true);

  const availableWords = words.filter(word => 
    word.isEvaluated && 
    word.difficulty && 
    word.difficulty > 1
  );

  const timeOptions = [10, 15, 20, 30, 45, 60, 90, 120];

  const difficultyLabels: Record<number, string> = {
    1: 'Very Easy',
    2: 'Easy', 
    3: 'Medium',
    4: 'Hard',
    5: 'Very Hard'
  };

  // Ana sayfadaki level renklerini kullan
  const getLevelChipClasses = (lvl: number, active: boolean) => {
    if (!active) return 'text-slate-600 hover:text-slate-800 hover:bg-white/60 bg-white/30';
    switch (lvl) {
      case 1:
        return 'bg-emerald-500 text-white shadow-lg ring-2 ring-emerald-200';
      case 2:
        return 'bg-indigo-500 text-white shadow-lg ring-2 ring-indigo-200';
      case 3:
        return 'bg-amber-500 text-white shadow-lg ring-2 ring-amber-200';
      case 4:
        return 'bg-orange-500 text-white shadow-lg ring-2 ring-orange-200';
      case 5:
        return 'bg-rose-500 text-white shadow-lg ring-2 ring-rose-200';
      default:
        return 'bg-blue-500 text-white shadow-lg ring-2 ring-blue-200';
    }
  };

  const handleModeSelect = (mode: QuizMode) => {
    setSelectedMode(mode);
  };

  const handleDifficultyToggle = (level: number) => {
    setSelectedDifficulties(prev => {
      const newSet = new Set(prev);
      if (newSet.has(level)) {
        newSet.delete(level);
      } else {
        newSet.add(level);
      }
      return newSet;
    });
  };

  const handleSelectAllDifficulties = () => {
    setSelectedDifficulties(new Set([1, 2, 3, 4, 5]));
  };

  const handleStartQuiz = () => {
    if (!selectedMode || selectedDifficulties.size === 0) return;

    const configuration: QuizConfiguration = {
      mode: selectedMode,
      difficulty: Array.from(selectedDifficulties)[0], // Use first selected difficulty as primary
      timeLimit: selectedMode === 'speed' ? timePerQuestion : undefined,
      wordCount: availableWords.length,
      enableHints,
      sourceLanguageName: 'English',
      targetLanguageName: 'Turkish',
      explanationLanguageName: 'Turkish'
    };

    onModeSelect(configuration);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-40 left-1/2 w-80 h-80 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <button
            onClick={onBack}
            className="mb-4 px-4 py-2 text-slate-600 hover:text-slate-800 font-medium rounded-xl hover:bg-white/60 transition-all duration-200 flex items-center space-x-2 mx-auto"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to Study</span>
          </button>
          
          <h1 className="text-4xl font-bold text-slate-800 mb-4">Choose Your Quiz</h1>
          <p className="text-slate-500">Select your preferred quiz style and difficulty</p>
        </div>

        {/* Quiz Mode Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Classic Mode */}
          <div 
            className={`group relative bg-white rounded-2xl shadow-lg border-2 transition-all duration-300 cursor-pointer ${
              selectedMode === 'classic' 
                ? 'border-blue-500 shadow-xl scale-105' 
                : 'border-slate-200 hover:border-blue-300 hover:shadow-xl'
            }`}
            onClick={() => handleModeSelect('classic')}
          >
            <div className="p-8">
              {/* Icon */}
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:rotate-12 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>

              <h3 className="text-2xl font-bold text-slate-800 mb-4 text-center group-hover:text-blue-600 transition-colors duration-300">
                Classic Quiz
              </h3>
              <p className="text-slate-600 text-center text-lg leading-relaxed">
                Take your time to think and learn. Perfect for understanding and memorizing new words.
              </p>

              {/* Selection indicator */}
              {selectedMode === 'classic' && (
                <div className="absolute top-4 right-4 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* Speed Mode */}
          <div 
            className={`group relative bg-white rounded-2xl shadow-lg border-2 transition-all duration-300 cursor-pointer ${
              selectedMode === 'speed' 
                ? 'border-orange-500 shadow-xl scale-105' 
                : 'border-slate-200 hover:border-orange-300 hover:shadow-xl'
            }`}
            onClick={() => handleModeSelect('speed')}
          >
            <div className="p-8">
              {/* Icon */}
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:rotate-12 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>

              <h3 className="text-2xl font-bold text-slate-800 mb-4 text-center group-hover:text-orange-600 transition-colors duration-300">
                Speed Quiz
              </h3>
              <p className="text-slate-600 text-center text-lg leading-relaxed">
                Test your reflexes and quick thinking. Challenge yourself with time pressure!
              </p>

              {/* Selection indicator */}
              {selectedMode === 'speed' && (
                <div className="absolute top-4 right-4 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Configuration Panel */}
        {selectedMode && (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 mb-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">
              Configure Your {selectedMode === 'classic' ? 'Classic' : 'Speed'} Quiz
            </h2>
            
            {/* Difficulty Selection - Classic mode için ortada */}
            {selectedMode === 'classic' ? (
              <div className="max-w-2xl mx-auto">
                <h3 className="text-2xl font-bold text-slate-800 mb-6 text-center flex items-center justify-center space-x-3">
                  <span className="text-3xl">🎯</span>
                  <span>Difficulty Levels</span>
                </h3>
                
                {/* Tüm Leveller Butonu - Çok belirgin seçili durum */}
                <div className="mb-6 flex justify-center">
                  <button
                    onClick={handleSelectAllDifficulties}
                    className={`px-8 py-4 rounded-2xl font-bold text-xl transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                      selectedDifficulties.size === 5
                        ? 'bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 text-white shadow-2xl ring-4 ring-emerald-200 scale-105'
                        : 'bg-gradient-to-r from-slate-400 to-slate-500 text-white hover:from-slate-500 hover:to-slate-600 shadow-lg hover:shadow-xl'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <span>All Levels Selected</span>
                    </div>
                  </button>
                </div>
                
                {/* Ana sayfadaki gibi level butonları - Büyük ve ortada */}
                <div className="relative group h-16 flex-shrink-0 max-w-lg mx-auto">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-100/60 to-indigo-100/60 rounded-xl blur-sm group-hover:blur-md transition-all duration-300"></div>
                  <div className="relative bg-white/95 rounded-xl ring-1 ring-blue-200/60 shadow-lg backdrop-blur-sm group-hover:shadow-xl group-hover:ring-blue-300/60 transition-all duration-300 h-full flex items-center justify-center p-3">
                    <div className="flex items-center gap-1">
                      {[1,2,3,4,5].map((lvl, index) => {
                        const active = selectedDifficulties.has(lvl);
                        return (
                          <div key={lvl} className="flex items-center">
                            <button
                              onClick={() => handleDifficultyToggle(lvl)}
                              className={`w-10 h-10 rounded-lg text-sm font-bold transition-all duration-300 ${getLevelChipClasses(lvl, active)} ${active ? 'transform scale-110 shadow-lg ring-2 ring-white/50' : 'hover:scale-105 hover:shadow-md'}`}
                              title={`Level ${lvl}`}
                            >
                              {lvl}
                            </button>
                            {index < 4 && (
                              <div className="w-px h-8 bg-blue-200/60 mx-2"></div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <p className="text-lg text-slate-600 mt-4 text-center font-medium">
                  {selectedDifficulties.size === 0 
                    ? 'Select at least one difficulty level' 
                    : `${selectedDifficulties.size} level${selectedDifficulties.size !== 1 ? 's' : ''} selected`
                  }
                </p>
              </div>
            ) : (
              /* Speed Mode için 2 sütunlu layout */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Difficulty Selection */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-700 mb-4 flex items-center space-x-2">
                    <span>🎯</span>
                    <span>Difficulty Levels</span>
                  </h3>
                  
                  {/* Tüm Leveller Butonu - Çok belirgin seçili durum */}
                  <div className="mb-4 flex justify-center">
                    <button
                      onClick={handleSelectAllDifficulties}
                      className={`px-6 py-3 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                        selectedDifficulties.size === 5
                          ? 'bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 text-white shadow-2xl ring-4 ring-emerald-200 scale-105'
                          : 'bg-gradient-to-r from-slate-400 to-slate-500 text-white hover:from-slate-500 hover:to-slate-600 shadow-lg hover:shadow-xl'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <span>All Levels</span>
                      </div>
                    </button>
                  </div>
                  
                  {/* Ana sayfadaki gibi level butonları - Büyük ve ortada */}
                  <div className="relative group h-16 flex-shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-100/60 to-indigo-100/60 rounded-xl blur-sm group-hover:blur-md transition-all duration-300"></div>
                    <div className="relative bg-white/95 rounded-xl ring-1 ring-blue-200/60 shadow-lg backdrop-blur-sm group-hover:shadow-xl group-hover:ring-blue-300/60 transition-all duration-300 h-full flex items-center justify-center p-3">
                      <div className="flex items-center gap-1">
                        {[1,2,3,4,5].map((lvl, index) => {
                          const active = selectedDifficulties.has(lvl);
                          return (
                            <div key={lvl} className="flex items-center">
                              <button
                                onClick={() => handleDifficultyToggle(lvl)}
                                className={`w-10 h-10 rounded-lg text-sm font-bold transition-all duration-300 ${getLevelChipClasses(lvl, active)} ${active ? 'transform scale-110 shadow-lg ring-2 ring-white/50' : 'hover:scale-105 hover:shadow-md'}`}
                                title={`Level ${lvl}`}
                              >
                                {lvl}
                              </button>
                              {index < 4 && (
                                <div className="w-px h-8 bg-blue-200/60 mx-2"></div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 mt-3 text-center">
                    {selectedDifficulties.size === 0 
                      ? 'Select at least one difficulty level' 
                      : `${selectedDifficulties.size} level${selectedDifficulties.size !== 1 ? 's' : ''} selected`
                    }
                  </p>
                </div>

                {/* Speed Mode Settings */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-700 mb-4 flex items-center space-x-2">
                    <span>⏱️</span>
                    <span>Time Per Question</span>
                  </h3>
                  <div className="grid grid-cols-4 gap-2">
                    {timeOptions.map((time) => (
                      <button
                        key={time}
                        onClick={() => setTimePerQuestion(time)}
                        className={`px-3 py-2 rounded-lg font-medium transition-all duration-200 ${
                          timePerQuestion === time
                            ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {time}s
                      </button>
                    ))}
                  </div>
                  <p className="text-sm text-slate-500 mt-3 text-center">
                    You'll have <span className="font-bold text-orange-600">{timePerQuestion} seconds</span> per question
                  </p>
                </div>
              </div>
            )}

            {/* AI Hints Toggle - Basitleştirildi */}
            <div className="mt-8 pt-6 border-t border-slate-200">
              <div className="flex items-center justify-center">
                <button
                  onClick={() => setEnableHints(!enableHints)}
                  className={`flex items-center space-x-3 px-6 py-3 rounded-xl transition-all duration-300 ${
                    enableHints
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg'
                      : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                  }`}
                >
                  <div className="text-2xl">💡</div>
                  <span className="font-semibold">AI Hints {enableHints ? 'Enabled' : 'Disabled'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Start Button */}
        {selectedMode && (
          <div className="text-center">
            <button
              onClick={handleStartQuiz}
              disabled={selectedDifficulties.size === 0}
              className={`px-12 py-4 rounded-2xl font-bold text-xl transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center space-x-3 mx-auto ${
                selectedDifficulties.size === 0
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white hover:shadow-xl hover:shadow-blue-500/25'
              }`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Start {selectedMode === 'classic' ? 'Classic' : 'Speed'} Quiz</span>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizModeSelector;