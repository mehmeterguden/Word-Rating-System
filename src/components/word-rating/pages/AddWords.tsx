import React, { useState, useEffect } from 'react';
import { Word, WordSet, TranslationResult } from '../types';
import { generateWordTranslations } from '../utils/wordTranslation';
import { LANGUAGES, getLanguageByCode, getLanguageDisplay, DEFAULT_LANGUAGE1, DEFAULT_LANGUAGE2, DEFAULT_SEPARATOR } from '../utils/languages';
import { getApiKeyStatus } from '../utils/apiKeys';

interface AddWordsProps {
    onAddWords: (newWords: Omit<Word, 'id' | 'createdAt' | 'difficulty' | 'isEvaluated'>[]) => void;
    wordSets: WordSet[];
    activeSetId: string;
}

const AddWords: React.FC<AddWordsProps> = ({ onAddWords, wordSets, activeSetId }) => {
    const [inputText, setInputText] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [previewWords, setPreviewWords] = useState<TranslationResult[]>([]);
    const [successMessage, setSuccessMessage] = useState('');
    const [error, setError] = useState<string | null>(null);

    // Settings state
    const [language1, setLanguage1] = useState(DEFAULT_LANGUAGE1);
    const [language2, setLanguage2] = useState(DEFAULT_LANGUAGE2);
    const [separator, setSeparator] = useState(DEFAULT_SEPARATOR);
    const [customInstructions, setCustomInstructions] = useState('');
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [accordionOpen, setAccordionOpen] = useState(false); // For "How to use" accordion

    // Progress state for batch processing
    const [progress, setProgress] = useState<{
        current: number;
        total: number;
        percentage: number;
        currentWord: string;
    } | null>(null);

    // Load saved settings
    useEffect(() => {
        const savedLang1 = localStorage.getItem('word-rating-system-lang1');
        const savedLang2 = localStorage.getItem('word-rating-system-lang2');
        const savedSeparator = localStorage.getItem('word-rating-system-separator');
        const savedInstructions = localStorage.getItem('word-rating-system-instructions');

        if (savedLang1) setLanguage1(savedLang1);
        if (savedLang2) setLanguage2(savedLang2);
        if (savedSeparator) setSeparator(savedSeparator);
        if (savedInstructions) setCustomInstructions(savedInstructions);
    }, []);

    // Save settings when changed
    useEffect(() => {
        localStorage.setItem('word-rating-system-lang1', language1);
        localStorage.setItem('word-rating-system-lang2', language2);
        localStorage.setItem('word-rating-system-separator', separator);
        localStorage.setItem('word-rating-system-instructions', customInstructions);
    }, [language1, language2, separator, customInstructions]);

    // Check API key
    const { hasUserKey, hasEnvKey } = getApiKeyStatus('gemini');
    const hasApiKey = hasUserKey || hasEnvKey;

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInputText(e.target.value);
        setPreviewWords([]);
        setSuccessMessage('');
        setError(null);
    };

    const handleGenerateValues = async () => {
        if (!inputText.trim()) return;

        // Check if API key is configured
        if (!hasApiKey) {
            setError('Please configure your Gemini API key in Settings first.');
            return;
        }

        setIsProcessing(true);
        setError(null);
        setSuccessMessage('');
        setProgress(null);

        // Split input by newlines and filter empty lines
        const lines = inputText.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);

        if (lines.length === 0) {
            setIsProcessing(false);
            return;
        }

        try {
            const response = await generateWordTranslations({
                words: lines,
                sourceLanguageName: language1,
                targetLanguageName: language2,
                separator: separator,
                customInstructions: customInstructions || undefined,
                onBatchProgress: (batchProgress) => {
                    setProgress({
                        current: batchProgress.processedWords,
                        total: batchProgress.totalWords,
                        percentage: Math.round((batchProgress.processedWords / batchProgress.totalWords) * 100),
                        currentWord: `Processing batch ${batchProgress.currentBatch}/${batchProgress.totalBatches}...`
                    });
                }
            });

            setPreviewWords(response.translations);
            setSuccessMessage(`Successfully generated translations for ${response.translations.length} words!`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
            console.error('Translation error:', err);
        } finally {
            setIsProcessing(false);
            setProgress(null);
        }
    };

    const handleSaveWords = () => {
        if (previewWords.length === 0) return;

        const wordsToAdd = previewWords.map(item => ({
            text1: item.originalWord,
            text2: item.translation,
            language1Name: language1,
            language2Name: language2,
            setId: activeSetId
        }));

        onAddWords(wordsToAdd);
        setInputText('');
        setPreviewWords([]);
        setSuccessMessage(`Saved ${wordsToAdd.length} new words to your collection!`);

        // Clear success message after 3 seconds
        setTimeout(() => {
            setSuccessMessage('');
        }, 3000);
    };

    const activeSet = wordSets.find(s => s.id === activeSetId);

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-8 min-h-screen bg-slate-50">

            {/* Header Card */}
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
                <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-8 py-10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-2xl -ml-10 -mb-10"></div>

                    <div className="relative z-10">
                        <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-3 tracking-tight">Add New Words</h1>
                        <p className="text-indigo-100 text-lg flex items-center gap-2">
                            <span className="bg-white/20 px-3 py-1 rounded-lg text-sm font-semibold backdrop-blur-sm">
                                Target Set: {activeSet ? activeSet.name : 'Default Set'}
                            </span>
                        </p>
                    </div>
                </div>

                {/* API Key Warning */}
                {!hasApiKey && (
                    <div className="bg-rose-50 border-b border-rose-100 p-4 flex items-start gap-3">
                        <svg className="w-6 h-6 text-rose-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div>
                            <p className="text-rose-700 font-semibold">API Key Missing</p>
                            <p className="text-rose-600 text-sm mt-1">Please configure your Gemini API key in Settings to use the auto-translation feature.</p>
                        </div>
                    </div>
                )}

                <div className="p-6 md:p-8 space-y-8">

                    {/* Helper Accordion */}
                    <div className="bg-blue-50/50 rounded-2xl border border-blue-100 overflow-hidden transition-all duration-300">
                        <button
                            onClick={() => setAccordionOpen(!accordionOpen)}
                            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-blue-50 transition-colors group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <span className="font-semibold text-slate-700">How to use</span>
                            </div>
                            <svg
                                className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${accordionOpen ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        <div className={`transition-all duration-300 ease-in-out ${accordionOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                            <div className="px-6 pb-6 pt-2 text-slate-600 space-y-2 border-t border-blue-100">
                                <p>1. Ensure your Gemini API key is set in Settings.</p>
                                <p>2. Enter words or phrases (one per line) in the text area below.</p>
                                <p>3. Configure source and target languages if needed.</p>
                                <p>4. Click "Generate Translations" and AI will automatically translate and format them.</p>
                                <p>5. Review the preview and click "Save All" to add them to your collection.</p>
                            </div>
                        </div>
                    </div>

                    {/* Configuration Section */}
                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-slate-700 flex items-center gap-2">
                                <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                Translation Settings
                            </h3>
                            <button
                                onClick={() => setShowAdvanced(!showAdvanced)}
                                className="text-sm text-indigo-600 font-medium hover:text-indigo-800 transition-colors"
                            >
                                {showAdvanced ? 'Hide Advanced' : 'Show Advanced'}
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-600 block">From Language</label>
                                <div className="relative">
                                    <select
                                        value={language1}
                                        onChange={(e) => setLanguage1(e.target.value)}
                                        className="w-full appearance-none bg-white border border-slate-300 rounded-xl px-4 py-3 pr-10 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow outline-none"
                                    >
                                        {LANGUAGES.map(lang => (
                                            <option key={lang.code} value={lang.name}>
                                                {lang.flag} {lang.name} ({lang.nativeName})
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-slate-500">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-600 block">To Language</label>
                                <div className="relative">
                                    <select
                                        value={language2}
                                        onChange={(e) => setLanguage2(e.target.value)}
                                        className="w-full appearance-none bg-white border border-slate-300 rounded-xl px-4 py-3 pr-10 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow outline-none"
                                    >
                                        {LANGUAGES.map(lang => (
                                            <option key={lang.code} value={lang.name}>
                                                {lang.flag} {lang.name} ({lang.nativeName})
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-slate-500">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {showAdvanced && (
                            <div className="mt-6 pt-6 border-t border-slate-200">
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-semibold text-slate-600 block mb-2">Custom AI Instructions (Optional)</label>
                                        <textarea
                                            value={customInstructions}
                                            onChange={(e) => setCustomInstructions(e.target.value)}
                                            placeholder="e.g. 'Give simple definitions', 'Focus on medical terms', 'Use British English spelling'"
                                            className="w-full h-24 bg-white border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow outline-none resize-none"
                                        />
                                        <p className="text-xs text-slate-500 mt-1">These instructions will guide the AI translation process.</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input Area */}
                    <div className="relative">
                        <label className="block text-lg font-bold text-slate-700 mb-3">Words to Translate</label>
                        <div className="relative group">
                            <textarea
                                value={inputText}
                                onChange={handleTextChange}
                                placeholder="Enter words here, one per line..."
                                className="w-full h-64 bg-white border-2 border-slate-200 rounded-2xl px-6 py-5 text-lg leading-relaxed focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all outline-none resize-none placeholder-slate-300 shadow-inner group-hover:border-slate-300"
                            />
                            {inputText && (
                                <div className="absolute bottom-4 right-4 bg-slate-100 px-3 py-1 rounded-lg text-xs font-semibold text-slate-500 border border-slate-200">
                                    {inputText.split('\n').filter(l => l.trim()).length} words
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Action Button */}
                    <div className="flex justify-end pt-2">
                        <button
                            onClick={handleGenerateValues}
                            disabled={isProcessing || !inputText.trim() || !hasApiKey}
                            className={`
              relative overflow-hidden group px-8 py-4 rounded-xl font-bold text-lg shadow-xl transition-all duration-300 transform hover:-translate-y-1
              ${isProcessing || !inputText.trim() || !hasApiKey
                                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none transform-none'
                                    : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-700 hover:to-violet-700 hover:shadow-indigo-200/50'
                                }
            `}
                        >
                            <span className="relative z-10 flex items-center gap-3">
                                {isProcessing ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                        Generate Translations
                                    </>
                                )}
                            </span>
                        </button>
                    </div>

                    {/* Batch Progress */}
                    {progress && (
                        <div className="bg-white rounded-xl border border-indigo-100 p-6 shadow-lg animate-fade-in">
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-semibold text-indigo-900">{progress.currentWord}</span>
                                <span className="text-indigo-600 font-bold">{progress.percentage}%</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                                <div
                                    className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full rounded-full transition-all duration-500 ease-out relative"
                                    style={{ width: `${progress.percentage}%` }}
                                >
                                    <div className="absolute inset-0 bg-white/30 animate-[shimmer_2s_infinite]"></div>
                                </div>
                            </div>
                            <p className="text-sm text-slate-500 mt-2 text-center">
                                Processed {progress.current} of {progress.total} words
                            </p>
                        </div>
                    )}

                    {/* Results Section */}
                    {previewWords.length > 0 && (
                        <div className="space-y-6 animate-fade-in-up">
                            <div className="flex items-center justify-between">
                                <h3 className="text-2xl font-bold text-slate-800">Preview Results</h3>
                                <button
                                    onClick={handleSaveWords}
                                    className="px-6 py-3 bg-green-500 text-white rounded-xl font-bold shadow-lg hover:bg-green-600 hover:shadow-green-200/50 transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Save All ({previewWords.length})
                                </button>
                            </div>

                            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
                                <div className="grid grid-cols-12 bg-slate-50 p-4 font-semibold text-slate-600 text-sm tracking-wide uppercase">
                                    <div className="col-span-5 md:col-span-4 pl-2">Term</div>
                                    <div className="col-span-7 md:col-span-8">Translation & Context</div>
                                </div>

                                <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                                    {previewWords.map((word, index) => (
                                        <div key={index} className="grid grid-cols-12 p-4 hover:bg-indigo-50/30 transition-colors group">
                                            <div className="col-span-5 md:col-span-4 font-medium text-slate-800 flex items-center gap-3">
                                                <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-500 text-xs flex items-center justify-center shrink-0">
                                                    {index + 1}
                                                </span>
                                                {word.originalWord}
                                            </div>
                                            <div className="col-span-7 md:col-span-8 space-y-1">
                                                <div className="font-semibold text-indigo-600">{word.translation}</div>
                                                {word.definition && (
                                                    <p className="text-sm text-slate-500 italic">"{word.definition}"</p>
                                                )}

                                                {/* Optional details visible on hover or if available */}
                                                <div className="flex flex-wrap gap-2 mt-1">
                                                    {word.confidence && (
                                                        <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold ${word.confidence === 'high' ? 'bg-green-100 text-green-700' :
                                                                word.confidence === 'medium' ? 'bg-amber-100 text-amber-700' :
                                                                    'bg-red-100 text-red-700'
                                                            }`}>
                                                            {word.confidence}
                                                        </span>
                                                    )}
                                                    {word.partOfSpeech && (
                                                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
                                                            {word.partOfSpeech}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Success/Error Messages */}
                    {successMessage && (
                        <div className="fixed bottom-6 right-6 bg-green-500 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-in-right z-50">
                            <div className="bg-white/20 p-1 rounded-full">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <span className="font-medium">{successMessage}</span>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 text-red-700 px-6 py-4 rounded-xl border border-red-200 flex items-start gap-3">
                            <svg className="w-5 h-5 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                                <p className="font-bold">Error Processing Request</p>
                                <p className="text-sm mt-1 opacity-90">{error}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AddWords;
