import React, { useState } from 'react';
import { Word } from '../types';

interface EvaluationOptionsProps {
  words: Word[];
  onStartEvaluation: (selectedWords: Word[]) => void;
  onClose: () => void;
}

const EvaluationOptions: React.FC<EvaluationOptionsProps> = ({
  words,
  onStartEvaluation,
  onClose
}) => {
  const [evaluationMode, setEvaluationMode] = useState<'sequential' | 'random' | 'custom'>('sequential');
  const [customCount, setCustomCount] = useState<number>(10);

  const unevaluatedWords = words.filter(word => !word.isEvaluated);
  const totalUnevaluated = unevaluatedWords.length;

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

  if (totalUnevaluated === 0) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">All Words Evaluated!</h1>
          <p className="text-gray-600 mb-6">
            Congratulations! You have evaluated all the words in your list.
          </p>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Evaluation Mode</h1>
          <p className="text-gray-600 text-lg">
            Choose how you want to evaluate your words
          </p>
        </div>

        <div className="space-y-6">
          {/* Evaluation Mode Selection */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Select Evaluation Mode</h3>
            
            <div className="space-y-3">
              {/* Sequential Mode */}
              <label className="flex items-center p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-blue-300 transition-colors">
                <input
                  type="radio"
                  name="evaluationMode"
                  value="sequential"
                  checked={evaluationMode === 'sequential'}
                  onChange={(e) => setEvaluationMode(e.target.value as 'sequential' | 'random' | 'custom')}
                  className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <div className="ml-4">
                  <div className="font-medium text-gray-800">Sequential Evaluation</div>
                  <div className="text-sm text-gray-600">
                    Evaluate all {totalUnevaluated} words in order
                  </div>
                </div>
              </label>

              {/* Random Mode */}
              <label className="flex items-center p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-blue-300 transition-colors">
                <input
                  type="radio"
                  name="evaluationMode"
                  value="random"
                  checked={evaluationMode === 'random'}
                  onChange={(e) => setEvaluationMode(e.target.value as 'sequential' | 'random' | 'custom')}
                  className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <div className="ml-4">
                  <div className="font-medium text-gray-800">Random Evaluation</div>
                  <div className="text-sm text-gray-600">
                    Evaluate all {totalUnevaluated} words in random order
                  </div>
                </div>
              </label>

              {/* Custom Count Mode */}
              <label className="flex items-center p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-blue-300 transition-colors">
                <input
                  type="radio"
                  name="evaluationMode"
                  value="custom"
                  checked={evaluationMode === 'custom'}
                  onChange={(e) => setEvaluationMode(e.target.value as 'sequential' | 'random' | 'custom')}
                  className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <div className="ml-4 flex-1">
                  <div className="font-medium text-gray-800">Custom Count</div>
                  <div className="text-sm text-gray-600">
                    Evaluate a specific number of words randomly
                  </div>
                  {evaluationMode === 'custom' && (
                    <div className="mt-3">
                      <input
                        type="number"
                        min="1"
                        max={totalUnevaluated}
                        value={customCount}
                        onChange={(e) => setCustomCount(Math.min(parseInt(e.target.value) || 1, totalUnevaluated))}
                        className="w-20 px-3 py-1 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-600">
                        of {totalUnevaluated} words
                      </span>
                    </div>
                  )}
                </div>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleStartEvaluation}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
            >
              Start Evaluation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EvaluationOptions;
