import React, { useState, useEffect, useRef } from 'react';
import { generateWordTranslations } from '../utils/wordTranslation';
import { getLanguageByName } from '../utils/languages';

interface WordTranslationModalProps {
  word: string;
  sourceLanguage: string;
  targetLanguage: string;
  isOpen: boolean;
  onClose: () => void;
  onAddToWordList?: (word: string, translation: string) => void;
}

interface TranslationResult {
  translation: string;
  alternatives: string[];
  confidence: 'high' | 'medium' | 'low';
}

const WordTranslationModal: React.FC<WordTranslationModalProps> = ({
  word,
  sourceLanguage,
  targetLanguage,
  isOpen,
  onClose,
  onAddToWordList
}) => {
  const [translation, setTranslation] = useState<TranslationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTranslation, setSelectedTranslation] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

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
      // Stop any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      const langCode = getLanguageCode(language);
      utterance.lang = langCode;
      
      // Get saved voice preference from cookies/localStorage
      const voiceKey = `tts-voice-${langCode}`;
      let preferredVoiceName: string | null = null;
      try {
        preferredVoiceName = localStorage.getItem(voiceKey);
      } catch (err) {
        console.warn('Could not access localStorage for voice preference');
      }
      
      // Set voice based on saved preference or fallback
      const voices = window.speechSynthesis.getVoices();
      let targetVoice: SpeechSynthesisVoice | undefined;
      
      if (preferredVoiceName) {
        // Use saved voice preference
        targetVoice = voices.find(voice => voice.name === preferredVoiceName);
      }
      
      if (!targetVoice) {
        // Fallback: find default voice for language
        targetVoice = voices.find(voice => 
          voice.lang === langCode && voice.default
        ) || voices.find(voice => 
          voice.lang.startsWith(langCode.split('-')[0])
        );
      }
      
      if (targetVoice) {
        utterance.voice = targetVoice;
      }
      
      // Set speech parameters
      utterance.rate = 0.9; // Slightly slower for better understanding
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      // Speak the text
      window.speechSynthesis.speak(utterance);
    } else {
      console.warn('Speech synthesis not supported');
    }
  };

  // Load translation when modal opens
  useEffect(() => {
    if (isOpen && word) {
      loadTranslation();
    }
  }, [isOpen, word, sourceLanguage, targetLanguage]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTranslation(null);
      setSelectedTranslation('');
      setError(null);
      setLoading(false);
    }
  }, [isOpen]);

  // Load translation
  const loadTranslation = async () => {
    if (!word.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await generateWordTranslations({
        words: [word.trim()],
        sourceLanguageName: sourceLanguage,
        targetLanguageName: targetLanguage,
        separator: '-',
        customInstructions: ''
      });

      if (result.translations && result.translations.length > 0) {
        const translationData = result.translations[0];
        setTranslation({
          translation: translationData.translation,
          alternatives: translationData.alternatives || [],
          confidence: translationData.confidence || 'medium'
        });
        setSelectedTranslation(translationData.translation);
      } else {
        setError('No translation found for this word');
      }
    } catch (err) {
      console.error('Translation error:', err);
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
      await onAddToWordList(word, selectedTranslation);
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
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div 
        ref={modalRef}
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold">Word Translation</h2>
                <p className="text-blue-100 text-sm">{sourceLanguage} → {targetLanguage}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Word Display */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <h3 className="text-2xl font-bold text-gray-900">{word}</h3>
              <button
                onClick={() => speakText(word, sourceLanguage)}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                title={`Listen to "${word}" in ${sourceLanguage}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              </button>
            </div>
            <div className="text-sm text-gray-500">
              Source: {sourceLanguage} | Target: {targetLanguage}
            </div>
          </div>

          {/* Translation Content */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-4 animate-pulse">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-200 to-indigo-200 rounded-full flex items-center justify-center animate-spin">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                  </svg>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Loading translation...</h3>
              <p className="text-gray-500">Translating "{word}" from {sourceLanguage} to {targetLanguage}</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-orange-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Translation Error</h3>
              <p className="text-gray-500 mb-6 text-center">{error}</p>
              <button
                onClick={loadTranslation}
                className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : translation ? (
            <div className="space-y-6">
              {/* Main Translation */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-100 text-green-700 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-semibold text-green-800">Main Translation</h4>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    translation.confidence === 'high' ? 'bg-green-100 text-green-800' :
                    translation.confidence === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {translation.confidence === 'high' ? '🟢 High' : 
                     translation.confidence === 'medium' ? '🟡 Medium' : '🔴 Low'} Confidence
                  </span>
                </div>
                
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={selectedTranslation}
                    onChange={(e) => setSelectedTranslation(e.target.value)}
                    className="flex-1 p-3 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 font-medium"
                    placeholder="Translation..."
                  />
                  <button
                    onClick={() => speakText(selectedTranslation, targetLanguage)}
                    className="p-3 rounded-lg bg-green-100 hover:bg-green-200 text-green-700 transition-colors"
                    title={`Listen to "${selectedTranslation}" in ${targetLanguage}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Alternative Translations */}
              {translation.alternatives.length > 0 && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-semibold text-blue-800">Alternative Translations</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-2">
                    {translation.alternatives.slice(0, 5).map((alternative, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedTranslation(alternative)}
                        className={`p-3 rounded-lg text-left transition-all duration-200 ${
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
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                {onAddToWordList && (
                  <button
                    data-add-button
                    onClick={handleAddToWordList}
                    disabled={!selectedTranslation.trim() || isAdding}
                    className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                        Add to Word List
                      </>
                    )}
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
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

export default WordTranslationModal;
