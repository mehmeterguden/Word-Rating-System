import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { LANGUAGES, getUniqueLanguages } from '../utils/languages';
import { Page } from '../types';

interface SettingsProps {
  setDeveloperMode: (enabled: boolean) => void;
}

const AI_LANG_KEY = 'word-rating-system-ai-language';
const DEV_MODE_KEY = 'word-rating-system-developer-mode';
const AI_MODEL_KEY = 'word-rating-system-ai-model';
const IMAGE_API_KEY = 'word-rating-system-image-api-preference';

// Available AI models
const AI_MODELS = [
  { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite', description: 'Medium speed, good quality' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', description: 'Slower, high quality' },
  { id: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash Lite', description: 'Fastest, good for daily use' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', description: 'Fast, better quality' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', description: 'Slowest, best quality' },
];

const Settings: React.FC<SettingsProps> = ({ setDeveloperMode }) => {
  const [aiLanguage, setAiLanguage] = useState<string>(() => {
    try {
      return localStorage.getItem(AI_LANG_KEY) || 'English';
    } catch {
      return 'English';
    }
  });

  const [developerMode, setLocalDeveloperMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem(DEV_MODE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [selectedAiModel, setSelectedAiModel] = useState<string>(() => {
    try {
      return localStorage.getItem(AI_MODEL_KEY) || 'gemini-2.5-flash-lite';
    } catch {
      return 'gemini-2.5-flash-lite';
    }
  });

  const [imageApiPreference, setImageApiPreference] = useState<string>(() => {
    try {
      return localStorage.getItem(IMAGE_API_KEY) || 'auto';
    } catch {
      return 'auto';
    }
  });

  // Dropdown states
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [searchLanguage, setSearchLanguage] = useState('');
  const [selectedLanguageIndex, setSelectedLanguageIndex] = useState(-1);
  
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [searchModel, setSearchModel] = useState('');
  const [selectedModelIndex, setSelectedModelIndex] = useState(-1);

  // Refs for dropdown
  const languageDropdownRef = useRef<HTMLDivElement>(null);
  const languageSearchRef = useRef<HTMLInputElement>(null);
  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const modelSearchRef = useRef<HTMLInputElement>(null);

  // Dropdown positions for portal rendering
  const [languageDropdownPosition, setLanguageDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const [modelDropdownPosition, setModelDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    try { localStorage.setItem(AI_LANG_KEY, aiLanguage); } catch {}
  }, [aiLanguage]);

  useEffect(() => {
    try { 
      localStorage.setItem(DEV_MODE_KEY, developerMode.toString()); 
      setDeveloperMode(developerMode);
    } catch {}
  }, [developerMode, setDeveloperMode]);

  useEffect(() => {
    try { localStorage.setItem(AI_MODEL_KEY, selectedAiModel); } catch {}
  }, [selectedAiModel]);

  useEffect(() => {
    try { localStorage.setItem(IMAGE_API_KEY, imageApiPreference); } catch {}
  }, [imageApiPreference]);

  // Update dropdown positions on scroll and resize
  useEffect(() => {
    const updatePositions = () => {
      if (showLanguageDropdown) {
        updateLanguageDropdownPosition();
      }
      if (showModelDropdown) {
        updateModelDropdownPosition();
      }
    };

    window.addEventListener('scroll', updatePositions);
    window.addEventListener('resize', updatePositions);

    return () => {
      window.removeEventListener('scroll', updatePositions);
      window.removeEventListener('resize', updatePositions);
    };
  }, [showLanguageDropdown, showModelDropdown]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.language-dropdown')) {
        setShowLanguageDropdown(false);
        setSearchLanguage('');
        setSelectedLanguageIndex(-1);
      }
      
      if (!target.closest('.model-dropdown')) {
        setShowModelDropdown(false);
        setSearchModel('');
        setSelectedModelIndex(-1);
      }
    };

    if (showLanguageDropdown || showModelDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLanguageDropdown, showModelDropdown]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (showLanguageDropdown) {
        handleLanguageKeyDown(event);
      } else if (showModelDropdown) {
        handleModelKeyDown(event);
      }
    };

    if (showLanguageDropdown || showModelDropdown) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showLanguageDropdown, showModelDropdown, searchLanguage, searchModel]);

  const handleLanguageKeyDown = (event: KeyboardEvent) => {
    const filteredLanguages = getFilteredLanguages(searchLanguage);
    
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setSelectedLanguageIndex(prev => 
          prev < filteredLanguages.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        event.preventDefault();
        setSelectedLanguageIndex(prev => 
          prev > 0 ? prev - 1 : filteredLanguages.length - 1
        );
        break;
      case 'Enter':
        event.preventDefault();
        if (selectedLanguageIndex >= 0 && selectedLanguageIndex < filteredLanguages.length) {
          const selectedLang = filteredLanguages[selectedLanguageIndex];
          setAiLanguage(selectedLang.name);
          setShowLanguageDropdown(false);
          setSearchLanguage('');
          setSelectedLanguageIndex(-1);
        }
        break;
      case 'Escape':
        setShowLanguageDropdown(false);
        setSearchLanguage('');
        setSelectedLanguageIndex(-1);
        break;
    }
  };

  const handleModelKeyDown = (event: KeyboardEvent) => {
    const filteredModels = getFilteredModels(searchModel);
    
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setSelectedModelIndex(prev => 
          prev < filteredModels.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        event.preventDefault();
        setSelectedModelIndex(prev => 
          prev > 0 ? prev - 1 : filteredModels.length - 1
        );
        break;
      case 'Enter':
        event.preventDefault();
        if (selectedModelIndex >= 0 && selectedModelIndex < filteredModels.length) {
          const selectedModel = filteredModels[selectedModelIndex];
          setSelectedAiModel(selectedModel.id);
          setShowModelDropdown(false);
          setSearchModel('');
          setSelectedModelIndex(-1);
        }
        break;
      case 'Escape':
        setShowModelDropdown(false);
        setSearchModel('');
        setSelectedModelIndex(-1);
        break;
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

  const getFilteredModels = (searchTerm: string) => {
    if (!searchTerm.trim()) {
      return AI_MODELS;
    }
    
    return AI_MODELS.filter(model => 
      model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      model.description.toLowerCase().includes(searchTerm.toLowerCase())
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

  const updateLanguageDropdownPosition = () => {
    if (languageDropdownRef.current) {
      const rect = languageDropdownRef.current.getBoundingClientRect();
      setLanguageDropdownPosition({
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width
      });
    }
  };

  const handleLanguageDropdownToggle = () => {
    if (showLanguageDropdown) {
      setShowLanguageDropdown(false);
      setSearchLanguage('');
      setSelectedLanguageIndex(-1);
    } else {
      updateLanguageDropdownPosition();
      setShowLanguageDropdown(true);
      // Focus the search input after a short delay
      setTimeout(() => {
        languageSearchRef.current?.focus();
      }, 100);
    }
  };

  const handleLanguageSelect = (lang: any) => {
    setAiLanguage(lang.name);
    setShowLanguageDropdown(false);
    setSearchLanguage('');
    setSelectedLanguageIndex(-1);
  };

  const updateModelDropdownPosition = () => {
    if (modelDropdownRef.current) {
      const rect = modelDropdownRef.current.getBoundingClientRect();
      setModelDropdownPosition({
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width
      });
    }
  };

  const handleModelDropdownToggle = () => {
    if (showModelDropdown) {
      setShowModelDropdown(false);
      setSearchModel('');
      setSelectedModelIndex(-1);
    } else {
      updateModelDropdownPosition();
      setShowModelDropdown(true);
      // Focus the search input after a short delay
      setTimeout(() => {
        modelSearchRef.current?.focus();
      }, 100);
    }
  };

  const handleModelSelect = (model: any) => {
    setSelectedAiModel(model.id);
    setShowModelDropdown(false);
    setSearchModel('');
    setSelectedModelIndex(-1);
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-800 to-indigo-800 bg-clip-text text-transparent mb-2">
              Settings
            </h1>
            <p className="text-slate-600 text-lg mb-4">
              Configure your AI preferences and application settings
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-gradient-to-br from-white via-blue-50/50 to-indigo-50/50 backdrop-blur-xl rounded-2xl shadow-xl border border-blue-200/50 p-8 overflow-visible">

        <div className="space-y-8">
          <div className="p-5 rounded-2xl bg-white/80 backdrop-blur ring-1 ring-slate-200 shadow-sm overflow-visible">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-800">AI answer language</div>
                  <div className="text-xs text-slate-500">Choose the language for AI analysis responses</div>
                </div>
              </div>
              <span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs">Current: {aiLanguage}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="relative language-dropdown" ref={languageDropdownRef}>
                <button
                  onClick={handleLanguageDropdownToggle}
                  className="w-full px-4 py-3 bg-white/90 border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-100 text-slate-800 text-left flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">{getLanguageFlag(aiLanguage)}</span>
                    <span className="font-medium">{getLanguageDisplay(aiLanguage)}</span>
                  </div>
                  <svg className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${showLanguageDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                  </svg>
                </button>
                
                {showLanguageDropdown && createPortal(
                  <div 
                    className="fixed bg-white border-2 border-slate-200 rounded-xl shadow-xl z-[99999] max-h-96 overflow-hidden"
                    style={{
                      top: languageDropdownPosition.top,
                      left: languageDropdownPosition.left,
                      width: languageDropdownPosition.width
                    }}
                  >
                    <div className="p-4 border-b border-slate-200">
                      <input
                        ref={languageSearchRef}
                        type="text"
                        placeholder="Search languages..."
                        value={searchLanguage}
                        onChange={(e) => {
                          setSearchLanguage(e.target.value);
                          setSelectedLanguageIndex(-1);
                        }}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {getFilteredLanguages(searchLanguage).map((lang, index) => (
                        <button
                          key={lang.code}
                          onClick={() => handleLanguageSelect(lang)}
                          className={`w-full px-6 py-4 text-left transition-colors duration-200 flex items-center space-x-3 ${
                            index === selectedLanguageIndex 
                              ? 'bg-blue-100 border-l-4 border-blue-500' 
                              : 'hover:bg-blue-50'
                          }`}
                        >
                          <span className="text-xl">{getLanguageFlag(lang.name)}</span>
                          <div>
                            <div className="font-medium text-slate-800">{lang.name}</div>
                            <div className="text-sm text-slate-500">{lang.nativeName}</div>
                          </div>
                        </button>
                      ))}
                      {getFilteredLanguages(searchLanguage).length === 0 && (
                        <div className="px-6 py-4 text-slate-500 text-center">
                          No languages found matching "{searchLanguage}"
                        </div>
                      )}
                    </div>
                  </div>,
                  document.body
                )}
              </div>
              <div className="flex items-center">
                <p className="text-xs text-slate-500">Default is English. You can change it anytime.</p>
              </div>
            </div>
          </div>

          {/* AI Model Selection Section */}
          <div className="p-5 rounded-2xl bg-white/80 backdrop-blur ring-1 ring-slate-200 shadow-sm overflow-visible">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-green-100 text-green-700 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-800">AI Model Selection</div>
                  <div className="text-xs text-slate-500">Choose the AI model for translations and evaluations</div>
                </div>
              </div>
              <span className="px-2 py-1 rounded-lg bg-green-100 text-green-700 text-xs font-medium">
                {AI_MODELS.find(m => m.id === selectedAiModel)?.name || 'Default'}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="relative model-dropdown" ref={modelDropdownRef}>
                <button
                  onClick={handleModelDropdownToggle}
                  className="w-full px-4 py-3 text-left bg-white border border-slate-200 rounded-xl hover:border-green-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 rounded-lg bg-green-100 text-green-700 flex items-center justify-center">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-medium text-slate-800">
                        {AI_MODELS.find(m => m.id === selectedAiModel)?.name || 'Select Model'}
                      </div>
                      <div className="text-xs text-slate-500">
                        {AI_MODELS.find(m => m.id === selectedAiModel)?.description || 'Choose AI model'}
                      </div>
                    </div>
                  </div>
                  <svg className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${showModelDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {showModelDropdown && createPortal(
                  <div 
                    className="fixed bg-white border border-slate-200 rounded-xl shadow-lg z-[99999] max-h-64 overflow-hidden"
                    style={{
                      top: modelDropdownPosition.top,
                      left: modelDropdownPosition.left,
                      width: modelDropdownPosition.width
                    }}
                  >
                    <div className="p-3 border-b border-slate-100">
                      <input
                        ref={modelSearchRef}
                        type="text"
                        placeholder="Search models..."
                        value={searchModel}
                        onChange={(e) => {
                          setSearchModel(e.target.value);
                          setSelectedModelIndex(-1);
                        }}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {getFilteredModels(searchModel).map((model, index) => (
                        <button
                          key={model.id}
                          onClick={() => handleModelSelect(model)}
                          className={`w-full px-6 py-4 text-left transition-colors duration-200 flex items-center space-x-3 ${
                            index === selectedModelIndex 
                              ? 'bg-green-100 border-l-4 border-green-500' 
                              : 'hover:bg-green-50'
                          }`}
                        >
                          <div className="w-6 h-6 rounded-lg bg-green-100 text-green-700 flex items-center justify-center">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div>
                            <div className="font-medium text-slate-800">{model.name}</div>
                            <div className="text-sm text-slate-500">{model.description}</div>
                          </div>
                        </button>
                      ))}
                      {getFilteredModels(searchModel).length === 0 && (
                        <div className="px-6 py-4 text-slate-500 text-center">
                          No models found matching "{searchModel}"
                        </div>
                      )}
                    </div>
                  </div>,
                  document.body
                )}
              </div>
              <div className="flex items-center">
                <p className="text-xs text-slate-500">Faster models may have lower quality. Slower models provide better results.</p>
              </div>
            </div>
          </div>

          {/* Image API Preference Section */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-50 ring-1 ring-purple-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-100 to-indigo-100 text-purple-700 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-800">Image API Preference</div>
                  <div className="text-xs text-slate-500">Choose which API to prioritize for word images</div>
                </div>
              </div>
              <span className="px-2 py-1 rounded-lg bg-purple-100 text-purple-700 text-xs font-medium">
                {imageApiPreference === 'auto' ? 'Auto' : imageApiPreference === 'unsplash' ? 'Unsplash' : 'Pixabay'}
              </span>
            </div>
            
            <div className="space-y-4">
              {/* Auto Mode */}
              <div className="flex items-start space-x-3 p-4 rounded-xl bg-white/60 border border-slate-200 hover:bg-white/80 transition-colors">
                <input
                  type="radio"
                  id="auto"
                  name="imageApi"
                  value="auto"
                  checked={imageApiPreference === 'auto'}
                  onChange={(e) => setImageApiPreference(e.target.value)}
                  className="mt-1 w-4 h-4 text-purple-600 border-slate-300 focus:ring-purple-500"
                />
                <div className="flex-1">
                  <label htmlFor="auto" className="block text-sm font-medium text-slate-800 cursor-pointer">
                    Auto (Recommended)
                  </label>
                  <p className="text-xs text-slate-600 mt-1">
                    Automatically choose the best available API. Uses Unsplash first, falls back to Pixabay if needed.
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      Unsplash: 50/day
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      Pixabay: 5000/day
                    </span>
                  </div>
                </div>
              </div>

              {/* Unsplash Only */}
              <div className="flex items-start space-x-3 p-4 rounded-xl bg-white/60 border border-slate-200 hover:bg-white/80 transition-colors">
                <input
                  type="radio"
                  id="unsplash"
                  name="imageApi"
                  value="unsplash"
                  checked={imageApiPreference === 'unsplash'}
                  onChange={(e) => setImageApiPreference(e.target.value)}
                  className="mt-1 w-4 h-4 text-purple-600 border-slate-300 focus:ring-purple-500"
                />
                <div className="flex-1">
                  <label htmlFor="unsplash" className="block text-sm font-medium text-slate-800 cursor-pointer">
                    Unsplash Only
                  </label>
                  <p className="text-xs text-slate-600 mt-1">
                    Use only Unsplash API. Higher quality images but limited to 50 requests per day.
                  </p>
                  <div className="flex items-center gap-1 mt-2 text-xs text-slate-500">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span>50 requests/day • High quality • Professional photos</span>
                  </div>
                </div>
              </div>

              {/* Pixabay Only */}
              <div className="flex items-start space-x-3 p-4 rounded-xl bg-white/60 border border-slate-200 hover:bg-white/80 transition-colors">
                <input
                  type="radio"
                  id="pixabay"
                  name="imageApi"
                  value="pixabay"
                  checked={imageApiPreference === 'pixabay'}
                  onChange={(e) => setImageApiPreference(e.target.value)}
                  className="mt-1 w-4 h-4 text-purple-600 border-slate-300 focus:ring-purple-500"
                />
                <div className="flex-1">
                  <label htmlFor="pixabay" className="block text-sm font-medium text-slate-800 cursor-pointer">
                    Pixabay Only
                  </label>
                  <p className="text-xs text-slate-600 mt-1">
                    Use only Pixabay API. More requests available but may have lower quality images.
                  </p>
                  <div className="flex items-center gap-1 mt-2 text-xs text-slate-500">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span>5000 requests/day • Good quality • Diverse content</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Developer Mode Section */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 ring-1 ring-purple-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 text-purple-700 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-800">Developer Mode</div>
                  <div className="text-xs text-slate-500">Access advanced debugging and data management tools</div>
                </div>
              </div>
              <span className="px-2 py-1 rounded-lg bg-purple-100 text-purple-700 text-xs font-medium">Advanced</span>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <p className="text-xs text-slate-600">Enable developer mode to access advanced debugging tools</p>
                  <div className="flex items-center">
                    <button
                      onClick={() => setLocalDeveloperMode(!developerMode)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                        developerMode ? 'bg-purple-600' : 'bg-slate-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          developerMode ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <span className="ml-2 text-xs font-medium text-slate-700">
                      {developerMode ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>
              </div>
              
              {developerMode && (
                <div className="flex items-center justify-between pt-2 border-t border-purple-200">
                  <p className="text-xs text-slate-600">View and manage localStorage data, debug application state, and access development tools.</p>
                  <button
                    onClick={() => window.location.href = '/debug'}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-sm hover:shadow-md font-medium text-sm"
                  >
                    Open Debug Panel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;


