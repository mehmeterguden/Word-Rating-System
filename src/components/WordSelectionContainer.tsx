import React, { useState, useEffect, useRef } from 'react';
import { generateWordTranslations } from '../utils/wordTranslation';
import { TranslationResult } from '../types';

interface WordSelectionContainerProps {
  selectedWord: string;
  position: { x: number; y: number };
  isVisible: boolean;
  onClose: () => void;
  onAddToWordList?: (word: string, translation: string) => void;
  sourceLanguage?: string;
  targetLanguage?: string;
}


const WordSelectionContainer: React.FC<WordSelectionContainerProps> = ({
  selectedWord,
  position,
  isVisible,
  onClose,
  onAddToWordList,
  sourceLanguage = 'English',
  targetLanguage = 'Turkish'
}) => {
  const [translation, setTranslation] = useState<TranslationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTranslation, setSelectedTranslation] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Get language code for TTS
  const getLanguageCode = (languageName: string): string => {
    const languageMap: { [key: string]: string } = {
      'English': 'en-US',
      'Turkish': 'tr-TR',
      'Spanish': 'es-ES',
      'French': 'fr-FR',
      'German': 'de-DE',
      'Italian': 'it-IT',
      'Portuguese': 'pt-PT',
      'Russian': 'ru-RU',
      'Japanese': 'ja-JP',
      'Korean': 'ko-KR',
      'Chinese': 'zh-CN',
      'Arabic': 'ar-SA',
      'Hindi': 'hi-IN',
      'Dutch': 'nl-NL',
      'Swedish': 'sv-SE',
      'Norwegian': 'nb-NO',
      'Danish': 'da-DK',
      'Finnish': 'fi-FI',
      'Polish': 'pl-PL',
      'Czech': 'cs-CZ',
      'Hungarian': 'hu-HU',
      'Romanian': 'ro-RO',
      'Bulgarian': 'bg-BG',
      'Croatian': 'hr-HR',
      'Serbian': 'sr-RS',
      'Slovak': 'sk-SK',
      'Slovenian': 'sl-SI',
      'Estonian': 'et-EE',
      'Latvian': 'lv-LV',
      'Lithuanian': 'lt-LT',
      'Greek': 'el-GR',
      'Hebrew': 'he-IL',
      'Thai': 'th-TH',
      'Vietnamese': 'vi-VN',
      'Indonesian': 'id-ID',
      'Malay': 'ms-MY',
      'Filipino': 'fil-PH'
    };
    
    return languageMap[languageName] || 'en-US';
  };

  // Text-to-speech function with saved voice preference
  const speakText = (text: string, language: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      const langCode = getLanguageCode(language);
      utterance.lang = langCode;
      
      const voiceKey = `tts-voice-${langCode}`;
      let preferredVoiceName: string | null = null;
      try {
        preferredVoiceName = localStorage.getItem(voiceKey);
      } catch (err) {
        console.warn('Could not access localStorage for voice preference');
      }
      
      const voices = window.speechSynthesis.getVoices();
      let targetVoice: SpeechSynthesisVoice | undefined;
      
      if (preferredVoiceName) {
        targetVoice = voices.find(voice => voice.name === preferredVoiceName);
      }
      
      if (!targetVoice) {
        targetVoice = voices.find(voice => 
          voice.lang === langCode && voice.default
        ) || voices.find(voice => 
          voice.lang.startsWith(langCode.split('-')[0])
        );
      }
      
      if (targetVoice) {
        utterance.voice = targetVoice;
      }
      
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      window.speechSynthesis.speak(utterance);
    } else {
      console.warn('Speech synthesis not supported');
    }
  };

  // Load translation when word changes (container opens after 1 second delay from textSelectionManager)
  useEffect(() => {
    if (selectedWord && isVisible) {
      // Start loading immediately when container opens
      setLoading(true);
      setError(null);
      setTranslation(null);
      setSelectedTranslation('');
      
      // Load translation immediately since container only opens after 1 second delay
      console.log('🔄 Loading translation for:', selectedWord);
      loadTranslation();
    }
  }, [selectedWord, isVisible, sourceLanguage, targetLanguage]);

  // Reset state when container closes
  useEffect(() => {
    if (!isVisible) {
      setTranslation(null);
      setSelectedTranslation('');
      setError(null);
      setLoading(false);
    }
  }, [isVisible]);

  // Load translation
  const loadTranslation = async () => {
    if (!selectedWord.trim()) return;
    
    try {
      console.log('🔄 Loading translation for:', selectedWord);
      
      const result = await generateWordTranslations({
        words: [selectedWord.trim()],
        sourceLanguageName: sourceLanguage,
        targetLanguageName: targetLanguage,
        separator: '-',
        customInstructions: ''
      });

      if (result.translations && result.translations.length > 0) {
        const translationData = result.translations[0];
        console.log('✅ Translation loaded:', translationData);
        
        // Log translation success to terminal
        console.log(`\n🎉 Translation Success for "${selectedWord}"`);
        console.log(`📝 Original: ${selectedWord}`);
        console.log(`🔄 Translation: ${translationData.translation}`);
        console.log(`🎯 Confidence: ${translationData.confidence}`);
        console.log(`📋 Alternatives: ${translationData.alternatives?.length || 0} options`);
        console.log('🎉 ======================================\n');
        
        setTranslation({
          originalWord: selectedWord,
          translation: translationData.translation,
          alternatives: translationData.alternatives || [],
          confidence: translationData.confidence || 'medium'
        });
        setSelectedTranslation(translationData.translation);
      } else {
        console.log('❌ No translation found');
        setError('No translation found for this word');
      }
    } catch (err) {
      console.error('❌ Translation error:', err);
      setError('Failed to load translation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle adding to word list
  const handleAddToWordList = async () => {
    if (!selectedTranslation.trim() || !onAddToWordList) return;
    
    setIsAdding(true);
    try {
      await onAddToWordList(selectedWord, selectedTranslation);
      // Show success feedback
      const button = document.querySelector('[data-add-button]') as HTMLButtonElement;
      if (button) {
        const originalText = button.textContent;
        button.textContent = '✓ Added!';
        button.classList.add('bg-green-500', 'hover:bg-green-600');
        button.classList.remove('bg-blue-500', 'hover:bg-blue-600');
        
        setTimeout(() => {
          button.textContent = originalText;
          button.classList.remove('bg-green-500', 'hover:bg-green-600');
          button.classList.add('bg-blue-500', 'hover:bg-blue-600');
        }, 2000);
      }
    } catch (err) {
      console.error('Error adding to word list:', err);
    } finally {
      setIsAdding(false);
    }
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isVisible) {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isVisible, onClose]);

  // Calculate position to keep container in viewport
  const getContainerPosition = () => {
    const containerWidth = 400; // Approximate container width
    const containerHeight = 300; // Approximate container height
    const padding = 20;

    let x = position.x;
    let y = position.y;

    // Adjust horizontal position if container would go off-screen
    if (x + containerWidth > window.innerWidth - padding) {
      x = window.innerWidth - containerWidth - padding;
    }
    if (x < padding) {
      x = padding;
    }

    // Adjust vertical position if container would go off-screen
    if (y + containerHeight > window.innerHeight - padding) {
      y = position.y - containerHeight - 10; // Show above selection
    }
    if (y < padding) {
      y = padding;
    }

    return { x, y };
  };

  if (!isVisible) return null;

  const containerPosition = getContainerPosition();

  return (
    <div
      ref={containerRef}
      data-word-selection-container
      className="fixed z-50 transition-all duration-200 ease-out"
      style={{
        left: `${containerPosition.x}px`,
        top: `${containerPosition.y}px`,
        transform: 'translateY(-10px)',
        opacity: isVisible ? 1 : 0,
        pointerEvents: isVisible ? 'auto' : 'none'
      }}
    >
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-lg w-[28rem] overflow-hidden backdrop-blur-sm bg-white/95">
        {/* Header */}
        <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white p-5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/30">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold">Word Translation</h3>
                  <p className="text-blue-100 text-sm font-medium">{sourceLanguage} → {targetLanguage}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-all duration-200 backdrop-blur-sm border border-white/20"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Word Display */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <h4 className="text-2xl font-bold text-gray-900">{selectedWord}</h4>
              <button
                onClick={() => speakText(selectedWord, sourceLanguage)}
                className="p-2 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 hover:from-blue-200 hover:to-indigo-200 text-blue-600 transition-all duration-200 shadow-sm hover:shadow-md"
                title={`Listen to "${selectedWord}" in ${sourceLanguage}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Translation Content */}
          {loading ? (
            <div className="space-y-4">
              {/* Loading State - Show word with loading indicator */}
              <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border border-blue-200 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 rounded-xl flex items-center justify-center shadow-sm">
                      <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </div>
                    <h5 className="text-base font-semibold text-blue-800">Loading Translation...</h5>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={selectedWord}
                    disabled
                    className="flex-1 p-3 border-2 border-blue-200 rounded-xl bg-blue-50 text-gray-900 font-medium text-sm shadow-sm"
                    placeholder="Loading..."
                  />
                  <button
                    disabled
                    className="p-3 rounded-xl bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-400 cursor-not-allowed shadow-sm"
                    title="Loading translation..."
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    </svg>
                  </button>
                </div>
                
                <div className="mt-2 text-xs text-blue-600 text-center">
                  Getting translation for "{selectedWord}" from {sourceLanguage} to {targetLanguage}...
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                <button
                  disabled
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-400 rounded-xl cursor-not-allowed flex items-center justify-center gap-2 text-sm font-medium shadow-sm"
                >
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Loading...
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-3 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl hover:from-gray-200 hover:to-gray-300 transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md"
                >
                  Close
                </button>
              </div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-6">
              <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-orange-100 rounded-full flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <p className="text-sm text-gray-500 mb-3 text-center">{error}</p>
              <button
                onClick={loadTranslation}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
              >
                Try Again
              </button>
            </div>
          ) : translation ? (
            <div className="space-y-4">
              {/* Main Translation */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 rounded-xl flex items-center justify-center shadow-sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h5 className="text-base font-semibold text-green-800">Translation</h5>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      translation.confidence === 'high' ? 'bg-green-100 text-green-800' :
                      translation.confidence === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {translation.confidence === 'high' ? '🟢 High' : 
                       translation.confidence === 'medium' ? '🟡 Medium' : '🔴 Low'}
                    </span>
                    {translation.frequency && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                        {translation.frequency}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={selectedTranslation}
                    onChange={(e) => setSelectedTranslation(e.target.value)}
                    className="flex-1 p-3 border-2 border-green-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 font-medium text-sm shadow-sm"
                    placeholder="Translation..."
                  />
                  <button
                    onClick={() => speakText(selectedTranslation, targetLanguage)}
                    className="p-3 rounded-xl bg-gradient-to-r from-green-100 to-emerald-100 hover:from-green-200 hover:to-emerald-200 text-green-700 transition-all duration-200 shadow-sm hover:shadow-md"
                    title={`Listen to "${selectedTranslation}" in ${targetLanguage}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Word Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Etymology */}
                {translation.etymology && (
                  <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-3 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-purple-100 text-purple-700 rounded-lg flex items-center justify-center">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                      <h6 className="text-sm font-semibold text-purple-800">Etymology</h6>
                    </div>
                    <p className="text-xs text-purple-700 leading-relaxed">{translation.etymology}</p>
                  </div>
                )}

                {/* Pronunciation */}
                {translation.pronunciation && (
                  <div className="bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200 rounded-xl p-3 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-orange-100 text-orange-700 rounded-lg flex items-center justify-center">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                        </svg>
                      </div>
                      <h6 className="text-sm font-semibold text-orange-800">Pronunciation</h6>
                    </div>
                    <p className="text-xs text-orange-700 font-mono">{translation.pronunciation}</p>
                  </div>
                )}

                {/* Part of Speech */}
                {translation.partOfSpeech && (
                  <div className="bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-200 rounded-xl p-3 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-teal-100 text-teal-700 rounded-lg flex items-center justify-center">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                      </div>
                      <h6 className="text-sm font-semibold text-teal-800">Part of Speech</h6>
                    </div>
                    <p className="text-xs text-teal-700">{translation.partOfSpeech}</p>
                  </div>
                )}

                {/* Formality Level */}
                {translation.formalityLevel && (
                  <div className="bg-gradient-to-br from-pink-50 to-rose-50 border border-pink-200 rounded-xl p-3 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-pink-100 text-pink-700 rounded-lg flex items-center justify-center">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h6 className="text-sm font-semibold text-pink-800">Formality</h6>
                    </div>
                    <p className="text-xs text-pink-700 capitalize">{translation.formalityLevel}</p>
                  </div>
                )}
              </div>

              {/* Usage Context */}
              {translation.usageContext && (
                <div className="bg-gradient-to-br from-slate-50 to-gray-50 border border-slate-200 rounded-xl p-3 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-slate-100 text-slate-700 rounded-lg flex items-center justify-center">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h6 className="text-sm font-semibold text-slate-800">Usage Context</h6>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">{translation.usageContext}</p>
                </div>
              )}

              {/* Examples */}
              {translation.examples && translation.examples.length > 0 && (
                <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-3 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 bg-amber-100 text-amber-700 rounded-lg flex items-center justify-center">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h6 className="text-sm font-semibold text-amber-800">Examples</h6>
                  </div>
                  <div className="space-y-2">
                    {translation.examples.map((example, index) => (
                      <div key={index} className="bg-white/50 rounded-lg p-2 border border-amber-100">
                        <p className="text-xs text-amber-800 font-medium mb-1">{example.sentence}</p>
                        <p className="text-xs text-amber-700 mb-1">{example.translation}</p>
                        {example.context && (
                          <p className="text-xs text-amber-600 italic">{example.context}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Synonyms */}
              {translation.synonyms && translation.synonyms.length > 0 && (
                <div className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-3 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-emerald-100 text-emerald-700 rounded-lg flex items-center justify-center">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>
                    <h6 className="text-sm font-semibold text-emerald-800">Synonyms</h6>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {translation.synonyms.map((synonym, index) => (
                      <span key={index} className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-medium">
                        {synonym}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Cultural Notes */}
              {translation.culturalNotes && (
                <div className="bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-200 rounded-xl p-3 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-violet-100 text-violet-700 rounded-lg flex items-center justify-center">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                      </svg>
                    </div>
                    <h6 className="text-sm font-semibold text-violet-800">Cultural Notes</h6>
                  </div>
                  <p className="text-xs text-violet-700 leading-relaxed">{translation.culturalNotes}</p>
                </div>
              )}

              {/* Alternative Translations */}
              {translation.alternatives && translation.alternatives.length > 0 && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center gap-1 mb-2">
                    <div className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <h5 className="text-sm font-semibold text-blue-800">Alternatives</h5>
                  </div>
                  
                  <div className="space-y-1">
                    {translation.alternatives.slice(0, 3).map((alternative, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedTranslation(alternative)}
                        className={`w-full p-2 rounded-lg text-left transition-all duration-200 text-sm ${
                          selectedTranslation === alternative
                            ? 'bg-blue-500 text-white shadow-md'
                            : 'bg-white text-gray-700 hover:bg-blue-100 border border-blue-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{alternative}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              speakText(alternative, targetLanguage);
                            }}
                            className={`p-1 rounded-full transition-colors ${
                              selectedTranslation === alternative
                                ? 'text-white hover:bg-blue-600'
                                : 'text-gray-500 hover:bg-blue-200'
                            }`}
                            title={`Listen to "${alternative}" in ${targetLanguage}`}
                          >
                            <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                            </svg>
                          </button>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
                {onAddToWordList && (
                  <button
                    data-add-button
                    onClick={handleAddToWordList}
                    disabled={!selectedTranslation.trim() || isAdding}
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 text-sm"
                  >
                    {isAdding ? (
                      <>
                        <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Adding...
                      </>
                    ) : (
                      <>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Add to List
                      </>
                    )}
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default WordSelectionContainer;
