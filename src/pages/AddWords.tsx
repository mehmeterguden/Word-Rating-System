import React, { useState, useEffect, useRef } from 'react';
import { getUniqueLanguages } from '../utils/languages';
import LiveTranslation from '../components/LiveTranslation';

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
  const [selectedAlternatives, setSelectedAlternatives] = useState<Map<string, string>>(new Map());
  const [wordAlternatives, setWordAlternatives] = useState<Map<string, string[]>>(new Map());
  const [translationResults, setTranslationResults] = useState<any[]>([]);
  const [showTranslationResults, setShowTranslationResults] = useState(false);
  const [showAiSettings, setShowAiSettings] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [customAiPrompt, setCustomAiPrompt] = useState(() => {
    try {
      return localStorage.getItem('word-rating-system-custom-ai-prompt') || '';
    } catch {
      return '';
    }
  });
  const [isGeneratingTranslations, setIsGeneratingTranslations] = useState(false);
  const [editableTranslations, setEditableTranslations] = useState<Map<string, string>>(new Map());
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [lastUsedPrompt, setLastUsedPrompt] = useState<string>('');
  const [batchProgress, setBatchProgress] = useState<{
    currentBatch: number;
    totalBatches: number;
    processedWords: number;
    totalWords: number;
    isBatchProcessing: boolean;
  } | null>(null);


  // Save custom AI prompt to localStorage when it changes
  useEffect(() => {
    try {
      localStorage.setItem('word-rating-system-custom-ai-prompt', customAiPrompt);
    } catch (error) {
      console.warn('Failed to save custom AI prompt to localStorage:', error);
    }
  }, [customAiPrompt]);
  
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

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlertMessage({ type, message });
    setTimeout(() => {
      setAlertMessage(null);
    }, 4000);
  };

  const handleAddWords = () => {
    if (inputText.trim() && previewWords.length > 0) {
      const validWords = previewWords.filter(word => word.text1 && word.text2);
      if (validWords.length > 0) {
        try {
          onAddWords(validWords.map(w => ({
            text1: w.text1,
            text2: w.text2,
            language1Name: language1,
            language2Name: language2
          })));
          setInputText('');
          setPreviewWords([]);
          setShowPreview(false);
          showAlert('success', `${validWords.length} words added successfully!`);
        } catch (error) {
          showAlert('error', 'Error occurred while adding words!');
        }
      }
    }
  };

  const handleLiveTranslationWord = (wordPair: { text1: string; text2: string; language1Name: string; language2Name: string }) => {
    // Add the word pair to preview words
    setPreviewWords(prev => [...prev, { text1: wordPair.text1, text2: wordPair.text2 }]);
    setShowPreview(true);
    showAlert('success', `"${wordPair.text1}" word added!`);
  };

  const handleAddToTextarea = (text: string) => {
    // Add text to textarea with line break if there's existing content
    const newText = inputText.trim() ? `${inputText}\n${text}` : text;
    setInputText(newText);
  };

  const handlePreview = () => {
    setShowPreview(!showPreview);
  };

  const handleAlternativeSelect = (word: string, alternative: string) => {
    setSelectedAlternatives(prev => {
      const newMap = new Map(prev);
      newMap.set(word, alternative);
      return newMap;
    });
    
    // Update editable translations with the selected alternative
    setEditableTranslations(prev => {
      const newMap = new Map(prev);
      newMap.set(word, alternative);
      return newMap;
    });
    
    // Update translation results to swap main translation with selected alternative
    setTranslationResults(prev => prev.map(translation => {
      if (translation.originalWord === word) {
        const newAlternatives = [...(translation.alternatives || [])];
        // Remove the selected alternative from alternatives
        const alternativeIndex = newAlternatives.indexOf(alternative);
        if (alternativeIndex > -1) {
          newAlternatives.splice(alternativeIndex, 1);
        }
        // Add the current main translation to alternatives
        newAlternatives.push(translation.translation);
        
        return {
          ...translation,
          translation: alternative,
          alternatives: newAlternatives
        };
      }
      return translation;
    }));
  };

  const handleApplyTranslations = () => {
    // Generate formatted text with editable translations
    const formattedLines = translationResults.map(translation => {
      const editableTranslation = editableTranslations.get(translation.originalWord);
      const selectedAlternative = selectedAlternatives.get(translation.originalWord);
      const finalTranslation = editableTranslation || selectedAlternative || translation.translation;
      return `${translation.originalWord}${separator}${finalTranslation}`;
    });
    
    setInputText(formattedLines.join('\n'));
    setShowTranslationResults(false);
  };

  const handleCloseTranslationResults = () => {
    setShowTranslationResults(false);
    setSelectedAlternatives(new Map());
    setEditableTranslations(new Map());
  };

  const handleGenerateTranslations = async () => {
    if (!inputText.trim()) return;
    
    // Extract words from main input
    const wordsFromInput = inputText.trim().split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => {
        const parts = line.split(separator);
        return parts[0]?.trim() || line.trim();
      })
      .filter(word => word.length > 0);
    
    if (wordsFromInput.length === 0) return;
    
    // Check if batch processing is needed
    const isBatchProcessing = wordsFromInput.length > 25;
    if (isBatchProcessing) {
      const totalBatches = Math.ceil(wordsFromInput.length / 25);
      setBatchProgress({
        currentBatch: 0,
        totalBatches,
        processedWords: 0,
        totalWords: wordsFromInput.length,
        isBatchProcessing: true
      });
    } else {
      setBatchProgress(null);
    }

    // Show container immediately with loading state
    setIsGeneratingTranslations(true);
    setShowTranslationResults(true);
    
    // Create initial loading results
    const loadingResults = wordsFromInput.map(word => ({
      originalWord: word,
      translation: isBatchProcessing ? '🚀 Preparing batch processing...' : '🤖 Generating translation...',
      confidence: 'medium' as const,
      alternatives: []
    }));
    setTranslationResults(loadingResults);
    
    // Initialize editable translations with loading state
    const loadingEditableMap = new Map<string, string>();
    wordsFromInput.forEach(word => {
      loadingEditableMap.set(word, isBatchProcessing ? '🚀 Preparing batch processing...' : '🤖 Generating translation...');
    });
    setEditableTranslations(loadingEditableMap);

    try {
      // Import the translation function
      const { generateWordTranslations } = await import('../utils/wordTranslation');
      
      // Debug: Log custom instructions
      console.log('🔧 Custom AI Instructions:', customAiPrompt.trim());
      console.log('📝 Words to translate:', wordsFromInput);
      console.log('🌍 Languages:', `${language1} → ${language2}`);
      console.log('📏 Separator:', separator);
      console.log('🔄 Batch Processing:', isBatchProcessing ? `Yes (${Math.ceil(wordsFromInput.length / 25)} batches)` : 'No');
      
      // Generate translations with progress callback
      const response = await generateWordTranslations({
        words: wordsFromInput,
        sourceLanguageName: language1,
        targetLanguageName: language2,
        separator,
        customInstructions: customAiPrompt.trim(),
        onBatchProgress: (progress) => {
          // Update batch progress state
          setBatchProgress({
            currentBatch: progress.currentBatch,
            totalBatches: progress.totalBatches,
            processedWords: progress.processedWords,
            totalWords: progress.totalWords,
            isBatchProcessing: true
          });
          
          // Update translation results with current progress
          const updatedResults = wordsFromInput.map((word, index) => {
            if (index < progress.processedWords) {
              // Already processed - keep existing translation
              const existingTranslation = translationResults.find(t => t.originalWord === word);
              return existingTranslation || {
                originalWord: word,
                translation: '✅ Completed',
                confidence: 'medium' as const,
                alternatives: []
              };
            } else if (progress.currentBatchWords.includes(word)) {
              // Currently processing
              return {
                originalWord: word,
                translation: `🔄 Processing batch ${progress.currentBatch}/${progress.totalBatches}...`,
                confidence: 'medium' as const,
                alternatives: []
              };
            } else {
              // Waiting to be processed
              return {
                originalWord: word,
                translation: '⏳ Waiting for batch processing...',
                confidence: 'medium' as const,
                alternatives: []
              };
            }
          });
          
          setTranslationResults(updatedResults);
          
          // Update editable translations
          const updatedEditableMap = new Map<string, string>();
          updatedResults.forEach(result => {
            updatedEditableMap.set(result.originalWord, result.translation);
          });
          setEditableTranslations(updatedEditableMap);
        }
      });
      
      // Debug: Log response
      console.log('✅ AI Response received:', response);
      console.log('📊 Translations count:', response.translations.length);
      
      // Store translation results for the container
      setTranslationResults(response.translations);
      
      // Store the prompt that was used
      if (response.prompt) {
        setLastUsedPrompt(response.prompt);
      }
      
      // Initialize editable translations
      const editableMap = new Map<string, string>();
      response.translations.forEach(translation => {
        editableMap.set(translation.originalWord, translation.translation);
      });
      setEditableTranslations(editableMap);
      
      // Store alternatives for each word
      const alternativesMap = new Map<string, string[]>();
      response.translations.forEach(translation => {
        if (translation.alternatives && translation.alternatives.length > 0) {
          alternativesMap.set(translation.originalWord, translation.alternatives);
        }
      });
      
      setWordAlternatives(alternativesMap);
      showAlert('success', `${response.translations.length} words translated successfully!`);
      
    } catch (error) {
      console.error('Translation error:', error);
      showAlert('error', 'Error occurred while translating!');
      // Show error state
      const errorResults = wordsFromInput.map(word => ({
        originalWord: word,
        translation: 'Error generating translation',
        confidence: 'low' as const,
        alternatives: []
      }));
      setTranslationResults(errorResults);
      
      // Update editable translations with error state
      const errorEditableMap = new Map<string, string>();
      wordsFromInput.forEach(word => {
        errorEditableMap.set(word, 'Error generating translation');
      });
      setEditableTranslations(errorEditableMap);
    } finally {
      setIsGeneratingTranslations(false);
      setBatchProgress(null);
    }
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
            <div className="text-center relative">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-800 to-indigo-800 bg-clip-text text-transparent mb-2">
                Add Words
              </h1>
              <button
                onClick={() => setShowInfoModal(true)}
                className="absolute top-0 left-1/2 transform translate-x-20 p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200 group"
                title="How to Use"
              >
                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              <p className="text-slate-600 text-lg mb-4">
                Add words in two languages with custom separator
              </p>
            </div>
            
          </div>
        </div>

        {/* Settings and Input Area */}
        <div className="relative bg-gradient-to-br from-white via-blue-50/50 to-indigo-50/50 backdrop-blur-xl rounded-2xl shadow-xl border border-blue-200/50 p-6 mb-6 overflow-hidden">
          {/* Background Decorations */}
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-blue-100/40 to-indigo-100/40 rounded-full -translate-y-8 translate-x-8"></div>
          <div className="absolute bottom-0 left-0 w-12 h-12 bg-gradient-to-tr from-indigo-100/40 to-blue-100/40 rounded-full translate-y-6 -translate-x-6"></div>
          
          <div className="relative z-10">
            {/* Header */}

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
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-slate-700">
                  Separator
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
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
                    className="px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-mono bg-white/80 w-20"
                    maxLength={5}
                    placeholder="Custom"
                  />
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 my-6"></div>

            {/* Input Area */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold text-slate-800">Enter Your Words</h4>
                <button
                  onClick={handlePreview}
                  disabled={!inputText.trim()}
                  className={`px-4 py-2 rounded-lg transition-all duration-200 font-medium shadow-md hover:shadow-lg hover:scale-105 active:scale-95 text-sm ${
                    inputText.trim()
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {showPreview ? 'Hide Preview' : 'Show Preview'}
                </button>
              </div>
              
              <div className="relative">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={`Enter words in format: ${language1} Word ${separator} ${language2} Word\n\nExamples:\nhello ${separator} merhaba\nworld ${separator} dünya\ncomputer ${separator} bilgisayar`}
                  className="w-full h-48 px-4 py-3 border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg resize-none bg-white/80"
                />
                <div className="absolute top-3 right-3 bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-mono border border-blue-200">
                  {language1} Word {separator} {language2} Word
                </div>
              </div>
              

              {/* Live Translation Component */}
              <div className="mt-6 p-6 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-200">
                  <div className="flex items-center mb-4">
                    <svg className="w-6 h-6 text-emerald-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <h3 className="text-lg font-semibold text-emerald-800">Live Translation Mode</h3>
                  </div>
                  <p className="text-sm text-emerald-700 mb-4">
                    Type a word in {language1} and press Enter to get instant AI translation suggestions.
                  </p>
                  <LiveTranslation
                    language1={language1}
                    language2={language2}
                    separator={separator}
                    onWordAdded={handleLiveTranslationWord}
                    onAddToTextarea={handleAddToTextarea}
                    disabled={isGeneratingTranslations}
                  />
                </div>

              {/* Action Buttons */}
              <div className="mt-6 space-y-4">
                <div className="flex space-x-4">
                  <button
                    onClick={handleAddWords}
                    disabled={!inputText.trim() || previewWords.filter(w => w.text1 && w.text2).length === 0}
                    className="flex-1 px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 font-bold text-lg shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                  >
                    Add {previewWords.filter(w => w.text1 && w.text2).length} Words
                  </button>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={handleGenerateTranslations}
                      disabled={!inputText.trim()}
                      className="px-8 py-4 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-xl hover:from-green-600 hover:to-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 font-bold text-lg shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 flex items-center"
                    >
                      <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                      </svg>
                      Generate Translations with AI
                    </button>
                    
                    <button
                      onClick={() => setShowAiSettings(true)}
                      className="px-4 py-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl hover:from-emerald-600 hover:to-green-700 transition-all duration-200 font-bold text-lg shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 flex items-center"
                      title="AI Settings"
                    >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    </button>
                  </div>
                </div>
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
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-slate-600">{language2}:</span>
                      <span className={`text-sm ${word.text2 ? 'text-blue-600' : 'text-red-600'}`}>
                        {word.text2 || 'Missing'}
                      </span>
                    </div>
                    
                    {/* Show alternatives if available */}
                    {wordAlternatives.has(word.text1) && wordAlternatives.get(word.text1)!.length > 0 && (
                      <div className="mt-2">
                        <span className="text-xs text-gray-500 mb-1 block">Alternatives:</span>
                        <div className="flex flex-wrap gap-1">
                          {wordAlternatives.get(word.text1)!.map((alternative, altIndex) => {
                            const isSelected = selectedAlternatives.get(word.text1) === alternative;
                            return (
                              <button
                                key={altIndex}
                                onClick={() => handleAlternativeSelect(word.text1, alternative)}
                                className={`px-2 py-1 rounded text-xs transition-all duration-200 ${
                                  isSelected
                                    ? 'bg-blue-500 text-white shadow-md'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                              >
                                {alternative}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
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

        {/* Translation Results Modal */}
        {showTranslationResults && translationResults.length > 0 && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
            onClick={handleCloseTranslationResults}
          >
            <div 
              className="relative bg-gradient-to-br from-white via-emerald-50/80 to-teal-50/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-emerald-200/60 p-8 max-w-5xl w-full max-h-[90vh] overflow-hidden animate-in fade-in-0 zoom-in-95 duration-300"
              onClick={(e) => e.stopPropagation()}
            >
            {/* Background Decorations */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-emerald-100/50 to-teal-100/50 rounded-full -translate-y-10 translate-x-10"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-teal-100/50 to-emerald-100/50 rounded-full translate-y-8 -translate-x-8"></div>
            <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-gradient-to-br from-emerald-50/30 to-teal-50/30 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
            
            <div className="relative z-10">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                    </svg>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div>
                      <h3 className="text-2xl font-bold bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent">
                        AI Translation Results
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">Review and select your preferred translations</p>
                    </div>
                    <button
                      onClick={() => setShowPromptModal(true)}
                      className="p-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-all duration-200 group"
                      title="View AI Prompt"
                    >
                      <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                  </div>
                </div>
                <button
                  onClick={handleCloseTranslationResults}
                  className="p-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all duration-200 group"
                >
                  <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Batch Progress Bar - Top of Container */}
              {batchProgress && (
                <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-blue-800">Processing Batch {batchProgress.currentBatch} of {batchProgress.totalBatches}</h4>
                        <p className="text-xs text-blue-600">
                          {batchProgress.processedWords} of {batchProgress.totalWords} words completed
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-blue-800">
                        {Math.round((batchProgress.processedWords / batchProgress.totalWords) * 100)}%
                      </div>
                    </div>
                  </div>
                  
                  {/* Compact Progress Bar */}
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${(batchProgress.processedWords / batchProgress.totalWords) * 100}%` }}
                    ></div>
                  </div>
                  
                  {/* Status Text */}
                  <div className="mt-2 text-xs text-blue-700 text-center">
                    {batchProgress.processedWords > 0 && (
                      <span className="text-green-600">✓ {batchProgress.processedWords} completed</span>
                    )}
                    {batchProgress.processedWords > 0 && batchProgress.totalWords > batchProgress.processedWords && (
                      <span className="mx-2">•</span>
                    )}
                    {batchProgress.totalWords > batchProgress.processedWords && (
                      <span className="text-blue-600">
                        Processing {Math.min(25, batchProgress.totalWords - batchProgress.processedWords)} more words...
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Translation Results */}
              <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-3 scrollbar-thin scrollbar-thumb-emerald-300 scrollbar-track-emerald-100">
                {translationResults.map((translation, index) => (
                  <div key={index} className="bg-white/90 rounded-2xl p-6 border border-emerald-200/60 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-emerald-300/80">
                    {/* Main Translation */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg font-bold text-gray-800">{translation.originalWord}</span>
                        <span className="text-gray-400">{separator}</span>
                        {translation.confidence && (
                          <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
                            translation.confidence === 'high' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                            translation.confidence === 'medium' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                            'bg-rose-100 text-rose-800 border-rose-200'
                          }`}>
                            {translation.confidence === 'high' ? '🟢' : translation.confidence === 'medium' ? '🟡' : '🔴'} {
                              translation.confidence === 'high' ? 'High Accuracy' : 
                              translation.confidence === 'medium' ? 'Medium Accuracy' : 
                              'Low Accuracy'
                            }
                          </span>
                        )}
                      </div>
                      
                      {/* Editable Translation Input */}
                      <div className="relative">
                        <input
                          type="text"
                          value={editableTranslations.get(translation.originalWord) || translation.translation}
                          onChange={(e) => {
                            setEditableTranslations(prev => {
                              const newMap = new Map(prev);
                              newMap.set(translation.originalWord, e.target.value);
                              return newMap;
                            });
                          }}
                          className="w-full px-4 py-3 text-lg font-bold text-emerald-700 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                          placeholder="Enter translation..."
                        />
                        {isGeneratingTranslations && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-600"></div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Alternatives */}
                    {translation.alternatives && translation.alternatives.length > 0 && (
                      <div className="space-y-3 mt-4">
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          <span className="text-sm font-semibold text-gray-700">Alternative translations:</span>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          {translation.alternatives.map((alternative: string, altIndex: number) => {
                            return (
                              <button
                                key={altIndex}
                                onClick={() => handleAlternativeSelect(translation.originalWord, alternative)}
                                className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 bg-gray-100 text-gray-700 hover:bg-emerald-100 hover:text-emerald-700 hover:border-emerald-300 border border-transparent hover:shadow-md hover:scale-105 active:scale-95"
                              >
                                {alternative}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4 mt-8 pt-6 border-t border-emerald-200/60">
                <button
                  onClick={handleCloseTranslationResults}
                  className="flex-1 px-8 py-4 bg-gray-100 text-gray-700 rounded-2xl hover:bg-gray-200 transition-all duration-200 font-semibold text-lg hover:shadow-md"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApplyTranslations}
                  className="flex-1 px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                >
                  Apply Translations
                </button>
              </div>
            </div>
            </div>
          </div>
        )}

        {/* AI Settings Modal */}
        {showAiSettings && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
            onClick={() => setShowAiSettings(false)}
          >
            <div 
              className="relative bg-gradient-to-br from-white via-indigo-50/80 to-purple-50/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-indigo-200/60 p-8 max-w-2xl w-full max-h-[80vh] overflow-hidden animate-in fade-in-0 zoom-in-95 duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Background Decorations */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-indigo-100/50 to-purple-100/50 rounded-full -translate-y-10 translate-x-10"></div>
              <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-purple-100/50 to-indigo-100/50 rounded-full translate-y-8 -translate-x-8"></div>
              
              <div className="relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl shadow-lg">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold bg-gradient-to-r from-emerald-700 to-green-700 bg-clip-text text-transparent">
                        AI Generation Settings
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">Customize how AI generates translations</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAiSettings(false)}
                    className="p-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all duration-200 group"
                  >
                    <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Custom Prompt Input */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Custom AI Instructions
                    </label>
                    <textarea
                      value={customAiPrompt}
                      onChange={(e) => setCustomAiPrompt(e.target.value)}
                      placeholder="Enter custom instructions for AI translation generation.&#10;&#10;For example:&#10;• Add example sentences&#10;• Focus on formal language&#10;• Include pronunciation guides&#10;&#10;Note: These instructions will enhance the translations but won't change the output format."
                      className="w-full h-32 px-4 py-3 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 resize-none text-sm"
                    />
                  </div>
                  
                  {/* Example Instructions */}
                  <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                    <h4 className="text-sm font-semibold text-emerald-700 mb-3">💡 Example Instructions:</h4>
                    <div className="space-y-2">
                      {[
                        "For each word, add an example sentence in the FIRST language (source language) in parentheses. Format: 'translation (Example: First language sentence)'",
                        "Use only formal, polite language suitable for business or academic contexts. Avoid slang, casual expressions, or informal terms.",
                        "Include pronunciation guides in brackets after each translation. Use IPA notation or simple phonetic spelling. Example: 'hello (pronounced: hel-OH)'",
                        "Add grammatical information when relevant. Format: 'translation (Grammar: noun/verb/adjective)'"
                      ].map((instruction, index) => (
                        <div key={index} className="flex items-center justify-between bg-white rounded-lg p-2 border border-emerald-100">
                          <span className="text-xs text-emerald-600">{instruction}</span>
                          <button
                            onClick={() => {
                              const currentPrompt = customAiPrompt.trim();
                              const newPrompt = currentPrompt 
                                ? `${currentPrompt}\n${instruction}`
                                : instruction;
                              setCustomAiPrompt(newPrompt);
                            }}
                            className="px-2 py-1 text-xs bg-emerald-500 text-white rounded hover:bg-emerald-600 transition-colors duration-200"
                          >
                            Add
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end mt-8 pt-6 border-t border-emerald-200/60">
                  <button
                    onClick={() => setShowAiSettings(false)}
                    className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-2xl hover:from-emerald-600 hover:to-green-700 transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                  >
                    Save Settings
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Batch Progress Section */}
        <div className="relative bg-gradient-to-br from-white via-blue-50/50 to-indigo-50/50 backdrop-blur-xl rounded-2xl shadow-xl border border-blue-200/50 p-6 mb-6 overflow-hidden">
          {/* Background Decorations */}
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-blue-100/40 to-indigo-100/40 rounded-full -translate-y-8 translate-x-8"></div>
          <div className="absolute bottom-0 left-0 w-12 h-12 bg-gradient-to-tr from-indigo-100/40 to-blue-100/40 rounded-full translate-y-6 -translate-x-6"></div>
          
          <div className="relative z-10 space-y-4">

              {/* Batch Progress Indicator */}
              {batchProgress && (
                <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-blue-800">Batch Processing</h3>
                        <p className="text-sm text-blue-600">
                          Processing {batchProgress.totalWords} words in {batchProgress.totalBatches} batches
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-800">
                        {Math.round((batchProgress.processedWords / batchProgress.totalWords) * 100)}%
                      </div>
                      <div className="text-sm text-blue-600">
                        {batchProgress.processedWords} / {batchProgress.totalWords} words
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-blue-200 rounded-full h-3 mb-3">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${(batchProgress.processedWords / batchProgress.totalWords) * 100}%` }}
                    ></div>
                  </div>
                  
                  {/* Batch Status */}
                  <div className="flex items-center justify-between text-sm text-blue-700">
                    <span>Batch {batchProgress.currentBatch} of {batchProgress.totalBatches}</span>
                    <span>~{Math.ceil((batchProgress.totalWords - batchProgress.processedWords) / 25)} batches remaining</span>
                  </div>
                  
                  {/* Current Batch Words */}
                  <div className="mt-3 p-3 bg-blue-100 rounded-lg">
                    <div className="text-xs font-semibold text-blue-800 mb-2">Current Batch Words:</div>
                    <div className="text-xs text-blue-700">
                      {batchProgress.processedWords > 0 && (
                        <span className="text-green-600">✓ {batchProgress.processedWords} completed</span>
                      )}
                      {batchProgress.processedWords > 0 && batchProgress.totalWords > batchProgress.processedWords && (
                        <span className="mx-2">•</span>
                      )}
                      {batchProgress.totalWords > batchProgress.processedWords && (
                        <span className="text-blue-600">
                          Processing {Math.min(25, batchProgress.totalWords - batchProgress.processedWords)} more...
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            
            {/* Info Text */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                🤖 <strong>AI Translation Generator:</strong> Enter words in <span className="font-semibold text-blue-600">{language1}</span> and AI will generate <span className="font-semibold text-blue-600">{language2}</span> translations automatically
              </p>
            </div>
          </div>
        </div>

        {/* AI Prompt Modal */}
        {showPromptModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-xl">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">AI Prompt Used</h3>
                    <p className="text-sm text-gray-600">The exact prompt sent to the AI for translation</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPromptModal(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {lastUsedPrompt ? (
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900">Full Prompt</h4>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(lastUsedPrompt);
                            // You could add a toast notification here
                          }}
                          className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                        >
                          Copy
                        </button>
                      </div>
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono bg-white p-4 rounded-lg border overflow-x-auto">
                        {lastUsedPrompt}
                      </pre>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-blue-50 rounded-xl p-4">
                        <h5 className="font-semibold text-blue-900 mb-2">Prompt Length</h5>
                        <p className="text-blue-700">{lastUsedPrompt.length} characters</p>
                      </div>
                      <div className="bg-green-50 rounded-xl p-4">
                        <h5 className="font-semibold text-green-900 mb-2">Estimated Tokens</h5>
                        <p className="text-green-700">~{Math.ceil(lastUsedPrompt.length / 4)} tokens</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">No Prompt Available</h4>
                    <p className="text-gray-600">Generate translations first to see the AI prompt used.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Info Modal */}
        {showInfoModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-800 to-indigo-800 bg-clip-text text-transparent">
                      Add Words Page Features
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">Complete guide to all available features</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowInfoModal(false)}
                  className="p-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all duration-200 group"
                >
                  <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[70vh]">
                <div className="space-y-6">
                  {/* Getting Started */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                    <h4 className="text-xl font-bold text-blue-800 mb-4 flex items-center">
                      <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Getting Started
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="space-y-2">
                        <div className="flex items-start space-x-2">
                          <span className="text-blue-600 font-bold text-lg">1.</span>
                          <span className="text-blue-700">Select your source and target languages from the dropdowns</span>
                        </div>
                        <div className="flex items-start space-x-2">
                          <span className="text-blue-600 font-bold text-lg">2.</span>
                          <span className="text-blue-700">Choose a separator or create a custom one (max 5 characters)</span>
                        </div>
                        <div className="flex items-start space-x-2">
                          <span className="text-blue-600 font-bold text-lg">3.</span>
                          <span className="text-blue-700">Enter words in the format: <code className="bg-blue-100 px-2 py-1 rounded text-xs font-mono">{language1} Word {separator} {language2} Word</code></span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-start space-x-2">
                          <span className="text-blue-600 font-bold text-lg">4.</span>
                          <span className="text-blue-700">Use Live Translation for instant AI suggestions</span>
                        </div>
                        <div className="flex items-start space-x-2">
                          <span className="text-blue-600 font-bold text-lg">5.</span>
                          <span className="text-blue-700">Generate AI translations for multiple words at once</span>
                        </div>
                        <div className="flex items-start space-x-2">
                          <span className="text-blue-600 font-bold text-lg">6.</span>
                          <span className="text-blue-700">Preview and add words to your word set</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Language Selection */}
                  <div className="bg-emerald-50 rounded-xl p-5 border border-emerald-200">
                    <h4 className="text-lg font-semibold text-emerald-800 mb-3 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                      </svg>
                      Language Selection
                    </h4>
                    <p className="text-emerald-700 text-sm mb-2">Choose your source and target languages from the dropdown menus. The system supports 100+ languages with native language names and flags.</p>
                    <div className="text-xs text-emerald-600 bg-emerald-100 px-3 py-2 rounded">
                      💡 <strong>Tip:</strong> You can change languages anytime and the format will update automatically.
                    </div>
                  </div>

                  {/* Separator Customization */}
                  <div className="bg-purple-50 rounded-xl p-5 border border-purple-200">
                    <h4 className="text-lg font-semibold text-purple-800 mb-3 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                      </svg>
                      Custom Separator
                    </h4>
                    <p className="text-purple-700 text-sm mb-2">Select from predefined separators (like " - ", " | ", " → ") or create your own custom separator up to 5 characters long.</p>
                    <div className="text-xs text-purple-600 bg-purple-100 px-3 py-2 rounded">
                      💡 <strong>Examples:</strong> " - ", " | ", " → ", " = ", " :: "
                    </div>
                  </div>

                  {/* Live Translation */}
                  <div className="bg-green-50 rounded-xl p-5 border border-green-200">
                    <h4 className="text-lg font-semibold text-green-800 mb-3 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Live Translation Mode
                    </h4>
                    <p className="text-green-700 text-sm mb-2">Type a word and press Enter to get instant AI translation suggestions. You can select from up to 3 alternatives or edit the main translation before adding it to your list.</p>
                    <div className="text-xs text-green-600 bg-green-100 px-3 py-2 rounded">
                      ⚡ <strong>Quick:</strong> Press Enter twice to automatically accept the main translation.
                    </div>
                  </div>

                  {/* AI Translation Generator */}
                  <div className="bg-orange-50 rounded-xl p-5 border border-orange-200">
                    <h4 className="text-lg font-semibold text-orange-800 mb-3 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      AI Translation Generator
                    </h4>
                    <p className="text-orange-700 text-sm mb-2">Generate translations for multiple words at once using advanced AI. For lists over 25 words, the system automatically processes them in batches with real-time progress tracking.</p>
                    <div className="text-xs text-orange-600 bg-orange-100 px-3 py-2 rounded">
                      🚀 <strong>Batch Processing:</strong> Large word lists are automatically split into 25-word batches for optimal performance.
                    </div>
                  </div>

                  {/* Custom AI Instructions */}
                  <div className="bg-indigo-50 rounded-xl p-5 border border-indigo-200">
                    <h4 className="text-lg font-semibold text-indigo-800 mb-3 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Custom AI Instructions
                    </h4>
                    <p className="text-indigo-700 text-sm mb-2">Customize how AI generates translations with specific instructions. Add example sentences, pronunciation guides, formal language preferences, or grammatical information.</p>
                    <div className="text-xs text-indigo-600 bg-indigo-100 px-3 py-2 rounded">
                      🎯 <strong>Examples:</strong> "Add example sentences", "Use formal language", "Include pronunciation guides"
                    </div>
                  </div>

                  {/* Preview & Add */}
                  <div className="bg-pink-50 rounded-xl p-5 border border-pink-200">
                    <h4 className="text-lg font-semibold text-pink-800 mb-3 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Preview & Add Words
                    </h4>
                    <p className="text-pink-700 text-sm mb-2">Use the "Show Preview" button to see how your words will be parsed before adding them to your word set. Review translations and make adjustments as needed.</p>
                    <div className="text-xs text-pink-600 bg-pink-100 px-3 py-2 rounded">
                      ✅ <strong>Validation:</strong> Invalid entries (missing one side) will be automatically ignored.
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end p-6 border-t border-gray-200">
                <button
                  onClick={() => setShowInfoModal(false)}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                >
                  Got it!
                </button>
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
    </div>
  );
};

export default AddWords;