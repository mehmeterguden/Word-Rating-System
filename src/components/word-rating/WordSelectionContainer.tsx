import React, { useState, useEffect, useRef, useCallback } from 'react';
import { generateWordTranslations } from '../../utils/word-rating/wordTranslation';
import { TranslationResult } from '../../types/word-rating';
// import { getLanguageByName } from '../../utils/word-rating/languages'; // We might need to migrate languages utility if it exists or use a simpler map
import { Volume2, Loader2, AlertCircle, RefreshCw, X, Check, Globe } from 'lucide-react';

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

    // Helper to map language names to codes (simplified version if utility not available)
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
            'Chinese': 'zh-CN',
            'Japanese': 'ja-JP',
            'Korean': 'ko-KR',
            'Arabic': 'ar-SA',
            'Hindi': 'hi-IN',
            'Dutch': 'nl-NL',
            // Add more as needed
        };
        return languageMap[languageName] || 'en-US';
    };

    // Text-to-speech function
    const speakText = (text: string, language: string) => {
        try {
            if (typeof window === 'undefined') return;

            const synth = window.speechSynthesis;
            if (!synth) return;
            synth.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            const langCode = getLanguageCode(language);
            utterance.lang = langCode;

            // Optimize for longer texts
            utterance.rate = 0.8;
            utterance.pitch = 1.0;
            utterance.volume = 1.0;

            // Add natural pauses for better readability
            utterance.text = text.replace(/[.!?]/g, '$& ');

            const voices = synth.getVoices();
            // Try to find a voice that matches
            let chosenVoice = voices.find(v => v.lang === langCode) ||
                voices.find(v => v.lang.startsWith(langCode.split('-')[0]));

            if (chosenVoice) {
                utterance.voice = chosenVoice;
            }

            synth.speak(utterance);
        } catch (e) {
            console.warn('Speech synthesis not supported or failed', e);
        }
    };

    // Load translation with caching
    const loadTranslation = useCallback(async () => {
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

                const translationResult: TranslationResult = {
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
    }, [selectedWord, sourceLanguage, targetLanguage]);

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
    }, [selectedWord, isVisible, sourceLanguage, targetLanguage, loadTranslation]);

    // Reset state when container closes
    useEffect(() => {
        if (!isVisible) {
            setTranslation(null);
            setSelectedTranslation('');
            setError(null);
            setLoading(false);
        }
    }, [isVisible]);

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
                // In React we typically handle this with state, but keeping logic similar to original for now
                // Or better, use a local state for "added" status
            }
        } catch (err) {
            console.error('Error adding to word list:', err);
        } finally {
            setIsAdding(false);
        }
    };

    const handleAlternativeSelect = (alternative: string) => {
        if (translation && translation.alternatives) {
            const currentMainTranslation = translation.translation;
            const newAlternatives = translation.alternatives.map(alt =>
                alt === alternative ? currentMainTranslation : alt
            );

            setTranslation({
                ...translation,
                translation: alternative,
                alternatives: newAlternatives
            });

            setSelectedTranslation(alternative);
        }
    };

    const handleTranslationClick = () => {
        setIsEditingTranslation(true);
        setEditingText(selectedTranslation);
    };

    const handleTranslationSave = () => {
        if (translation && translation.alternatives) {
            const currentMainTranslation = translation.translation;
            const newAlternatives = translation.alternatives.map(alt =>
                alt === currentMainTranslation ? editingText : alt
            );

            setTranslation({
                ...translation,
                translation: editingText,
                alternatives: newAlternatives
            });

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

        if (typeof window !== 'undefined') {
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
        }

        return { x, y };
    };

    if (!isVisible) return null;

    const containerPosition = getContainerPosition();

    return (
        <div
            ref={containerRef}
            data-word-selection-container
            className="fixed z-[100] transition-all duration-300 ease-out"
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

            <div className="relative bg-gradient-to-br from-white via-blue-50/50 to-indigo-50/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-blue-200/50 max-w-lg w-[25rem] overflow-hidden text-left">

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
                                <Volume2 className="w-4 h-4" />
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
                                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                                <span className="text-sm font-medium text-slate-600">Loading...</span>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="text-center py-4">
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <AlertCircle className="w-4 h-4 text-red-500" />
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
                                                <Check className="w-3 h-3" />
                                            </button>
                                            <button
                                                onClick={handleTranslationCancel}
                                                className="p-1 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-all duration-200"
                                                title="Cancel"
                                            >
                                                <X className="w-3 h-3" />
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
                                                <Volume2 className="w-4 h-4" />
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
                                                className={`flex-1 p-2.5 rounded-xl text-center transition-all duration-200 text-sm font-medium ${selectedTranslation === alternative
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
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Adding...
                                            </>
                                        ) : (
                                            <>
                                                <Check className="w-4 h-4" />
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
