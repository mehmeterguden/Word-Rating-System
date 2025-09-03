import React, { useState } from 'react';
import { Word, DifficultyLevel } from '../types';
import WordCard from '../components/WordCard';

interface HomeProps {
  words: Word[];
  onUpdateDifficulty: (id: number, difficulty: DifficultyLevel) => void;
  onRemoveWord: (id: number) => void;
  onResetEvaluation: () => void;
}

type FilterType = 'all' | 'pending';

const Home: React.FC<HomeProps> = ({
  words,
  onUpdateDifficulty,
  onRemoveWord,
  onResetEvaluation
}) => {
  const [filter, setFilter] = useState<FilterType>('all');

  const filteredWords = filter === 'all' 
    ? words 
    : words.filter(word => !word.isEvaluated);

  const pendingCount = words.filter(word => !word.isEvaluated).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Filter Section */}
        <div className="mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">Your Words</h2>
              
              <div className="flex items-center space-x-4">
                <div className="flex bg-gray-100 rounded-xl p-1">
                  <button
                    onClick={() => setFilter('all')}
                    className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                      filter === 'all'
                        ? 'bg-white text-blue-600 shadow-md'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    All ({words.length})
                  </button>
                  <button
                    onClick={() => setFilter('pending')}
                    className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                      filter === 'pending'
                        ? 'bg-white text-amber-600 shadow-md'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    Pending ({pendingCount})
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Words List */}
        {words.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-12 shadow-2xl border border-white/20 max-w-md mx-auto">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-800 mb-4">No Words Yet</h2>
              <p className="text-gray-600 mb-6">
                Start by adding some words to your collection
              </p>
              
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
                <p className="text-blue-700 font-medium text-sm">
                  💡 Go to "Add Words" to get started!
                </p>
              </div>
            </div>
          </div>
        ) : filteredWords.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-12 shadow-2xl border border-white/20 max-w-md mx-auto">
              <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-800 mb-4">All Done!</h2>
              <p className="text-gray-600 mb-6">
                {filter === 'pending' 
                  ? 'All words have been evaluated!' 
                  : 'No words match your current filter.'}
              </p>
              
              <button
                onClick={() => setFilter('all')}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-200"
              >
                View All Words
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
            <div className="p-8">
              <div className="space-y-6">
                {filteredWords.map((word) => (
                  <WordCard
                    key={word.id}
                    word={word}
                    onUpdateDifficulty={onUpdateDifficulty}
                    onRemoveWord={onRemoveWord}
                    onResetEvaluation={(id) => onUpdateDifficulty(id, 0)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
