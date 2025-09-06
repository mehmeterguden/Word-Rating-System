import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Word, DifficultyLevel } from '../types';
import { displayLevelToScore } from '../utils/studyAlgorithm';
import WordCard from '../components/WordCard';

interface HomeProps {
  words: Word[];
  onUpdateDifficulty: (id: number, difficulty: DifficultyLevel, internalScore?: number) => void;
  onRemoveWord: (id: number) => void;
  onResetEvaluation: () => void;
  onStartEvaluationWithWord?: (word: Word) => void;
}

type FilterType = 'all' | 'pending' | 'evaluated';
type SortOption = 'az' | 'za' | 'difficultyAsc' | 'difficultyDesc';

const Home: React.FC<HomeProps> = ({
  words,
  onUpdateDifficulty,
  onRemoveWord,
  onResetEvaluation,
  onStartEvaluationWithWord
}) => {
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [levelFilters, setLevelFilters] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('az');
  const [isSortOpen, setIsSortOpen] = useState<boolean>(false);
  const [evaluatedFirst, setEvaluatedFirst] = useState<boolean>(false);
  const sortRef = useRef<HTMLDivElement | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10); // User can change this

  // Reset to page 1 when itemsPerPage changes
  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

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

  const filteredWords = useMemo(() => {
    let list = filter === 'all' 
      ? words 
      : filter === 'pending'
      ? words.filter(word => !word.isEvaluated)
      : words.filter(word => word.isEvaluated);

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

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchQuery, levelFilters]);

  const paginatedWords = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredWords.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredWords, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredWords.length / itemsPerPage);

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
  const evaluatedCount = words.filter(word => word.isEvaluated).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Filter Section */}
        <div className="mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl ring-1 ring-slate-200 p-6 relative z-30">
            {/* Your Words Title - Top Section */}
            <div className="mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg ring-4 ring-blue-100">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-4xl font-bold bg-gradient-to-r from-slate-800 via-blue-800 to-indigo-800 bg-clip-text text-transparent tracking-tight">
                    Your Words
                  </h2>
                  <p className="text-slate-500 text-sm mt-1">Manage and organize your word collection</p>
                </div>
              </div>
            </div>

            {/* Filters - Bottom Section in Single Row */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4 flex-wrap">
                {/* All/Pending/Evaluated toggle */}
                <div className="flex bg-gradient-to-r from-white to-blue-50/50 rounded-xl p-1.5 ring-1 ring-blue-200/60 shadow-lg backdrop-blur-sm">
                  <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                      filter === 'all'
                        ? 'bg-blue-500 text-white shadow-md transform scale-105'
                        : 'text-slate-600 hover:text-slate-800 hover:bg-white/60'
                    }`}
                  >
                    <span>All</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      filter === 'all' 
                        ? 'bg-blue-400 text-blue-50' 
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {words.length}
                    </span>
                  </button>
                  
                  <button
                    onClick={() => setFilter('pending')}
                    className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                      filter === 'pending'
                        ? 'bg-amber-500 text-white shadow-md transform scale-105'
                        : 'text-slate-600 hover:text-slate-800 hover:bg-white/60'
                    }`}
                  >
                    <span>Pending</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      filter === 'pending' 
                        ? 'bg-amber-400 text-amber-50' 
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {pendingCount}
                    </span>
                  </button>
                  
                  <button
                    onClick={() => setFilter('evaluated')}
                    className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                      filter === 'evaluated'
                        ? 'bg-emerald-500 text-white shadow-md transform scale-105'
                        : 'text-slate-600 hover:text-slate-800 hover:bg-white/60'
                    }`}
                  >
                    <span>Evaluated</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      filter === 'evaluated' 
                        ? 'bg-emerald-400 text-emerald-50' 
                        : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {evaluatedCount}
                    </span>
                  </button>
                </div>

                {/* Search */}
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-100/60 to-blue-100/60 rounded-xl blur-sm"></div>
                  <div className="relative bg-white/90 rounded-xl ring-1 ring-slate-200/60 shadow-lg backdrop-blur-sm">
                    <input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search words..."
                      className="pl-10 pr-10 py-2.5 rounded-xl border-0 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-300 text-slate-700 placeholder:text-slate-400 min-w-[200px]"
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
                </div>

                {/* Level filters */}
                <div className="bg-gradient-to-r from-white to-blue-50/50 rounded-xl p-2 ring-1 ring-blue-200/60 shadow-lg backdrop-blur-sm">
                  <div className="flex items-center">
                    {[1,2,3,4,5].map((lvl, index) => {
                      const active = levelFilters.includes(lvl);
                      return (
                        <div key={lvl} className="flex items-center">
                          <button
                            onClick={() => setLevelFilters((prev) => active ? prev.filter(v => v !== lvl) : [...prev, lvl])}
                            className={`w-9 h-9 rounded-lg text-sm font-bold transition-all duration-200 ${getLevelChipClasses(lvl, active)} ${active ? 'transform scale-110 shadow-md' : 'hover:scale-105'}`}
                            title={`Level ${lvl}`}
                          >
                            {lvl}
                          </button>
                          {index < 4 && (
                            <div className="w-px h-6 bg-blue-200/60 mx-2"></div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Sort dropdown */}
                <div className="relative" ref={sortRef}>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-100/60 to-indigo-100/60 rounded-xl blur-sm"></div>
                  <button
                    onClick={() => setIsSortOpen((v) => !v)}
                    className="relative bg-white/90 pl-4 pr-10 py-2.5 rounded-xl ring-1 ring-blue-200/60 text-slate-700 shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-300 flex items-center gap-2 backdrop-blur-sm min-w-[140px]"
                  >
                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2H3V4zm0 6h10v2H3v-2zm0 6h6v2H3v-2z" />
                    </svg>
                    <span className="font-medium">{sortLabel}</span>
                    <svg className="w-4 h-4 text-blue-400 absolute right-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <div className="text-center py-20">
            <div className="relative bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30 backdrop-blur-sm rounded-3xl p-16 shadow-2xl border border-white/30 max-w-lg mx-auto overflow-hidden">
              {/* Background decorations */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100/40 to-indigo-100/40 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-indigo-100/40 to-blue-100/40 rounded-full translate-y-12 -translate-x-12"></div>
              
              <div className="relative z-10">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-xl ring-4 ring-blue-100">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                
                <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-blue-800 bg-clip-text text-transparent mb-4">No Words Yet</h2>
                <p className="text-slate-600 mb-8 text-lg leading-relaxed">
                  Start building your vocabulary collection by adding some words
                </p>
                
                <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 p-6 rounded-2xl border border-blue-200/50 backdrop-blur-sm">
                  <div className="flex items-center justify-center space-x-3 mb-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="text-blue-700 font-semibold text-lg">Getting Started</span>
                  </div>
                  <p className="text-blue-600 font-medium">
                    Navigate to "Add Words" to begin your learning journey!
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : filteredWords.length === 0 ? (
          <div className="text-center py-20">
            <div className="relative bg-gradient-to-br from-white via-emerald-50/30 to-green-50/30 backdrop-blur-sm rounded-3xl p-16 shadow-2xl border border-white/30 max-w-lg mx-auto overflow-hidden">
              {/* Background decorations */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-100/40 to-green-100/40 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-green-100/40 to-emerald-100/40 rounded-full translate-y-12 -translate-x-12"></div>
              
              <div className="relative z-10">
                {filter === 'pending' ? (
                  <>
                    <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-green-500 rounded-xl flex items-center justify-center mx-auto mb-6 shadow-lg ring-4 ring-emerald-100">
                      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-800 to-green-800 bg-clip-text text-transparent mb-3">Perfect Work!</h2>
                    <p className="text-slate-600 mb-6">
                      All words have been evaluated successfully
                    </p>
                    
                    <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-4 rounded-xl border border-emerald-200/50 mb-6">
                      <p className="text-emerald-700 font-medium text-sm">
                        ✨ Congratulations on completing your evaluation!
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center mx-auto mb-6 shadow-lg ring-4 ring-blue-100">
                      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-blue-800 bg-clip-text text-transparent mb-3">No Words Found</h2>
                    <p className="text-slate-600 mb-6">
                      No words match your current filters
                    </p>
                    
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200/50 mb-6">
                      <p className="text-blue-700 font-medium text-sm">
                        💡 Try adjusting your search or filter settings
                      </p>
                    </div>
                  </>
                )}
                
                <button
                  onClick={() => setFilter('all')}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                >
                  View All Words
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 overflow-hidden relative z-10">
                          <div className="p-8">
                <div className="space-y-6">
                  {paginatedWords.map((word) => (
                    <WordCard
                      key={word.id}
                      word={word}
                      onUpdateDifficulty={onUpdateDifficulty}
                      onRemoveWord={onRemoveWord}
                      onResetEvaluation={(id) => onUpdateDifficulty(id, 0)}
                      onStartEvaluationWithWord={onStartEvaluationWithWord}
                      fallbackLearningLanguageName={word.language1Name}
                      fallbackKnownLanguageName={word.language2Name}
                    />
                  ))}
                </div>
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="border-t border-slate-200/60 px-8 py-6 bg-gradient-to-r from-slate-50/50 to-blue-50/30">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      {/* Pagination Info */}
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"></div>
                          <span className="text-sm font-medium text-slate-700">
                            Showing <span className="font-bold text-blue-600">{((currentPage - 1) * itemsPerPage) + 1}</span> to <span className="font-bold text-blue-600">{Math.min(currentPage * itemsPerPage, filteredWords.length)}</span> of <span className="font-bold text-slate-800">{filteredWords.length}</span> words
                          </span>
                        </div>
                        <div className="hidden sm:block w-px h-4 bg-slate-300"></div>
                        <div className="text-xs text-slate-500">
                          Page {currentPage} of {totalPages}
                        </div>
                      </div>

                      {/* Pagination Controls */}
                      <div className="flex items-center gap-1">
                        {/* Previous Button */}
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          className="flex items-center space-x-1 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95 bg-white/80 hover:bg-white text-slate-700 hover:text-blue-700 shadow-md hover:shadow-lg border border-slate-200 hover:border-blue-300"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                          <span className="hidden sm:inline">Previous</span>
                        </button>

                        {/* Page Numbers */}
                        <div className="flex items-center gap-1 mx-2">
                          {(() => {
                            const pages = [];
                            const maxVisiblePages = 5;
                            let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
                            let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
                            
                            // Adjust start page if we're near the end
                            if (endPage - startPage + 1 < maxVisiblePages) {
                              startPage = Math.max(1, endPage - maxVisiblePages + 1);
                            }

                            // First page and ellipsis
                            if (startPage > 1) {
                              pages.push(
                                <button
                                  key={1}
                                  onClick={() => setCurrentPage(1)}
                                  className="px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95 bg-white/80 hover:bg-white text-slate-700 hover:text-blue-700 shadow-md hover:shadow-lg border border-slate-200 hover:border-blue-300"
                                >
                                  1
                                </button>
                              );
                              if (startPage > 2) {
                                pages.push(
                                  <span key="ellipsis1" className="px-2 text-slate-400 font-medium">
                                    ...
                                  </span>
                                );
                              }
                            }

                            // Page numbers
                            for (let i = startPage; i <= endPage; i++) {
                              pages.push(
                                <button
                                  key={i}
                                  onClick={() => setCurrentPage(i)}
                                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95 ${
                                    currentPage === i
                                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg scale-105 ring-2 ring-blue-200'
                                      : 'bg-white/80 hover:bg-white text-slate-700 hover:text-blue-700 shadow-md hover:shadow-lg border border-slate-200 hover:border-blue-300'
                                  }`}
                                >
                                  {i}
                                </button>
                              );
                            }

                            // Last page and ellipsis
                            if (endPage < totalPages) {
                              if (endPage < totalPages - 1) {
                                pages.push(
                                  <span key="ellipsis2" className="px-2 text-slate-400 font-medium">
                                    ...
                                  </span>
                                );
                              }
                              pages.push(
                                <button
                                  key={totalPages}
                                  onClick={() => setCurrentPage(totalPages)}
                                  className="px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95 bg-white/80 hover:bg-white text-slate-700 hover:text-blue-700 shadow-md hover:shadow-lg border border-slate-200 hover:border-blue-300"
                                >
                                  {totalPages}
                                </button>
                              );
                            }

                            return pages;
                          })()}
                        </div>

                        {/* Next Button */}
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                          className="flex items-center space-x-1 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95 bg-white/80 hover:bg-white text-slate-700 hover:text-blue-700 shadow-md hover:shadow-lg border border-slate-200 hover:border-blue-300"
                        >
                          <span className="hidden sm:inline">Next</span>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Words per page selector - Bottom */}
                <div className="mt-6 pt-6 border-t border-slate-200/60">
                  <div className="flex items-center justify-center space-x-4">
                    <div className="flex items-center space-x-3 bg-white/60 backdrop-blur-sm rounded-2xl px-6 py-3 shadow-lg border border-slate-200/50">
                      <div className="flex items-center space-x-2">
                        <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                        </svg>
                        <span className="text-sm font-semibold text-slate-700">Words per page:</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {[10, 25, 50, 100, 250, 500, 1000].map((count) => (
                          <button
                            key={count}
                            onClick={() => setItemsPerPage(count)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                              itemsPerPage === count
                                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg scale-105'
                                : 'bg-white/80 text-slate-600 hover:bg-white hover:text-blue-600 hover:scale-105 shadow-md hover:shadow-lg border border-slate-200'
                            }`}
                          >
                            {count}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
