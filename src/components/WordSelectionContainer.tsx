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
      const containerWidth = 400; // Wider container width (25rem)
      const containerHeight = 160; // Reduced height
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
      className="fixed z-50 transition-all duration-300 ease-out"
      style={{
        left: `${containerPosition.x}px`,
        top: `${containerPosition.y}px`,
        transform: isVisible ? 'translateY(0px) scale(1)' : 'translateY(-20px) scale(0.95)',
        opacity: isVisible ? 1 : 0,
        pointerEvents: isVisible ? 'auto' : 'none'
      }}
    >
      {/* Backdrop blur overlay */}
      <div className="absolute inset-0 bg-black/5 backdrop-blur-sm rounded-3xl"></div>
      
      <div className="relative bg-gradient-to-br from-white via-blue-50/50 to-indigo-50/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-blue-200/50 max-w-lg w-[25rem] overflow-hidden">

        {/* Content */}
        <div className="p-4">
          {/* Source Word */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-indigo-800 bg-clip-text text-transparent">{selectedWord}</h2>
              <button
                onClick={() => speakText(selectedWord, sourceLanguage)}
                className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 hover:scale-105 shadow-lg"
                title={`Listen to "${selectedWord}" in ${sourceLanguage}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              </button>
            </div>
            <span className="text-sm text-slate-600 bg-gradient-to-r from-blue-50 to-indigo-50 px-3 py-1.5 rounded-full border border-blue-200 font-medium">{sourceLanguage}</span>
          </div>
          
          {/* Divider */}
          <div className="mb-3">
            <div className="w-full border-t border-blue-200"></div>
          </div>

          {/* Translation Content */}
          {loading ? (
            <div className="text-center py-4">
              <div className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="text-sm font-medium text-slate-600">Loading...</span>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span className="text-sm font-medium text-red-600">Error</span>
              </div>
              <button
                onClick={loadTranslation}
                className="px-4 py-2 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl hover:from-red-600 hover:to-rose-700 transition-all duration-200 text-sm font-medium shadow-lg hover:shadow-xl"
              >
                Try Again
              </button>
            </div>
          ) : translation ? (
            <div className="space-y-3">
              {/* Main Translation */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-bold bg-gradient-to-r from-slate-800 to-indigo-800 bg-clip-text text-transparent">{selectedTranslation}</h3>
                  <button
                    onClick={() => speakText(selectedTranslation, targetLanguage)}
                    className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 hover:scale-105 shadow-lg"
                    title={`Listen to "${selectedTranslation}" in ${targetLanguage}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    </svg>
                  </button>
                </div>
                <span className="text-sm text-slate-600 bg-gradient-to-r from-blue-50 to-indigo-50 px-3 py-1.5 rounded-full border border-blue-200 font-medium">{targetLanguage}</span>
              </div>

              {/* Alternative Translations */}
              {translation.alternatives && translation.alternatives.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-slate-500 text-center">Alternatives</h4>
                  <div className="flex gap-2">
                    {translation.alternatives.slice(0, 3).map((alternative, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedTranslation(alternative)}
                        className={`flex-1 p-2.5 rounded-xl text-center transition-all duration-200 text-sm font-medium ${
                          selectedTranslation === alternative
                            ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg transform scale-105'
                            : 'bg-gradient-to-r from-blue-50 to-indigo-50 text-slate-700 hover:from-blue-100 hover:to-indigo-100 hover:text-blue-700 hover:shadow-md border border-blue-200'
                        }`}
                      >
                        {alternative}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {onAddToWordList && (
                <div className="pt-3">
                  <button
                    data-add-button
                    onClick={handleAddToWordList}
                    disabled={!selectedTranslation.trim() || isAdding}
                    className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm font-bold shadow-lg hover:shadow-xl hover:scale-105 disabled:hover:scale-100"
                  >
                    {isAdding ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Adding...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Add to List
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default WordSelectionContainer;
