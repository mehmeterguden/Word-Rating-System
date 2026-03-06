import React, { useState, useRef, useEffect } from 'react';
import { Word } from '../types';
import { useWordAnalysis } from '../hooks/useWordAnalysis';
import { processText, TextProcessingResult } from '../utils/textProcessing';
import { getApiKeyStatus } from '../utils/apiKeys';

interface AddWordsProps {
    onAddWords: (newWords: Word[]) => void;
    existingWords: Word[];
}

const AddWords: React.FC<AddWordsProps> = ({ onAddWords, existingWords }) => {
    const [inputText, setInputText] = useState('');
    const [processedWords, setProcessedWords] = useState<Word[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showNotification, setShowNotification] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState('');
    const [notificationType, setNotificationType] = useState<'success' | 'error'>('success');
    const [apiKeyStatus, setApiKeyStatus] = useState(getApiKeyStatus('gemini'));
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { analyzeWord, isAnalyzing, error: analysisError } = useWordAnalysis();

    // Check API key status periodically
    useEffect(() => {
        const checkStatus = () => {
            setApiKeyStatus(getApiKeyStatus('gemini'));
        };

        checkStatus();
        // Also check when window gains focus
        window.addEventListener('focus', checkStatus);
        return () => window.removeEventListener('focus', checkStatus);
    }, []);

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setNotificationMessage(message);
        setNotificationType(type);
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
    };

    const handleProcessText = async () => {
        if (!inputText.trim()) return;

        setIsProcessing(true);
        try {
            // Basic text processing locally
            const result: TextProcessingResult = processText(inputText, existingWords);

            if (result.words.length === 0) {
                showToast('No new valid words found in the text.', 'error');
                setIsProcessing(false);
                return;
            }

            // If API key is not configured, just use the locally processed words
            if (!apiKeyStatus.isConfigured) {
                setProcessedWords(result.words);
                setIsProcessing(false);
                showToast(`Found ${result.words.length} words. Add API key in settings for auto-translation.`, 'success');
                return;
            }

            // If API key is configured, try to enhance words with AI
            const enhancedWords: Word[] = [];
            let successCount = 0;

            // Process in batches to avoid rate limits
            const batchSize = 5;
            for (let i = 0; i < result.words.length; i += batchSize) {
                const batch = result.words.slice(i, i + batchSize);
                const batchPromises = batch.map(async (word) => {
                    try {
                        // Only try to analyze if it's a new word (which it should be based on processText)
                        const analysis = await analyzeWord(word.text1, 'Turkish', 'English');
                        if (analysis) {
                            successCount++;
                            return {
                                ...word,
                                text2: analysis.translatedText,
                                definitions: analysis.definitions,
                                examples: analysis.examples,
                                synonyms: analysis.synonyms,
                                antonyms: analysis.antonyms,
                                difficulty: analysis.difficultyLevel,
                                context: analysis.usageContext,
                                pronunciation: analysis.pronunciation
                            };
                        }
                        return word;
                    } catch (err) {
                        console.error(`Failed to analyze word ${word.text1}:`, err);
                        return word;
                    }
                });

                const processedBatch = await Promise.all(batchPromises);
                enhancedWords.push(...processedBatch);
            }

            setProcessedWords(enhancedWords);
            showToast(`Processed ${enhancedWords.length} words (${successCount} AI-enhanced)`, 'success');
        } catch (error) {
            console.error('Error processing text:', error);
            showToast('Error processing text. Please try again.', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleAddAll = () => {
        if (processedWords.length === 0) return;
        onAddWords(processedWords);
        setProcessedWords([]);
        setInputText('');
        showToast(`Successfully added ${processedWords.length} words!`, 'success');
    };

    const handleRemoveWord = (index: number) => {
        const updatedWords = [...processedWords];
        updatedWords.splice(index, 1);
        setProcessedWords(updatedWords);
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            if (text) {
                setInputText(text);
                // Reset file input
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }
        };
        reader.readAsText(file);
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
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                            </svg>
                        </div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-800 to-indigo-800 bg-clip-text text-transparent mb-2">
                            Add New Words
                        </h1>
                        <p className="text-slate-600 text-lg mb-4">
                            Enter text or upload a file to extract and add new words
                        </p>
                    </div>
                </div>

                {/* Input Section */}
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-blue-200/50 p-6 mb-8">
                    <div className="mb-4">
                        <textarea
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder="Paste your text here..."
                            className="w-full h-48 p-4 rounded-xl border border-blue-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none bg-white/50 text-slate-800 placeholder-slate-400"
                        />
                    </div>

                    <div className="flex flex-wrap gap-4 justify-between items-center">
                        <div className="flex gap-4">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="px-4 py-2 bg-white text-blue-600 rounded-xl border border-blue-200 hover:bg-blue-50 transition-colors flex items-center gap-2 font-medium"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                                Upload File
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                                accept=".txt,.md,.json"
                                className="hidden"
                            />
                        </div>

                        <button
                            onClick={handleProcessText}
                            disabled={isProcessing || !inputText.trim()}
                            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 font-bold flex items-center gap-2"
                        >
                            {isProcessing ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
                                    Process Text
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Results Section */}
                {processedWords.length > 0 && (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-slate-800">
                                Found {processedWords.length} New Words
                            </h2>
                            <button
                                onClick={handleAddAll}
                                className="px-6 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 shadow-lg hover:shadow-xl transition-all duration-300 font-bold flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Add All Words
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {processedWords.map((word, index) => (
                                <div key={index} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative group">
                                    <button
                                        onClick={() => handleRemoveWord(index)}
                                        className="absolute top-2 right-2 p-1 text-slate-400 hover:text-red-500 rounded-full hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>

                                    <div className="font-bold text-lg text-slate-800 mb-1">{word.text1}</div>
                                    {word.text2 && (
                                        <div className="text-slate-600 text-sm mb-2">{word.text2}</div>
                                    )}

                                    <div className="flex gap-2 mt-auto">
                                        {word.difficulty && (
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${word.difficulty <= 2 ? 'bg-green-100 text-green-700' :
                                                    word.difficulty <= 4 ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-red-100 text-red-700'
                                                }`}>
                                                Level {word.difficulty}
                                            </span>
                                        )}
                                        {word.context && (
                                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                                Has Context
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* API Key Warning */}
                {!apiKeyStatus.isConfigured && (
                    <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                        <svg className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <div>
                            <h3 className="font-bold text-amber-800">API Key Not Configured</h3>
                            <p className="text-amber-700 text-sm mt-1">
                                To enable automatic translations and AI enhancements, please configure your Gemini API key in Settings.
                                Without it, words will be added with basic processing only.
                            </p>
                            <button
                                onClick={() => window.location.href = '/settings'}
                                className="mt-2 text-sm font-bold text-amber-800 hover:text-amber-900 underline"
                            >
                                Go to Settings
                            </button>
                        </div>
                    </div>
                )}

                {/* Notification Toast */}
                {showNotification && (
                    <div className={`fixed bottom-8 right-8 px-6 py-4 rounded-xl shadow-2xl transform transition-all duration-300 z-50 flex items-center gap-3 ${notificationType === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                        }`}>
                        {notificationType === 'success' ? (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        ) : (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        )}
                        <span className="font-medium">{notificationMessage}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AddWords;
