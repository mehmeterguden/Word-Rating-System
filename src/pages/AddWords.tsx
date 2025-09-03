import React, { useState, useEffect } from 'react';
import { WordSet } from '../types';
import { LANGUAGES, getLanguageByName } from '../utils/languages';

interface AddWordsProps {
  onAddWords: (wordPairs: { text1: string; text2: string }[]) => void;
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
  
  // Dropdown states
  const [showLang1Dropdown, setShowLang1Dropdown] = useState(false);
  const [showLang2Dropdown, setShowLang2Dropdown] = useState(false);
  const [searchLang1, setSearchLang1] = useState('');
  const [searchLang2, setSearchLang2] = useState('');

  const activeSet = wordSets.find(set => set.id === activeSetId);

  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.language-dropdown')) {
        setShowLang1Dropdown(false);
        setShowLang2Dropdown(false);
      }
    };

    if (showLang1Dropdown || showLang2Dropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLang1Dropdown, showLang2Dropdown]);

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
        onAddWords(validWords);
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
      return LANGUAGES; // Show all languages when no search term
    }
    return LANGUAGES.filter(lang => 
      lang.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lang.nativeName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const getLanguageDisplay = (langName: string) => {
    const lang = LANGUAGES.find(l => l.name === langName);
    return lang ? `${lang.name} (${lang.nativeName})` : langName;
  };

  const getLanguageFlag = (langName: string) => {
    const lang = LANGUAGES.find(l => l.name === langName);
    if (!lang) return '🌐';
    
    const flagMap: { [key: string]: string } = {
      'English': '🇺🇸',
      'Turkish': '🇹🇷',
      'Spanish': '🇪🇸',
      'French': '🇫🇷',
      'German': '🇩🇪',
      'Italian': '🇮🇹',
      'Portuguese': '🇵🇹',
      'Russian': '🇷🇺',
      'Japanese': '🇯🇵',
      'Korean': '🇰🇷',
      'Chinese': '🇨🇳',
      'Arabic': '🇸🇦',
      'Hindi': '🇮🇳',
      'Dutch': '🇳🇱',
      'Swedish': '🇸🇪',
      'Danish': '🇩🇰',
      'Norwegian': '🇳🇴',
      'Finnish': '🇫🇮',
      'Polish': '🇵🇱',
      'Czech': '🇨🇿',
      'Slovak': '🇸🇰',
      'Hungarian': '🇭🇺',
      'Romanian': '🇷🇴',
      'Bulgarian': '🇧🇬',
      'Croatian': '🇭🇷',
      'Serbian': '🇷🇸',
      'Slovenian': '🇸🇮',
      'Estonian': '🇪🇪',
      'Latvian': '🇱🇻',
      'Lithuanian': '🇱🇹',
      'Greek': '🇬🇷',
      'Hebrew': '🇮🇱',
      'Thai': '🇹🇭',
      'Vietnamese': '🇻🇳',
      'Indonesian': '🇮🇩',
      'Malay': '🇲🇾',
      'Persian': '🇮🇷',
      'Urdu': '🇵🇰',
      'Bengali': '🇧🇩',
      'Tamil': '🇮🇳',
      'Telugu': '🇮🇳',
      'Malayalam': '🇮🇳',
      'Kannada': '🇮🇳',
      'Gujarati': '🇮🇳',
      'Punjabi': '🇮🇳',
      'Marathi': '🇮🇳',
      'Nepali': '🇳🇵',
      'Sinhala': '🇱🇰',
      'Burmese': '🇲🇲',
      'Khmer': '🇰🇭',
      'Lao': '🇱🇦',
      'Mongolian': '🇲🇳',
      'Georgian': '🇬🇪',
      'Amharic': '🇪🇹',
      'Swahili': '🇹🇿',
      'Zulu': '🇿🇦',
      'Afrikaans': '🇿🇦',
      'Icelandic': '🇮🇸',
      'Maltese': '🇲🇹',
      'Welsh': '🇬🇧',
      'Irish': '🇮🇪',
      'Basque': '🇪🇸',
      'Catalan': '🇪🇸',
      'Galician': '🇪🇸',
      'Albanian': '🇦🇱',
      'Macedonian': '🇲🇰',
      'Bosnian': '🇧🇦',
      'Montenegrin': '🇲🇪',
      'Azerbaijan': '🇦🇿'
    };
    
    return flagMap[langName] || '🌐';
  };

  const separatorExamples = [
    { symbol: '-', name: 'Dash', example: 'hello - merhaba' },
    { symbol: '|', name: 'Pipe', example: 'hello | merhaba' },
    { symbol: '=', name: 'Equals', example: 'hello = merhaba' },
    { symbol: ':', name: 'Colon', example: 'hello : merhaba' },
    { symbol: '→', name: 'Arrow', example: 'hello → merhaba' }
  ];

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-8">
          <div className="text-center">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold mb-3">Add Bilingual Words</h1>
            <p className="text-xl text-blue-100">
              Add words in two languages with custom separator
            </p>
          </div>
        </div>

        <div className="p-8">
          {/* Active Set Info */}
          {activeSet && (
            <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Active Set: {activeSet.name}</h3>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>Languages: {activeSet.language1} ↔ {activeSet.language2}</span>
                <span>Separator: "{activeSet.separator}"</span>
                <span>Words: {activeSet.wordCount}</span>
              </div>
            </div>
          )}

          {/* Language Settings */}
          <div className="mb-8 p-8 bg-gradient-to-r from-slate-50 to-gray-50 rounded-3xl border border-gray-200 shadow-lg">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <svg className="w-6 h-6 text-blue-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
              Language Settings
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* First Language */}
              <div className="space-y-4">
                <label className="block text-lg font-semibold text-gray-700 mb-3">
                  First Language
                </label>
                                 <div className="relative language-dropdown">
                   <button
                     onClick={() => setShowLang1Dropdown(!showLang1Dropdown)}
                     className="w-full px-6 py-4 bg-white border-2 border-gray-300 rounded-2xl hover:border-blue-400 focus:border-blue-500 transition-all duration-200 text-left flex items-center justify-between shadow-sm"
                   >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{getLanguageFlag(language1)}</span>
                      <span className="font-medium text-gray-800">{getLanguageDisplay(language1)}</span>
                    </div>
                    <svg className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${showLang1Dropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                                     {showLang1Dropdown && (
                     <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-gray-300 rounded-2xl shadow-xl z-50 max-h-96 overflow-hidden">
                       <div className="p-4 border-b border-gray-200">
                         <input
                           type="text"
                           placeholder="Search languages..."
                           value={searchLang1}
                           onChange={(e) => setSearchLang1(e.target.value)}
                           className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                           autoFocus
                         />
                       </div>
                       <div className="max-h-80 overflow-y-auto">
                        {getFilteredLanguages(searchLang1).map((lang) => (
                          <button
                            key={lang.code}
                            onClick={() => {
                              setLanguage1(lang.name);
                              setShowLang1Dropdown(false);
                              setSearchLang1('');
                            }}
                            className="w-full px-6 py-4 text-left hover:bg-blue-50 transition-colors duration-200 flex items-center space-x-3"
                          >
                            <span className="text-xl">{getLanguageFlag(lang.name)}</span>
                            <div>
                              <div className="font-medium text-gray-800">{lang.name}</div>
                              <div className="text-sm text-gray-500">{lang.nativeName}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Second Language */}
              <div className="space-y-4">
                <label className="block text-lg font-semibold text-gray-700 mb-3">
                  Second Language
                </label>
                                 <div className="relative language-dropdown">
                   <button
                     onClick={() => setShowLang2Dropdown(!showLang2Dropdown)}
                     className="w-full px-6 py-4 bg-white border-2 border-gray-300 rounded-2xl hover:border-blue-400 focus:border-blue-500 transition-all duration-200 text-left flex items-center justify-between shadow-sm"
                   >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{getLanguageFlag(language2)}</span>
                      <span className="font-medium text-gray-800">{getLanguageDisplay(language2)}</span>
                    </div>
                    <svg className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${showLang2Dropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                                     {showLang2Dropdown && (
                     <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-gray-300 rounded-2xl shadow-xl z-50 max-h-96 overflow-hidden">
                       <div className="p-4 border-b border-gray-200">
                         <input
                           type="text"
                           placeholder="Search languages..."
                           value={searchLang2}
                           onChange={(e) => setSearchLang2(e.target.value)}
                           className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                           autoFocus
                         />
                       </div>
                       <div className="max-h-80 overflow-y-auto">
                        {getFilteredLanguages(searchLang2).map((lang) => (
                          <button
                            key={lang.code}
                            onClick={() => {
                              setLanguage2(lang.name);
                              setShowLang2Dropdown(false);
                              setSearchLang2('');
                            }}
                            className="w-full px-6 py-4 text-left hover:bg-blue-50 transition-colors duration-200 flex items-center space-x-3"
                          >
                            <span className="text-xl">{getLanguageFlag(lang.name)}</span>
                            <div>
                              <div className="font-medium text-gray-800">{lang.name}</div>
                              <div className="text-sm text-gray-500">{lang.nativeName}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Separator Section */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <label className="block text-lg font-semibold text-gray-700 mb-3">
                Separator Character
              </label>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {separatorExamples.map((sep, index) => (
                  <button
                    key={index}
                    onClick={() => setSeparator(sep.symbol)}
                    className={`px-4 py-2 rounded-xl border-2 transition-all duration-200 hover:scale-105 ${
                      separator === sep.symbol
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className={`text-lg font-bold ${
                        separator === sep.symbol ? 'text-blue-600' : 'text-gray-600'
                      }`}>
                        {sep.symbol}
                      </span>
                      <span className="text-sm text-gray-600">
                        {sep.name}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Separator
                </label>
                <input
                  type="text"
                  value={separator}
                  onChange={(e) => setSeparator(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-mono"
                  maxLength={3}
                  placeholder="Enter custom separator..."
                />
              </div>
            </div>
          </div>

          {/* Input Area */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Word Input Format: <span className="text-blue-600 font-mono">{language1} {separator} {language2}</span>
              </h3>
              <button
                onClick={handlePreview}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 font-medium"
              >
                {showPreview ? 'Hide Preview' : 'Show Preview'}
              </button>
            </div>
            
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Enter words in format:\nhello ${separator} merhaba\nworld ${separator} dünya\ncomputer ${separator} bilgisayar`}
              className="w-full h-64 px-6 py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg resize-none"
            />
            
            <div className="mt-2 text-sm text-gray-500">
              Each line should contain: <span className="font-medium font-mono">{language1} {separator} {language2}</span>
            </div>
          </div>

          {/* Preview */}
          {showPreview && previewWords.length > 0 && (
            <div className="mb-8 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Preview ({previewWords.length} words)
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-64 overflow-y-auto">
                {previewWords.map((word, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-xl border-2 ${
                      word.text1 && word.text2
                        ? 'border-green-300 bg-green-50'
                        : 'border-red-300 bg-red-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600">{language1}:</span>
                      <span className={`text-sm ${word.text1 ? 'text-green-600' : 'text-red-600'}`}>
                        {word.text1 || 'Missing'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">{language2}:</span>
                      <span className={`text-sm ${word.text2 ? 'text-green-600' : 'text-red-600'}`}>
                        {word.text2 || 'Missing'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 text-sm text-gray-600">
                <span className="text-green-600 font-medium">
                  {previewWords.filter(w => w.text1 && w.text2).length}
                </span> valid words,{' '}
                <span className="text-red-600 font-medium">
                  {previewWords.filter(w => !w.text1 || !w.text2).length}
                </span> invalid entries
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button
              onClick={handleAddWords}
              disabled={!inputText.trim() || previewWords.filter(w => w.text1 && w.text2).length === 0}
              className="flex-1 px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl"
            >
              Add {previewWords.filter(w => w.text1 && w.text2).length} Words
            </button>
            
            <button
              onClick={() => setInputText('')}
              className="px-8 py-4 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all duration-200 font-semibold text-lg"
            >
              Clear
            </button>
          </div>

          {/* Instructions */}
          <div className="mt-8 p-6 bg-blue-50 rounded-2xl border border-blue-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">How to use:</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div>• Each line should contain two words separated by "{separator}"</div>
              <div>• Left side: {language1} word</div>
              <div>• Right side: {language2} word</div>
              <div>• Use the preview button to see how your words will be parsed</div>
              <div>• Invalid entries (missing one side) will be ignored</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddWords;
