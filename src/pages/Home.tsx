import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Word, DifficultyLevel } from '../types';
import WordCard from '../components/WordCard';

interface HomeProps {
  words: Word[];
  onUpdateDifficulty: (id: number, difficulty: DifficultyLevel) => void;
  onRemoveWord: (id: number) => void;
  onResetEvaluation: () => void;
}

type FilterType = 'all' | 'pending';
type SortOption = 'az' | 'za' | 'difficultyAsc' | 'difficultyDesc';

const Home: React.FC<HomeProps> = ({
  words,
  onUpdateDifficulty,
  onRemoveWord,
  onResetEvaluation
}) => {
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [levelFilters, setLevelFilters] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('az');
  const [isSortOpen, setIsSortOpen] = useState<boolean>(false);
  const [evaluatedFirst, setEvaluatedFirst] = useState<boolean>(false);
  const sortRef = useRef<HTMLDivElement | null>(null);

  const sortLabel = useMemo(() => {
    switch (sortBy) {
      case 'az':
        return 'A → Z';
      case 'za':
        return 'Z → A';
      case 'difficultyAsc':
        return 'Difficulty ↑';
      case 'difficultyDesc':
        return 'Difficulty ↓';
      default:
        return 'Sort';
    }
  }, [sortBy]);

  const getLevelChipClasses = (lvl: number, active: boolean) => {
    if (!active) return 'text-slate-600 hover:text-slate-800 hover:bg-white';
    switch (lvl) {
      case 1:
        return 'bg-white text-emerald-700 shadow ring-1 ring-emerald-200';
      case 2:
        return 'bg-white text-indigo-700 shadow ring-1 ring-indigo-200';
      case 3:
        return 'bg-white text-amber-700 shadow ring-1 ring-amber-200';
      case 4:
        return 'bg-white text-orange-700 shadow ring-1 ring-orange-200';
      case 5:
        return 'bg-white text-rose-700 shadow ring-1 ring-rose-200';
      default:
        return 'bg-white text-blue-700 shadow ring-1 ring-blue-200';
    }
  };

  const filteredWords = useMemo(() => {
    let list = filter === 'all' 
      ? words 
      : words.filter(word => !word.isEvaluated);

    // Search filter
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      list = list.filter((w) =>
        w.text1.toLowerCase().includes(q) || (w.text2 ? w.text2.toLowerCase().includes(q) : false)
      );
    }

    // Level filter (multi-select). If none selected, keep all
    if (levelFilters.length > 0) {
      list = list.filter((w) => levelFilters.includes(w.difficulty));
    }

    // Sorting (optionally prioritize evaluated)
    list = [...list].sort((a, b) => {
      if (evaluatedFirst) {
        if (a.isEvaluated !== b.isEvaluated) {
          return a.isEvaluated ? -1 : 1; // evaluated first
        }
      }
      switch (sortBy) {
        case 'az':
          return a.text1.localeCompare(b.text1);
        case 'za':
          return b.text1.localeCompare(a.text1);
        case 'difficultyAsc':
          return (a.difficulty || 0) - (b.difficulty || 0);
        case 'difficultyDesc':
          return (b.difficulty || 0) - (a.difficulty || 0);
        default:
          return 0;
      }
    });

    return list;
  }, [words, filter, searchQuery, levelFilters, sortBy, evaluatedFirst]);

  // Close sort on outside click / Esc
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!isSortOpen) return;
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setIsSortOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsSortOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [isSortOpen]);

  const pendingCount = words.filter(word => !word.isEvaluated).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Filter Section */}
        <div className="mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl ring-1 ring-slate-200 p-6 relative z-30">
            <div className="flex items-center justify-between gap-6 flex-wrap">
              <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Your Words</h2>
              
              <div className="flex items-center flex-wrap gap-4">
                {/* All/Pending toggle */}
                <div className="flex bg-slate-100/70 rounded-full p-1 ring-1 ring-slate-200 shadow-sm">
                  <button
                    onClick={() => setFilter('all')}
                    className={`px-5 py-2 rounded-full font-medium transition-all duration-200 ${
                      filter === 'all'
                        ? 'bg-white text-blue-700 shadow ring-1 ring-blue-200'
                        : 'text-slate-600 hover:text-slate-800'
                    }`}
                  >
                    All ({words.length})
                  </button>
                  <button
                    onClick={() => setFilter('pending')}
                    className={`px-5 py-2 rounded-full font-medium transition-all duration-200 ${
                      filter === 'pending'
                        ? 'bg-white text-amber-700 shadow ring-1 ring-amber-200'
                        : 'text-slate-600 hover:text-slate-800'
                    }`}
                  >
                    Pending ({pendingCount})
                  </button>
                </div>

                {/* Search */}
                <div className="relative">
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search in set..."
                    className="pl-10 pr-4 py-2 rounded-full border border-slate-200 bg-white/80 shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-100 text-slate-700 placeholder:text-slate-400"
                  />
                  <svg className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z" />
                  </svg>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                      aria-label="Clear search"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Level filters */}
                <div className="flex items-center bg-slate-100/70 rounded-full p-1 ring-1 ring-slate-200 shadow-sm">
                  {[1,2,3,4,5].map((lvl) => {
                    const active = levelFilters.includes(lvl);
                    return (
                      <button
                        key={lvl}
                        onClick={() => setLevelFilters((prev) => active ? prev.filter(v => v !== lvl) : [...prev, lvl])}
                        className={`mx-1 px-3 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${getLevelChipClasses(lvl, active)}`}
                        title={`Level ${lvl}`}
                      >
                        {lvl}
                      </button>
                    );
                  })}
                </div>

                {/* Sort (custom dropdown) */}
                <div className="relative" ref={sortRef}>
                  <button
                    onClick={() => setIsSortOpen((v) => !v)}
                    className="pl-4 pr-10 py-2 rounded-full border border-slate-200 bg-white/80 text-slate-700 shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-100 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2H3V4zm0 6h10v2H3v-2zm0 6h6v2H3v-2z" />
                    </svg>
                    {sortLabel}
                    <svg className="w-4 h-4 text-slate-400 absolute right-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {isSortOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-2xl ring-1 ring-slate-200 overflow-hidden z-50 origin-top-right transform transition ease-out duration-150 scale-100 opacity-100">
                      <div className="px-4 py-3 border-b border-slate-100 text-xs font-semibold tracking-wide text-slate-500">
                        Sort by
                      </div>
                      {[
                        { key: 'az', label: 'A → Z' },
                        { key: 'za', label: 'Z → A' },
                        { key: 'difficultyAsc', label: 'Difficulty ↑' },
                        { key: 'difficultyDesc', label: 'Difficulty ↓' }
                      ].map((opt) => (
                        <button
                          key={opt.key}
                          onClick={() => { setSortBy(opt.key as SortOption); setIsSortOpen(false); }}
                          className={`w-full text-left px-4 py-2 text-sm transition-colors flex items-center gap-2 ${
                            sortBy === opt.key ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          {sortBy === opt.key ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <span className="w-4 h-4" />
                          )}
                          <span>{opt.label}</span>
                        </button>
                      ))}
                      <div className="border-t border-slate-100" />
                      <label className="flex items-center justify-between px-4 py-2 text-sm text-slate-700 cursor-pointer hover:bg-slate-50">
                        <span>Evaluated first</span>
                        <input
                          type="checkbox"
                          checked={evaluatedFirst}
                          onChange={(e) => setEvaluatedFirst(e.target.checked)}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-200"
                        />
                      </label>
                    </div>
                  )}
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
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 overflow-hidden relative z-10">
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
