import React, { useState, useEffect, useRef } from 'react';
import { generateWordTranslations } from '../../utils/word-rating/wordTranslation';
import { TranslationResult } from '../../types/word-rating';
import { Volume2, Loader2, AlertCircle, Check, X, Globe, MessageCircle } from 'lucide-react';

interface WordDetailModalProps {
    word: string;
    sourceLanguage: string;
    targetLanguage: string;
    isOpen: boolean;
    onClose: () => void;
    onAddToWordList?: (word: string, translation: string) => void;
}

const WordDetailModal: React.FC<WordDetailModalProps> = ({
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

    // Helper to map language names to codes
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
            // Add more as needed
        };

        return languageMap[languageName] || 'en-US';
    };

    // Text-to-speech function
    const speakText = (text: string, language: string) => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            const langCode = getLanguageCode(language);
            utterance.lang = langCode;

            const voices = window.speechSynthesis.getVoices();
            let targetVoice = voices.find(voice => voice.lang === langCode) ||
                voices.find(voice => voice.lang.startsWith(langCode.split('-')[0]));

            if (targetVoice) {
                utterance.voice = targetVoice;
            }

            utterance.rate = 0.9;
            utterance.pitch = 1.0;
            utterance.volume = 1.0;

            window.speechSynthesis.speak(utterance);
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
                    originalWord: translationData.originalWord,
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
            // Success feedback handled by parent or local state if needed (using button text change like original)
            const button = document.querySelector('[data-add-button]') as HTMLButtonElement;
            if (button) {
                const originalText = button.textContent;
                // Just simulate visual feedback as we don't have direct DOM manipulation in React usually in this way
                // But for migration loyalty we can keep it or use state.
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
            <div
                ref={modalRef}
                className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                <Globe className="w-5 h-5" />
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
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto">
                    {/* Word Display */}
                    <div className="mb-6">
                        <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-2xl font-bold text-gray-900">{word}</h3>
                            <button
                                onClick={() => speakText(word, sourceLanguage)}
                                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                                title={`Listen to "${word}" in ${sourceLanguage}`}
                            >
                                <Volume2 className="w-4 h-4" />
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
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-200 to-indigo-200 rounded-full flex items-center justify-center">
                                    <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                                </div>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">Loading translation...</h3>
                            <p className="text-gray-500">Translating "{word}" from {sourceLanguage} to {targetLanguage}</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-orange-100 rounded-full flex items-center justify-center mb-4">
                                <AlertCircle className="w-8 h-8 text-red-500" />
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
                                            <Check className="w-4 h-4" />
                                        </div>
                                        <h4 className="text-lg font-semibold text-green-800">Main Translation</h4>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${translation.confidence === 'high' ? 'bg-green-100 text-green-800' :
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
                                        <Volume2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Alternative Translations */}
                            {translation.alternatives.length > 0 && (
                                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center">
                                            <MessageCircle className="w-4 h-4" />
                                        </div>
                                        <h4 className="text-lg font-semibold text-blue-800">Alternative Translations</h4>
                                    </div>

                                    <div className="grid grid-cols-1 gap-2">
                                        {translation.alternatives.slice(0, 5).map((alternative, index) => (
                                            <button
                                                key={index}
                                                onClick={() => setSelectedTranslation(alternative)}
                                                className={`p-3 rounded-lg text-left transition-all duration-200 ${selectedTranslation === alternative
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
                                                        className={`p-1 rounded-full transition-colors ${selectedTranslation === alternative
                                                                ? 'text-white hover:bg-blue-600'
                                                                : 'text-gray-500 hover:bg-blue-200'
                                                            }`}
                                                        title={`Listen to "${alternative}" in ${targetLanguage}`}
                                                    >
                                                        <Volume2 className="w-3 h-3" />
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
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Adding...
                                            </>
                                        ) : (
                                            <>
                                                <Check className="w-4 h-4" />
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

export default WordDetailModal;
