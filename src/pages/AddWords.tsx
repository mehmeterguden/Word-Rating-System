import React, { useState, useEffect, useRef } from 'react';
import { WordSet } from '../types';
import { LANGUAGES, getLanguageByName, getUniqueLanguages } from '../utils/languages';

interface AddWordsProps {
  onAddWords: (wordPairs: { text1: string; text2: string; language1Name: string; language2Name: string }[]) => void;
  activeSetId: string | null;
  wordSets: any[];
  defaultLanguage1: string;
  defaultLanguage2: string;
  defaultSeparator: string;
}

const AddWords: React.FC<AddWordsProps> = ({ 
  onAddWords, 
  activeSetId, 
  wordSets,
  defaultLanguage1,
  defaultLanguage2,
  defaultSeparator
}) => {
  const [inputText, setInputText] = useState('');
  const [language1, setLanguage1] = useState(defaultLanguage1);
  const [language2, setLanguage2] = useState(defaultLanguage2);
  const [separator, setSeparator] = useState(defaultSeparator);
  const [previewWords, setPreviewWords] = useState<{ text1: string; text2: string }[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  
  // Dropdown states
  const [showLang1Dropdown, setShowLang1Dropdown] = useState(false);
  const [showLang2Dropdown, setShowLang2Dropdown] = useState(false);
  const [searchLang1, setSearchLang1] = useState('');
  const [searchLang2, setSearchLang2] = useState('');
  const [selectedLang1Index, setSelectedLang1Index] = useState(-1);
  const [selectedLang2Index, setSelectedLang2Index] = useState(-1);

  // Refs for dropdowns
  const lang1DropdownRef = useRef<HTMLDivElement>(null);
  const lang2DropdownRef = useRef<HTMLDivElement>(null);
  const lang1SearchRef = useRef<HTMLInputElement>(null);
  const lang2SearchRef = useRef<HTMLInputElement>(null);

  const activeSet = wordSets.find(set => set.id === activeSetId);

  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.language-dropdown')) {
        setShowLang1Dropdown(false);
        setShowLang2Dropdown(false);
        setSearchLang1('');
        setSearchLang2('');
        setSelectedLang1Index(-1);
        setSelectedLang2Index(-1);
      }
    };

    if (showLang1Dropdown || showLang2Dropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLang1Dropdown, showLang2Dropdown]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (showLang1Dropdown) {
        handleLang1KeyDown(event);
      } else if (showLang2Dropdown) {
        handleLang2KeyDown(event);
      }
    };

    if (showLang1Dropdown || showLang2Dropdown) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showLang1Dropdown, showLang2Dropdown, searchLang1, searchLang2]);

  const handleLang1KeyDown = (event: KeyboardEvent) => {
    const filteredLanguages = getFilteredLanguages(searchLang1);
    
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setSelectedLang1Index(prev => 
          prev < filteredLanguages.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        event.preventDefault();
        setSelectedLang1Index(prev => 
          prev > 0 ? prev - 1 : filteredLanguages.length - 1
        );
        break;
      case 'Enter':
        event.preventDefault();
        if (selectedLang1Index >= 0 && selectedLang1Index < filteredLanguages.length) {
          const selectedLang = filteredLanguages[selectedLang1Index];
          setLanguage1(selectedLang.name);
          setShowLang1Dropdown(false);
          setSearchLang1('');
          setSelectedLang1Index(-1);
        }
        break;
      case 'Escape':
        setShowLang1Dropdown(false);
        setSearchLang1('');
        setSelectedLang1Index(-1);
        break;
    }
  };

  const handleLang2KeyDown = (event: KeyboardEvent) => {
    const filteredLanguages = getFilteredLanguages(searchLang2);
    
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setSelectedLang2Index(prev => 
          prev < filteredLanguages.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        event.preventDefault();
        setSelectedLang2Index(prev => 
          prev > 0 ? prev - 1 : filteredLanguages.length - 1
        );
        break;
      case 'Enter':
        event.preventDefault();
        if (selectedLang2Index >= 0 && selectedLang2Index < filteredLanguages.length) {
          const selectedLang = filteredLanguages[selectedLang2Index];
          setLanguage2(selectedLang.name);
          setShowLang2Dropdown(false);
          setSearchLang2('');
          setSelectedLang2Index(-1);
        }
        break;
      case 'Escape':
        setShowLang2Dropdown(false);
        setSearchLang2('');
        setSelectedLang2Index(-1);
        break;
    }
  };

  // Update preview when input or settings change
  useEffect(() => {
    if (inputText.trim()) {
      const lines = inputText.trim().split('\n').filter(line => line.trim());
      const parsed = lines.map(line => {
        const parts = line.split(separator);
        if (parts.length >= 2) {
          return {
            text1: parts[0].trim(),
            text2: parts.slice(1).join(separator).trim()
          };
        } else {
          return {
            text1: line.trim(),
            text2: ''
          };
        }
      });
      setPreviewWords(parsed);
    } else {
      setPreviewWords([]);
    }
  }, [inputText, separator]);

  const handleAddWords = () => {
    if (inputText.trim() && previewWords.length > 0) {
      const validWords = previewWords.filter(word => word.text1 && word.text2);
      if (validWords.length > 0) {
        onAddWords(validWords.map(w => ({
          text1: w.text1,
          text2: w.text2,
          language1Name: language1,
          language2Name: language2
        })));
        setInputText('');
        setPreviewWords([]);
        setShowPreview(false);
      }
    }
  };

  const handlePreview = () => {
    setShowPreview(!showPreview);
  };

  const getFilteredLanguages = (searchTerm: string) => {
    if (!searchTerm.trim()) {
      return getUniqueLanguages(); // Show all unique languages when no search term
    }
    const searchLower = searchTerm.toLowerCase();
    return getUniqueLanguages().filter(lang => 
      lang.name.toLowerCase().includes(searchLower) ||
      lang.nativeName.toLowerCase().includes(searchLower) ||
      lang.code.toLowerCase().includes(searchLower)
    );
  };

  const getLanguageDisplay = (langName: string) => {
    const lang = getUniqueLanguages().find(l => l.name === langName);
    return lang ? `${lang.name} (${lang.nativeName})` : langName;
  };

  const getLanguageFlag = (langName: string) => {
    const lang = getUniqueLanguages().find(l => l.name === langName);
    return lang ? lang.flag : '🌐';

  };

  const separatorExamples = [
    { symbol: '-', name: 'Dash', example: 'hello - merhaba' },
    { symbol: '|', name: 'Pipe', example: 'hello | merhaba' },
    { symbol: '=', name: 'Equals', example: 'hello = merhaba' },
    { symbol: ':', name: 'Colon', example: 'hello : merhaba' },
    { symbol: '→', name: 'Arrow', example: 'hello → merhaba' }
  ];

  const handleLang1DropdownToggle = () => {
    if (showLang1Dropdown) {
      setShowLang1Dropdown(false);
      setSearchLang1('');
      setSelectedLang1Index(-1);
    } else {
      setShowLang1Dropdown(true);
      setShowLang2Dropdown(false);
      setSearchLang2('');
      setSelectedLang2Index(-1);
      // Focus the search input after a short delay
      setTimeout(() => {
        lang1SearchRef.current?.focus();
      }, 100);
    }
  };

  const handleLang2DropdownToggle = () => {
    if (showLang2Dropdown) {
      setShowLang2Dropdown(false);
      setSearchLang2('');
      setSelectedLang2Index(-1);
    } else {
      setShowLang2Dropdown(true);
      setShowLang1Dropdown(false);
      setSearchLang1('');
      setSelectedLang1Index(-1);
      // Focus the search input after a short delay
      setTimeout(() => {
        lang2SearchRef.current?.focus();
      }, 100);
    }
  };

  const handleLang1Select = (lang: any) => {
    setLanguage1(lang.name);
    setShowLang1Dropdown(false);
    setSearchLang1('');
    setSelectedLang1Index(-1);
  };

  const handleLang2Select = (lang: any) => {
    setLanguage2(lang.name);
    setShowLang2Dropdown(false);
    setSearchLang2('');
    setSelectedLang2Index(-1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="relative bg-gradient-to-br from-white via-blue-50/50 to-indigo-50/50 backdrop-blur-xl rounded-2xl shadow-xl border border-blue-200/50 p-6 mb-6 overflow-hidden">
          {/* Background Decorations */}
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-100/40 to-indigo-100/40 rounded-full -translate-y-10 translate-x-10"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-indigo-100/40 to-blue-100/40 rounded-full translate-y-8 -translate-x-8"></div>
          
          <div className="relative z-10 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg ring-2 ring-blue-100">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-800 to-indigo-800 bg-clip-text text-transparent mb-2">
              Add Words
            </h1>
            <p className="text-slate-600 text-lg mb-4">
              Add words in two languages with custom separator
            </p>
            
            {/* Active Set Info */}
            {activeSet && (
              <div className="bg-white/70 rounded-lg p-4 backdrop-blur-sm border border-blue-200/50 max-w-md mx-auto">
                <div className="text-sm font-semibold text-blue-800 mb-1">Active Set: {activeSet.name}</div>
                <div className="text-xs text-slate-600">
                  {activeSet.language1} ↔ {activeSet.language2} • "{activeSet.separator}" • {activeSet.wordCount} words
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Settings and Input Area */}
        <div className="relative bg-gradient-to-br from-white via-blue-50/50 to-indigo-50/50 backdrop-blur-xl rounded-2xl shadow-xl border border-blue-200/50 p-6 mb-6 overflow-hidden">
          {/* Background Decorations */}
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-blue-100/40 to-indigo-100/40 rounded-full -translate-y-8 translate-x-8"></div>
          <div className="absolute bottom-0 left-0 w-12 h-12 bg-gradient-to-tr from-indigo-100/40 to-blue-100/40 rounded-full translate-y-6 -translate-x-6"></div>
          
          <div className="relative z-10">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold bg-gradient-to-r from-blue-800 to-indigo-800 bg-clip-text text-transparent flex items-center">
                <svg className="w-6 h-6 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
                Language Settings & Input
              </h3>
              <button
                onClick={() => setShowInstructions(!showInstructions)}
                className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200"
                title="How to use"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>

            {/* Instructions */}
            {showInstructions && (
              <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2">How to use:</h4>
                <div className="space-y-1 text-sm text-blue-700">
                  <div>• Each line should contain two words separated by "{separator}"</div>
                  <div>• Left side: {language1} word</div>
                  <div>• Right side: {language2} word</div>
                  <div>• Use the preview button to see how your words will be parsed</div>
                  <div>• Invalid entries (missing one side) will be ignored</div>
                </div>
              </div>
            )}

            {/* Language Settings - Horizontal Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
              {/* First Language */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">
                  First Language
                </label>
                <div className="relative language-dropdown" ref={lang1DropdownRef}>
                  <button
                    onClick={handleLang1DropdownToggle}
                    className="w-full px-4 py-3 bg-white/80 border border-blue-200 rounded-xl hover:border-blue-400 focus:border-blue-500 transition-all duration-200 text-left flex items-center justify-between shadow-sm hover:shadow-md"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{getLanguageFlag(language1)}</span>
                      <span className="font-medium text-slate-800 text-sm">{getLanguageDisplay(language1)}</span>
                    </div>
                    <svg className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${showLang1Dropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {showLang1Dropdown && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-blue-200 rounded-xl shadow-xl z-50 max-h-96 overflow-hidden">
                      <div className="p-3 border-b border-blue-200">
                        <input
                          ref={lang1SearchRef}
                          type="text"
                          placeholder="Search languages..."
                          value={searchLang1}
                          onChange={(e) => {
                            setSearchLang1(e.target.value);
                            setSelectedLang1Index(-1);
                          }}
                          className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 text-sm"
                        />
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {getFilteredLanguages(searchLang1).map((lang, index) => (
                          <button
                            key={lang.code}
                            onClick={() => handleLang1Select(lang)}
                            className={`w-full px-4 py-3 text-left transition-colors duration-200 flex items-center space-x-2 ${
                              index === selectedLang1Index 
                                ? 'bg-blue-100 border-l-4 border-blue-500' 
                                : 'hover:bg-blue-50'
                            }`}
                          >
                            <span className="text-lg">{getLanguageFlag(lang.name)}</span>
                            <div>
                              <div className="font-medium text-slate-800 text-sm">{lang.name}</div>
                              <div className="text-xs text-slate-500">{lang.nativeName}</div>
                            </div>
                          </button>
                        ))}
                        {getFilteredLanguages(searchLang1).length === 0 && (
                          <div className="px-4 py-3 text-slate-500 text-center text-sm">
                            No languages found matching "{searchLang1}"
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Second Language */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Second Language
                </label>
                <div className="relative language-dropdown" ref={lang2DropdownRef}>
                  <button
                    onClick={handleLang2DropdownToggle}
                    className="w-full px-4 py-3 bg-white/80 border border-blue-200 rounded-xl hover:border-blue-400 focus:border-blue-500 transition-all duration-200 text-left flex items-center justify-between shadow-sm hover:shadow-md"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{getLanguageFlag(language2)}</span>
                      <span className="font-medium text-slate-800 text-sm">{getLanguageDisplay(language2)}</span>
                    </div>
                    <svg className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${showLang2Dropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {showLang2Dropdown && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-blue-200 rounded-xl shadow-xl z-50 max-h-96 overflow-hidden">
                      <div className="p-3 border-b border-blue-200">
                        <input
                          ref={lang2SearchRef}
                          type="text"
                          placeholder="Search languages..."
                          value={searchLang2}
                          onChange={(e) => {
                            setSearchLang2(e.target.value);
                            setSelectedLang2Index(-1);
                          }}
                          className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 text-sm"
                        />
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {getFilteredLanguages(searchLang2).map((lang, index) => (
                          <button
                            key={lang.code}
                            onClick={() => handleLang2Select(lang)}
                            className={`w-full px-4 py-3 text-left transition-colors duration-200 flex items-center space-x-2 ${
                              index === selectedLang2Index 
                                ? 'bg-blue-100 border-l-4 border-blue-500' 
                                : 'hover:bg-blue-50'
                            }`}
                          >
                            <span className="text-lg">{getLanguageFlag(lang.name)}</span>
                            <div>
                              <div className="font-medium text-slate-800 text-sm">{lang.name}</div>
                              <div className="text-xs text-slate-500">{lang.nativeName}</div>
                            </div>
                          </button>
                        ))}
                        {getFilteredLanguages(searchLang2).length === 0 && (
                          <div className="px-4 py-3 text-slate-500 text-center text-sm">
                            No languages found matching "{searchLang2}"
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Separator */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Separator
                </label>
                <div className="flex flex-wrap gap-1">
                  {separatorExamples.map((sep, index) => (
                    <button
                      key={index}
                      onClick={() => setSeparator(sep.symbol)}
                      className={`px-3 py-2 rounded-lg border transition-all duration-200 hover:scale-105 ${
                        separator === sep.symbol
                          ? 'border-blue-500 bg-blue-50 shadow-md ring-1 ring-blue-200'
                          : 'border-blue-200 bg-white/80 hover:border-blue-300 hover:shadow-sm'
                      }`}
                    >
                      <span className={`text-sm font-bold ${
                        separator === sep.symbol ? 'text-blue-600' : 'text-slate-600'
                      }`}>
                        {sep.symbol}
                      </span>
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={separator}
                  onChange={(e) => setSeparator(e.target.value)}
                  className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-mono bg-white/80"
                  maxLength={3}
                  placeholder="Custom..."
                />
              </div>
            </div>

            {/* Input Area */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold text-slate-800">
                  Word Input Format: <span className="text-blue-600 font-mono">{language1} {separator} {language2}</span>
                </h4>
                <button
                  onClick={handlePreview}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg hover:scale-105 active:scale-95 text-sm"
                >
                  {showPreview ? 'Hide Preview' : 'Show Preview'}
                </button>
              </div>
              
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`Enter words in format:\nhello ${separator} merhaba\nworld ${separator} dünya\ncomputer ${separator} bilgisayar`}
                className="w-full h-48 px-4 py-3 border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg resize-none bg-white/80"
              />
              
              <div className="text-sm text-slate-500">
                Each line should contain: <span className="font-medium font-mono">{language1} {separator} {language2}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Preview */}
        {showPreview && previewWords.length > 0 && (
          <div className="relative bg-gradient-to-br from-white via-blue-50/50 to-indigo-50/50 backdrop-blur-xl rounded-2xl shadow-xl border border-blue-200/50 p-6 mb-6 overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-blue-100/40 to-indigo-100/40 rounded-full -translate-y-8 translate-x-8"></div>
            <div className="absolute bottom-0 left-0 w-12 h-12 bg-gradient-to-tr from-indigo-100/40 to-blue-100/40 rounded-full translate-y-6 -translate-x-6"></div>
            
            <div className="relative z-10">
              <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Preview ({previewWords.length} words)
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                {previewWords.map((word, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${
                      word.text1 && word.text2
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-red-300 bg-red-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-slate-600">{language1}:</span>
                      <span className={`text-sm ${word.text1 ? 'text-blue-600' : 'text-red-600'}`}>
                        {word.text1 || 'Missing'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-600">{language2}:</span>
                      <span className={`text-sm ${word.text2 ? 'text-blue-600' : 'text-red-600'}`}>
                        {word.text2 || 'Missing'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 text-sm text-slate-600">
                <span className="text-blue-600 font-medium">
                  {previewWords.filter(w => w.text1 && w.text2).length}
                </span> valid words,{' '}
                <span className="text-red-600 font-medium">
                  {previewWords.filter(w => !w.text1 || !w.text2).length}
                </span> invalid entries
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="relative bg-gradient-to-br from-white via-blue-50/50 to-indigo-50/50 backdrop-blur-xl rounded-2xl shadow-xl border border-blue-200/50 p-6 mb-6 overflow-hidden">
          {/* Background Decorations */}
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-blue-100/40 to-indigo-100/40 rounded-full -translate-y-8 translate-x-8"></div>
          <div className="absolute bottom-0 left-0 w-12 h-12 bg-gradient-to-tr from-indigo-100/40 to-blue-100/40 rounded-full translate-y-6 -translate-x-6"></div>
          
          <div className="relative z-10 flex space-x-4">
            <button
              onClick={handleAddWords}
              disabled={!inputText.trim() || previewWords.filter(w => w.text1 && w.text2).length === 0}
              className="flex-1 px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 font-bold text-lg shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
            >
              Add {previewWords.filter(w => w.text1 && w.text2).length} Words
            </button>
            
            <button
              onClick={() => setInputText('')}
              className="px-8 py-4 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 rounded-xl hover:from-blue-200 hover:to-indigo-200 transition-all duration-200 font-semibold text-lg hover:scale-105 active:scale-95"
            >
              Clear
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AddWords;