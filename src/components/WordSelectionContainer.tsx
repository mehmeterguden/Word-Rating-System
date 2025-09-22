import React, { useState, useEffect, useRef } from 'react';
import { generateWordTranslations } from '../utils/wordTranslation';
import { TranslationResult } from '../types';
import { getLanguageByName } from '../utils/languages';

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
  const [isEditingTranslation, setIsEditingTranslation] = useState(false);
  const [editingText, setEditingText] = useState<string>('');
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Simple cache for translations
  const translationCache = useRef<Map<string, TranslationResult>>(new Map());


  // Resolve language code from display name (same as EvaluationModal)
  const resolveLangCode = (languageName?: string): string | undefined => {
    if (!languageName) return undefined;
    const match = getLanguageByName(languageName);
    return match?.code;
  };

  // Text-to-speech function with accent support (same as EvaluationModal)
  const speakText = (text: string, language: string) => {
    try {
      const synth = (window as any).speechSynthesis as SpeechSynthesis | undefined;
      if (!synth) return;
      synth.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      const langCode = resolveLangCode(language) || 'en';
      utterance.lang = langCode === 'en' ? 'en-US' : langCode;
      
      // Choose voice: saved per-language preference > lang match > fallback
      const voices = synth.getVoices?.() || [];
      const voiceKey = `tts-voice-${langCode}`;
      let preferredName: string | null = null;
      try { 
        preferredName = localStorage.getItem(voiceKey); 
      } catch {}
      
      let chosen: SpeechSynthesisVoice | undefined = preferredName ? 
        voices.find(v => v.name === preferredName) : undefined;
      
      if (!chosen) {
        chosen = voices.find(v => v.lang?.toLowerCase().startsWith(langCode));
      }
      
      if (!chosen) {
        chosen = voices[0];
      }
      
      if (chosen) {
        utterance.voice = chosen;
        console.log(`🎵 Using voice: ${chosen.name} (${chosen.lang}) for ${language}`);
      } else {
        console.warn(`⚠️ No suitable voice found for ${language} (${langCode})`);
      }
      
      // Optimize for longer texts
      utterance.rate = 0.7; // Slower for better comprehension of longer texts
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      // Add natural pauses for better readability
      utterance.text = text.replace(/[.!?]/g, '$& '); // Add space after punctuation
      
      synth.speak(utterance);
    } catch {
      // No-op on unsupported environments
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

  // Load translation with caching
  const loadTranslation = async () => {
    if (!selectedWord.trim()) return;
    
    // Create cache key
    const cacheKey = `${selectedWord.trim()}-${sourceLanguage}-${targetLanguage}`;
    
    // Check cache first
    const cachedTranslation = translationCache.current.get(cacheKey);
    if (cachedTranslation) {
      console.log('⚡ Using cached translation for:', selectedWord);
      setTranslation(cachedTranslation);
      setSelectedTranslation(cachedTranslation.translation);
      setLoading(false);
      return;
    }
    
    try {
      console.log('🔄 Loading translation for:', selectedWord);
      
      const result = await generateWordTranslations({
        words: [selectedWord.trim()],
        sourceLanguageName: sourceLanguage,
        targetLanguageName: targetLanguage,
        separator: '-',
        customInstructions: 'Provide complete and natural translations. Do not break down into individual words. Translate the entire phrase or sentence as a whole unit with full meaning and context. For alternatives, provide exactly 3 different contextual meanings or semantic variations of the word/phrase. Each alternative should be a complete, natural translation without any explanations in parentheses. Focus on different semantic meanings, not synonyms. Examples: "run" alternatives should be "koşmak", "çalıştırmak", "akmak" - clean translations without parentheses.'
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
        
        const translationResult = {
          originalWord: selectedWord,
          translation: translationData.translation,
          alternatives: translationData.alternatives || [],
          confidence: translationData.confidence || 'medium'
        };
        
        // Cache the translation
        translationCache.current.set(cacheKey, translationResult);
        
        setTranslation(translationResult);
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

  const handleAlternativeSelect = (alternative: string) => {
    if (translation && translation.alternatives) {
      // Get current main translation
      const currentMainTranslation = translation.translation;
      
      // Create new alternatives array: replace selected alternative with current main translation
      // This preserves the order of alternatives
      const newAlternatives = translation.alternatives.map(alt => 
        alt === alternative ? currentMainTranslation : alt
      );
      
      // Update translation object: swap main translation with selected alternative
      setTranslation({
        ...translation,
        translation: alternative,
        alternatives: newAlternatives
      });
      
      // Update selected translation
      setSelectedTranslation(alternative);
    }
  };

  const handleTranslationClick = () => {
    setIsEditingTranslation(true);
    setEditingText(selectedTranslation);
  };

  const handleTranslationSave = () => {
    if (translation && translation.alternatives) {
      // Get current main translation
      const currentMainTranslation = translation.translation;
      
      // Create new alternatives array: replace current main translation with edited text
      const newAlternatives = translation.alternatives.map(alt => 
        alt === currentMainTranslation ? editingText : alt
      );
      
      // Update translation object
      setTranslation({
        ...translation,
        translation: editingText,
        alternatives: newAlternatives
      });
      
      // Update selected translation
      setSelectedTranslation(editingText);
    }
    setIsEditingTranslation(false);
  };

  const handleTranslationCancel = () => {
    setIsEditingTranslation(false);
    setEditingText('');
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
                  {isEditingTranslation ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        className="text-lg font-bold bg-gradient-to-r from-slate-800 to-indigo-800 bg-clip-text text-transparent border border-blue-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleTranslationSave();
                          } else if (e.key === 'Escape') {
                            handleTranslationCancel();
                          }
                        }}
                      />
                      <button
                        onClick={handleTranslationSave}
                        className="p-1 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-all duration-200"
                        title="Save"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                      <button
                        onClick={handleTranslationCancel}
                        className="p-1 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-all duration-200"
                        title="Cancel"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <>
                      <h3 
                        className="text-lg font-bold bg-gradient-to-r from-slate-800 to-indigo-800 bg-clip-text text-transparent cursor-pointer hover:opacity-80 transition-all duration-200"
                        onClick={handleTranslationClick}
                        title="Click to edit"
                      >
                        {selectedTranslation}
                      </h3>
                      <button
                        onClick={() => speakText(selectedTranslation, targetLanguage)}
                        className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 hover:scale-105 shadow-lg"
                        title={`Listen to "${selectedTranslation}" in ${targetLanguage}`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                        </svg>
                      </button>
                    </>
                  )}
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
                        onClick={() => handleAlternativeSelect(alternative)}
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
