import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Word, DifficultyLevel } from '../types';
import { displayLevelToScore } from '../utils/studyAlgorithm';
import WordCard from '../components/WordCard';
import ImageModal from '../components/ImageModal';

interface HomeProps {
  words: Word[];
  onUpdateDifficulty: (id: number, difficulty: DifficultyLevel, internalScore?: number) => void;
  onRemoveWord: (id: number) => void;
  onResetEvaluation: () => void;
}

type FilterType = 'all' | 'pending' | 'evaluated';
type SortOption = 'az' | 'za' | 'oldest' | 'newest' | 'difficultyAsc' | 'difficultyDesc';

const Home: React.FC<HomeProps> = ({
  words,
  onUpdateDifficulty,
  onRemoveWord,
  onResetEvaluation
}) => {
  const navigate = useNavigate();
  
  // Handle word click to start evaluation
  const handleWordClick = (word: Word) => {
    // Allow clicking on all words, regardless of evaluation status
    console.log('🏠 Home: Word clicked:', { id: word.id, text1: word.text1, isEvaluated: word.isEvaluated });
    navigate(`/evaluate?wordId=${word.id}`);
  };
  
  // Handle image modal
  const handleImageClick = (wordText: string, languageName?: string) => {
    setCurrentImageWord(wordText);
    setCurrentImageLanguage(languageName || '');
    setShowImageModal(true);
  };
  
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [levelFilters, setLevelFilters] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('az');
  const [isSortOpen, setIsSortOpen] = useState<boolean>(false);
  const [evaluatedFirst, setEvaluatedFirst] = useState<boolean>(false);
  const sortRef = useRef<HTMLDivElement | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10); // User can change this
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  // Word selection states
  const [selectedWords, setSelectedWords] = useState<Set<number>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [bulkDifficulty, setBulkDifficulty] = useState<DifficultyLevel | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  
  // Global image modal states
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentImageWord, setCurrentImageWord] = useState('');
  const [currentImageLanguage, setCurrentImageLanguage] = useState('');

  // Reset to page 1 when itemsPerPage changes
  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

  // Close select dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isSelectOpen) {
        const target = event.target as Element;
        if (!target.closest('.custom-select-container')) {
          setIsSelectOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSelectOpen]);

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlertMessage({ type, message });
    setTimeout(() => {
      setAlertMessage(null);
    }, 4000);
  };

  const handleRemoveWord = (id: number) => {
    const word = words.find(w => w.id === id);
    if (word) {
      onRemoveWord(id);
      showAlert('success', `"${word.text1}" word deleted successfully!`);
    }
  };

  // Word selection functions
  const toggleWordSelection = (wordId: number) => {
    if (!isSelectionMode) return;
    
    setSelectedWords(prev => {
      const newSet = new Set(prev);
      if (newSet.has(wordId)) {
        newSet.delete(wordId);
      } else {
        newSet.add(wordId);
      }
      return newSet;
    });
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedWords(new Set());
    setBulkDifficulty(null);
  };

  const selectAllWords = () => {
    const allWordIds = filteredWords.map(word => word.id);
    setSelectedWords(new Set(allWordIds));
  };

  const clearSelection = () => {
    setSelectedWords(new Set());
  };

  const applyBulkDifficulty = () => {
    if (bulkDifficulty && selectedWords.size > 0) {
      selectedWords.forEach(wordId => {
        onUpdateDifficulty(wordId, bulkDifficulty);
      });
      showAlert('success', `${selectedWords.size} words updated to difficulty level ${bulkDifficulty}!`);
      setSelectedWords(new Set());
      setBulkDifficulty(null);
    }
  };

  const deleteSelectedWords = () => {
    if (selectedWords.size > 0) {
      const selectedWordsList = Array.from(selectedWords);
      selectedWordsList.forEach(wordId => {
        onRemoveWord(wordId);
      });
      showAlert('success', `${selectedWords.size} words deleted successfully!`);
      setSelectedWords(new Set());
      setShowDeleteConfirm(false);
    }
  };

  const handleDeleteClick = () => {
    if (selectedWords.size > 0) {
      setShowDeleteConfirm(true);
    }
  };

  // Difficulty options for custom select
  const difficultyOptions = [
    { 
      value: null, 
      label: 'Not Rated', 
      color: 'gray', 
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    { 
      value: 1, 
      label: 'Very Easy', 
      color: 'emerald', 
      icon: (
        <div className="w-4 h-4 bg-emerald-500 rounded-full"></div>
      )
    },
    { 
      value: 2, 
      label: 'Easy', 
      color: 'indigo', 
      icon: (
        <div className="w-4 h-4 bg-indigo-500 rounded-full"></div>
      )
    },
    { 
      value: 3, 
      label: 'Medium', 
      color: 'amber', 
      icon: (
        <div className="w-4 h-4 bg-amber-500 rounded-full"></div>
      )
    },
    { 
      value: 4, 
      label: 'Hard', 
      color: 'orange', 
      icon: (
        <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
      )
    },
    { 
      value: 5, 
      label: 'Very Hard', 
      color: 'rose', 
      icon: (
        <div className="w-4 h-4 bg-rose-500 rounded-full"></div>
      )
    }
  ];

  const getSelectedOption = () => {
    return difficultyOptions.find(option => option.value === bulkDifficulty) || difficultyOptions[0];
  };

  const sortLabel = useMemo(() => {
    switch (sortBy) {
      case 'az':
        return 'A → Z';
      case 'za':
        return 'Z → A';
      case 'oldest':
        return 'Oldest First';
      case 'newest':
        return 'Newest First';
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
        case 'oldest':
          return a.id - b.id; // ID'ye göre sıralama (en eski önce)
        case 'newest':
          return b.id - a.id; // ID'ye göre sıralama (en yeni önce)
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header Section */}
        <div className="relative bg-gradient-to-br from-white via-blue-50/50 to-indigo-50/50 backdrop-blur-xl rounded-2xl shadow-xl border border-blue-200/50 p-6 mb-6 overflow-hidden">
          {/* Background decorations */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100/40 to-indigo-100/40 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-indigo-100/40 to-blue-100/40 rounded-full translate-y-12 -translate-x-12"></div>
          
          <div className="relative z-10">
            {/* Header Content */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl ring-4 ring-blue-100">
                  <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-800 via-indigo-800 to-blue-900 bg-clip-text text-transparent tracking-tight">
                    Your Words
                  </h1>
                  <p className="text-slate-600 text-lg mt-1">Manage and organize your word collection</p>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center space-x-3">
                {/* Selection Mode Button */}
                <button
                  onClick={toggleSelectionMode}
                  className={`group relative flex items-center space-x-3 px-5 py-3 rounded-xl transition-all duration-300 font-semibold text-sm shadow-sm hover:shadow-md ${
                    isSelectionMode 
                      ? 'bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 border border-emerald-200 hover:from-emerald-100 hover:to-green-100 ring-1 ring-emerald-200/50' 
                      : 'bg-gradient-to-r from-slate-50 to-gray-50 text-slate-600 border border-slate-200 hover:from-slate-100 hover:to-gray-100 hover:text-slate-700 ring-1 ring-slate-200/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded-lg flex items-center justify-center transition-all duration-300 shadow-sm ${
                      isSelectionMode 
                        ? 'bg-gradient-to-br from-emerald-500 to-green-600 text-white group-hover:from-emerald-600 group-hover:to-green-700' 
                        : 'bg-gradient-to-br from-slate-400 to-gray-500 text-white group-hover:from-slate-500 group-hover:to-gray-600'
                    }`}>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="tracking-wide">
                      {isSelectionMode ? 'Exit Selection' : 'Select Words'}
                    </span>
                  </div>
                  {isSelectionMode && (
                    <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse"></div>
                  )}
                </button>

                {/* Add Words Button */}
                <Link
                  to="/add"
                  className="group relative flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 font-bold text-lg overflow-hidden h-14"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative flex items-center space-x-3">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center group-hover:bg-white/30 transition-all duration-300">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <span className="tracking-wide">Add Words</span>
                  </div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-300 rounded-full animate-pulse"></div>
                </Link>
              </div>
            </div>

          </div>
        </div>

        {/* Bulk Action Panel */}
        {isSelectionMode && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl shadow-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              {/* Left: Selection Info */}
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-green-800">
                    {selectedWords.size} word{selectedWords.size !== 1 ? 's' : ''} selected
                  </h3>
                </div>
              </div>
              
              {/* Center: Difficulty Selector */}
              <div className="flex items-center space-x-3">
                <span className="text-green-800 font-semibold">Set Level:</span>
                <div className="relative custom-select-container">
                  <button
                    onClick={() => setIsSelectOpen(!isSelectOpen)}
                    className="flex items-center gap-3 px-4 py-2 bg-white border-2 border-green-300 rounded-xl hover:border-green-400 focus:ring-2 focus:ring-green-200 focus:border-green-500 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer min-w-[160px]"
                  >
                    <span className="text-gray-600">{getSelectedOption().icon}</span>
                    <span className="font-medium text-gray-800">{getSelectedOption().label}</span>
                    <svg className={`w-4 h-4 text-green-600 transition-transform duration-200 ${isSelectOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {/* Dropdown */}
                  {isSelectOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-green-200 rounded-xl shadow-lg z-50 overflow-hidden">
                      {difficultyOptions.map((option) => (
                        <button
                          key={option.value || 'not-rated'}
                          onClick={() => {
                            setBulkDifficulty(option.value as DifficultyLevel | null);
                            setIsSelectOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-green-50 transition-colors duration-200 ${
                            bulkDifficulty === option.value ? 'bg-green-100' : ''
                          }`}
                        >
                          <span className="text-gray-600">{option.icon}</span>
                          <span className="font-medium text-gray-800">{option.label}</span>
                          {bulkDifficulty === option.value && (
                            <svg className="w-4 h-4 text-green-600 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Right: Action Buttons */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={selectAllWords}
                  className="px-3 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-200 font-semibold shadow-sm hover:shadow-md transform hover:scale-105 text-sm"
                >
                  Select All
                </button>
                <button
                  onClick={clearSelection}
                  className="px-3 py-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg hover:from-gray-600 hover:to-gray-700 transition-all duration-200 font-semibold shadow-sm hover:shadow-md transform hover:scale-105 text-sm"
                >
                  Clear
                </button>
                <button
                  onClick={handleDeleteClick}
                  disabled={selectedWords.size === 0}
                  className="px-3 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 font-semibold shadow-sm hover:shadow-md transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none text-sm flex items-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete ({selectedWords.size})
                </button>
                <button
                  onClick={applyBulkDifficulty}
                  disabled={!bulkDifficulty || selectedWords.size === 0}
                  className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 font-bold shadow-sm hover:shadow-md transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none text-sm"
                >
                  Apply
                </button>
                <button
                  onClick={toggleSelectionMode}
                  className="px-3 py-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg hover:from-gray-600 hover:to-gray-700 transition-all duration-200 font-semibold shadow-sm hover:shadow-md transform hover:scale-105 text-sm flex items-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Exit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filter Section */}
        <div className="mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl ring-1 ring-slate-200 p-6 relative z-30">

            {/* Filters - Bottom Section in Single Row */}
            <div className="flex items-center gap-4 flex-nowrap">
              <div className="flex items-center gap-4 flex-nowrap flex-1">
                {/* All/Pending/Evaluated toggle */}
                <div className="relative group h-14 flex-shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-100/60 to-indigo-100/60 rounded-xl blur-sm group-hover:blur-md transition-all duration-300"></div>
                  <div className="relative bg-white/95 rounded-xl ring-1 ring-blue-200/60 shadow-lg backdrop-blur-sm group-hover:shadow-xl group-hover:ring-blue-300/60 transition-all duration-300 h-full flex items-center p-2">
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
                </div>

                {/* Search */}
                <div className="relative group h-14 flex-1 min-w-[180px] max-w-[400px]">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-100/60 to-indigo-100/60 rounded-xl blur-sm group-hover:blur-md transition-all duration-300"></div>
                  <div className="relative bg-white/95 rounded-xl ring-1 ring-blue-200/60 shadow-lg backdrop-blur-sm group-hover:shadow-xl group-hover:ring-blue-300/60 transition-all duration-300 h-full flex items-center">
                    <input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search words..."
                      className="pl-12 pr-12 py-0 rounded-xl border-0 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-400 text-slate-700 placeholder:text-slate-400 w-full font-medium h-full"
                    />
                    <svg className="w-5 h-5 text-blue-400 absolute left-4 top-1/2 -translate-y-1/2 group-hover:text-blue-500 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z" />
                    </svg>
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all duration-200 hover:scale-110"
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
                <div className="relative group h-14 flex-shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-100/60 to-indigo-100/60 rounded-xl blur-sm group-hover:blur-md transition-all duration-300"></div>
                  <div className="relative bg-white/95 rounded-xl ring-1 ring-blue-200/60 shadow-lg backdrop-blur-sm group-hover:shadow-xl group-hover:ring-blue-300/60 transition-all duration-300 h-full flex items-center p-2">
                  <div className="flex items-center gap-0.5">
                    {[1,2,3,4,5].map((lvl, index) => {
                      const active = levelFilters.includes(lvl);
                      return (
                        <div key={lvl} className="flex items-center">
                          <button
                            onClick={() => setLevelFilters((prev) => active ? prev.filter(v => v !== lvl) : [...prev, lvl])}
                            className={`w-8 h-8 rounded-lg text-xs font-bold transition-all duration-300 ${getLevelChipClasses(lvl, active)} ${active ? 'transform scale-110 shadow-lg ring-2 ring-white/50' : 'hover:scale-105 hover:shadow-md'}`}
                            title={`Level ${lvl}`}
                          >
                            {lvl}
                          </button>
                          {index < 4 && (
                            <div className="w-px h-6 bg-blue-200/60 mx-1.5"></div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  </div>
                </div>

                {/* Sort dropdown */}
                <div className="relative group h-14 flex-shrink-0" ref={sortRef}>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-100/60 to-indigo-100/60 rounded-xl blur-sm group-hover:blur-md transition-all duration-300"></div>
                  <button
                    onClick={() => setIsSortOpen((v) => !v)}
                    className="relative bg-white/95 pl-3 pr-8 py-0 rounded-xl ring-1 ring-blue-200/60 text-slate-700 shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400 flex items-center gap-2 backdrop-blur-sm min-w-[140px] hover:shadow-xl hover:ring-blue-300/60 transition-all duration-300 h-full"
                  >
                    <svg className="w-5 h-5 text-blue-400 group-hover:text-blue-500 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2H3V4zm0 6h10v2H3v-2zm0 6h6v2H3v-2z" />
                    </svg>
                    <span className="font-semibold whitespace-nowrap">{sortLabel}</span>
                    <svg className={`w-4 h-4 text-blue-400 absolute right-3 transition-transform duration-200 ${isSortOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                        { key: 'oldest', label: 'Oldest First' },
                        { key: 'newest', label: 'Newest First' },
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
                
                <div className="text-center">
                  <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">
                    No Words Yet
                  </h2>
                  <p className="text-slate-600 mb-8 text-xl leading-relaxed max-w-2xl mx-auto">
                    Start building your vocabulary collection by adding some words to begin your learning journey
                  </p>
                  
                  {/* Add Words Button */}
                  <Link
                    to="/add"
                    className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 font-bold text-lg group"
                  >
                    <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-all duration-300">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <span>Add Your First Words</span>
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
                  
                  {/* Getting Started Info */}
                  <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-200/50 backdrop-blur-sm max-w-lg mx-auto">
                    <div className="flex items-center justify-center space-x-3 mb-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <span className="text-blue-700 font-bold text-lg">Getting Started</span>
                    </div>
                    <p className="text-blue-600 font-medium text-center">
                      Click the button above to add your first words and start learning!
                    </p>
                  </div>
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
                          <div className="p-4">
                <div className="space-y-6">
                  {paginatedWords.map((word) => (
                    <WordCard
                      key={word.id}
                      word={word}
                      onUpdateDifficulty={onUpdateDifficulty}
                      onRemoveWord={handleRemoveWord}
                      onResetEvaluation={(id) => onUpdateDifficulty(id, 0)}
                      onStartEvaluationWithWord={handleWordClick}
                      fallbackLearningLanguageName={word.language1Name}
                      fallbackKnownLanguageName={word.language2Name}
                      isSelectionMode={isSelectionMode}
                      isSelected={selectedWords.has(word.id)}
                      onToggleSelection={toggleWordSelection}
                      onImageClick={handleImageClick}
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

      {/* Alert */}
      {alertMessage && (
        <div className="fixed bottom-4 left-4 z-50">
          <div className={`px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3 ${
            alertMessage.type === 'success' 
              ? 'bg-green-500 text-white' 
              : 'bg-red-500 text-white'
          }`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {alertMessage.type === 'success' ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              )}
            </svg>
            <span className="font-medium">{alertMessage.message}</span>
            <button
              onClick={() => setAlertMessage(null)}
              className="ml-2 text-white/80 hover:text-white"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Global Image Modal */}
      <ImageModal
        word={currentImageWord}
        languageName={currentImageLanguage}
        isOpen={showImageModal}
        onClose={() => setShowImageModal(false)}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Delete Selected Words</h3>
                <p className="text-gray-600 text-sm">This action cannot be undone</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 mb-2">
                Are you sure you want to delete <span className="font-semibold text-red-600">{selectedWords.size}</span> selected word{selectedWords.size !== 1 ? 's' : ''}?
              </p>
              <p className="text-sm text-gray-500">
                This will permanently remove the selected words from your collection.
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={deleteSelectedWords}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete {selectedWords.size} word{selectedWords.size !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
