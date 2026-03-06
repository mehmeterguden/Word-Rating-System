import React, { useState, useEffect, useRef, useCallback } from 'react';
import { generateAiContent, AiResult, generateChatReply, generateChatGreeting, generateDefinitionOnly } from '../utils/ai';
import { Word, DifficultyLevel } from '../types';
import { getLanguageByName } from '../utils/languages';
import WordImageModal from './WordImageModal';

// Chat is now integrated into the AI panel; no separate modal

interface EvaluationModalProps {
    currentWord: Word | null;
    totalWords: number;
    progressPercentage: number;
    currentIndex: number;
    sourceLanguageName: string;
    targetLanguageName: string;
    onRate: (difficulty: DifficultyLevel) => void;
    onClose: () => void;
    onPrevious: () => void;
    onNext: () => void;
}

const EvaluationModal: React.FC<EvaluationModalProps> = ({
    currentWord,
    totalWords,
    progressPercentage,
    currentIndex,
    sourceLanguageName,
    targetLanguageName,
    onRate,
    onClose,
    onPrevious,
    onNext
}) => {
    const [clickedRating, setClickedRating] = useState<number | null>(null);
    const [isRevealed, setIsRevealed] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);
    const [aiOpen, setAiOpen] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);
    const [aiResult, setAiResult] = useState<AiResult | null>(null);
    const [altDefinition, setAltDefinition] = useState<string>('');
    const [followupText] = useState('');
    const [aiMessages, setAiMessages] = useState<Array<{ role: 'user' | 'assistant'; text?: string; result?: AiResult }>>([]);
    const [isChatMode, setIsChatMode] = useState(false);
    const [showLangIntro, setShowLangIntro] = useState(false);
    const [introLang, setIntroLang] = useState<string>('English');
    const [chatMessages, setChatMessages] = useState<Array<{ id: string; role: 'user' | 'assistant'; text: string }>>([
        { id: 'welcome', role: 'assistant', text: '...' }
    ]);
    const [chatInput, setChatInput] = useState('');
    const [localFormatReversed, setLocalFormatReversed] = useState(false);

    // Image modal states
    const [showImageModal, setShowImageModal] = useState(false);
    const [currentImageWord, setCurrentImageWord] = useState('');
    const [currentImageLanguage, setCurrentImageLanguage] = useState('');

    // Resim modal'ını aç
    const handleImageClick = (wordText: string, languageName?: string) => {
        setCurrentImageWord(wordText);
        setCurrentImageLanguage(languageName || '');
        setShowImageModal(true);
    };


    const chatEndRef = useRef<HTMLDivElement | null>(null);
    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages.length]);

    // Chat history management
    const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'assistant'; text: string; timestamp: number }>>([]);

    // Summarize chat history for context
    const summarizeChatHistory = (messages: Array<{ role: 'user' | 'assistant'; text: string; timestamp: number }>) => {
        if (messages.length <= 4) return messages.map(m => `${m.role}: ${m.text}`).join('\n');

        const recentMessages = messages.slice(-4);
        const olderMessages = messages.slice(0, -4);

        if (olderMessages.length === 0) {
            return recentMessages.map(m => `${m.role}: ${m.text}`).join('\n');
        }

        const summary = `Previous conversation summary: ${olderMessages.length} messages exchanged. Recent messages:\n${recentMessages.map(m => `${m.role}: ${m.text}`).join('\n')}`;
        return summary;
    };

    const handleSendChat = async () => {
        const text = chatInput.trim();
        if (!text) return;

        const userMsg = { id: `u-${Date.now()}`, role: 'user' as const, text };
        setChatMessages(prev => [...prev, userMsg]);

        // Add to chat history
        const newHistoryEntry = { role: 'user' as const, text, timestamp: Date.now() };
        setChatHistory(prev => [...prev, newHistoryEntry]);

        setChatInput('');

        try {
            let chatLang = 'English';
            try { chatLang = localStorage.getItem('word-rating-system-ai-language') || 'English'; } catch { }

            // Get conversation context
            const conversationContext = summarizeChatHistory([...chatHistory, newHistoryEntry]);

            const reply = await generateChatReply({
                word1: currentWord?.text1 || '',
                chatLanguageName: chatLang,
                userMessage: text,
                sourceLanguageName,
                conversationStarted: chatMessages.length > 0,
                conversationContext
            });

            const assistantMsg = { id: `a-${Date.now()}`, role: 'assistant' as const, text: reply };
            setChatMessages(prev => [...prev, assistantMsg]);

            // Add assistant response to history
            const assistantHistoryEntry = { role: 'assistant' as const, text: reply, timestamp: Date.now() };
            setChatHistory(prev => [...prev, assistantHistoryEntry]);

        } catch (e) {
            const fallback = { id: `a-${Date.now()}`, role: 'assistant' as const, text: 'İstek başarısız oldu. Lütfen tekrar deneyin.' };
            setChatMessages(prev => [...prev, fallback]);
        }
    };

    const resolveLangCode = (languageName?: string): string | undefined => {
        if (!languageName) return undefined;
        const match = getLanguageByName(languageName);
        return match?.code;
    };

    const speakWord = (text: string, language: string) => {
        try {
            const synth = (window as any).speechSynthesis;
            if (!synth) return;
            synth.cancel();
            const u = new SpeechSynthesisUtterance(text);
            const code = resolveLangCode(language) || 'en';
            u.lang = code === 'en' ? 'en-US' : code;

            // Choose voice: saved per-language preference > lang match > fallback
            const voices = synth.getVoices() || [];
            const voiceKey = `tts-voice-${code}`;
            let preferredName: string | null = null;
            try { preferredName = localStorage.getItem(voiceKey); } catch { }

            let chosen = preferredName ? voices.find((v: any) => v.name === preferredName) : undefined;

            if (!chosen) {
                // If no preferred voice, try to find a "Google" voice first as they are often better quality on Chrome
                chosen = voices.find((v: any) => v.lang.toLowerCase().startsWith(code) && v.name.includes('Google'));

                // If no Google voice, take any voice matching the language
                if (!chosen) {
                    chosen = voices.find((v: any) => v.lang.toLowerCase().startsWith(code));
                }
            }

            if (!chosen) { // Fallback
                chosen = voices.find((v: any) => v.lang.includes(code.split('-')[0])); // Try base language
            }

            if (chosen) u.voice = chosen;

            // Optimize rate based on text length
            if (text.length > 50) {
                u.rate = 0.9;
            } else {
                u.rate = 0.8; // Generally slightly slower is better for learning
            }

            synth.speak(u);
        } catch (e) { console.error(e); }
    };

    const toggleChatMode = async () => {
        const newState = !isChatMode;
        setIsChatMode(newState);
        if (newState && chatMessages.length <= 1) {
            // Start new chat with greeting
            let chatLang = 'English';
            try { chatLang = localStorage.getItem('word-rating-system-ai-language') || 'English'; } catch { }

            const greeting = await generateChatGreeting({
                word1: currentWord?.text1 || '',
                chatLanguageName: chatLang,
                sourceLanguageName
            });

            setChatMessages([{ id: 'welcome', role: 'assistant', text: greeting }]);

            // Initialize history logic if needed (cleared on toggle on?)
            // Actually we keep history for the session usually.
        }
    };

    // Automatically open AI and generate content when word changes, 
    // ONLY if the setting is enabled
    useEffect(() => {
        const autoTagsEnabled = localStorage.getItem('word-rating-system-auto-a-tags') === 'true';
        if (autoTagsEnabled && currentWord && !aiOpen && !aiResult && !aiLoading) {
            const timer = setTimeout(() => {
                setAiOpen(true);
                runAi();
            }, 500); // Small delay to allow UI to settle
            return () => clearTimeout(timer);
        }
    }, [currentWord]);

    // Format swapping logic
    useEffect(() => {
        const reversed = localStorage.getItem('word-rating-system-format-reversed') === 'true';
        setLocalFormatReversed(reversed);
    }, [currentWord]);

    const runAi = async () => {
        if (!currentWord) return;
        setAiLoading(true);
        setAiError(null);
        setAiResult(null); // Clear previous result while loading
        setAltDefinition('');

        // Check definition language setting
        const definitionLang = localStorage.getItem('word-rating-system-definition-language') || 'Target Language (Turkish)';

        try {
            if (definitionLang === 'Disable') {
                setAiLoading(false);
                return; // Do nothing if disabled
            }

            if (definitionLang === 'Definition Only') {
                // Lightweight definition generation
                const definition = await generateDefinitionOnly({
                    word: currentWord.text1,
                    sourceLanguageName,
                    targetLanguageName
                });
                setAltDefinition(definition);
                setAiLoading(false);
                return;
            }

            // Full AI Content generation
            const res = await generateAiContent({
                word1: currentWord.text1,
                meaning: currentWord.text2,
                sourceLanguageName,
                targetLanguageName,
                exampleBlock: currentWord.examples ? JSON.stringify(currentWord.examples) : undefined
            });
            setAiResult(res);
            setAiMessages([{ role: 'assistant', result: res }]);
        } catch (err: any) {
            setAiError('AI Failed: ' + (err.message || 'Unknown error'));
        } finally {
            setAiLoading(false);
        }
    };

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if chatting
            if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;

            if (e.code === 'Space') {
                e.preventDefault();
                setIsRevealed(prev => !prev);
            } else if (e.key >= '1' && e.key <= '5') {
                const difficulty = parseInt(e.key) as DifficultyLevel;
                handleRate(difficulty); // Use handleRate instead of onRate directly
            } else if (e.key === 'ArrowLeft') {
                onPrevious();
            } else if (e.key === 'ArrowRight') {
                onNext();
            } else if (e.key === 'Escape') {
                // If image modal is open, close it first
                if (showImageModal) {
                    setShowImageModal(false);
                } else {
                    onClose(); // Otherwise close evaluation modal
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onRate, onPrevious, onNext, onClose, showImageModal]);

    // Reset state on word change
    useEffect(() => {
        setIsRevealed(false);
        setClickedRating(null);
        setAiOpen(false);
        setAiResult(null);
        setAiError(null);
        setAiLoading(false);
        setIsChatMode(false);
        setChatMessages([]);
        setShowLangIntro(false);
        setAltDefinition('');
        setChatHistory([]); // Clear chat history for new word
    }, [currentWord]);

    // Introduction playback logic
    useEffect(() => {
        if (showLangIntro && currentWord) {
            // Play intro logic (omitted for brevity as it requires complex Audio handling or TTS sequence)
            // For now just console log
            console.log('Playing intro for', currentWord.text1);

            const seq = async () => {
                // Speak target word
                speakText(currentWord.text1, sourceLanguageName);
                // Wait
                await new Promise(r => setTimeout(r, 1500));
                // Speak meaning
                speakText(currentWord.text2, targetLanguageName);
                // Wait
                await new Promise(r => setTimeout(r, 1000));
                setShowLangIntro(false);
            };
            seq();
        }
    }, [showLangIntro, currentWord]);

    const speakText = (t: string, lang: string) => speakWord(t, lang);

    const handleRate = (difficulty: DifficultyLevel) => {
        setClickedRating(difficulty);
        setTimeout(() => {
            onRate(difficulty);
        }, 250); // Small delay for visual feedback
    };

    // Helper for displaying current word (handling format reversal)
    const displayWord = localFormatReversed ? currentWord?.text2 : currentWord?.text1;
    const displayMeaning = localFormatReversed ? currentWord?.text1 : currentWord?.text2;
    const displayLang = localFormatReversed ? targetLanguageName : sourceLanguageName;
    const meaningLang = localFormatReversed ? sourceLanguageName : targetLanguageName;

    if (!currentWord) return null;

    return (
        <div>
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-6xl h-[85vh] flex flex-col overflow-hidden">

                    {/* Header and Progress */}
                    {/* Header */}
                    <div className="flex items-center justify-between px-8 py-4 border-b border-slate-100 bg-white z-10">
                        <div className="flex items-center gap-4">
                            <div className={`p-2.5 rounded-xl ${isChatMode
                                ? 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-indigo-200'
                                : 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-200'
                                } shadow-lg transition-all duration-300`}>
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-xl font-bold text-slate-800">
                                        {isChatMode ? 'AI Conversation' : 'Word Evaluation'}
                                    </h2>
                                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-xs font-medium text-slate-500 border border-slate-200">
                                        {localFormatReversed ? `${targetLanguageName} → ${sourceLanguageName}` : `${sourceLanguageName} → ${targetLanguageName}`}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-500 font-medium">
                                    {isChatMode ? 'Practice using the word in context' : 'Assess your knowledge'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="flex flex-col items-end mr-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-semibold text-slate-700">Progress</span>
                                    <span className="text-sm font-bold text-blue-600">{Math.round(progressPercentage)}%</span>
                                </div>
                                <div className="w-48 h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500 relative"
                                        style={{ width: `${progressPercentage}%` }}
                                    >
                                        <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
                                    </div>
                                </div>
                                <div className="text-xs text-slate-400 mt-1 font-medium">
                                    Word {currentIndex + 1} of {totalWords}
                                </div>
                            </div>

                            <button
                                onClick={onClose}
                                className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all duration-200 border border-transparent hover:border-slate-200"
                                title="Close (Esc)"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 flex overflow-hidden">
                        {/* Left Panel - Flashcard & Chat */}
                        <div className="w-1/2 p-8 flex flex-col items-center justify-center relative border-r border-slate-100 bg-slate-50/50">
                            {isChatMode ? (
                                <div className="w-full h-full flex flex-col bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-200">
                                    {/* Chat Header */}
                                    <div className="p-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white flex justify-between items-center shadow-md">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg">Practice Conversation</h3>
                                                <p className="text-xs text-indigo-100">Use "{displayWord}" in a sentence</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={toggleChatMode}
                                            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-medium transition-colors backdrop-blur-sm border border-white/20"
                                        >
                                            End Practice
                                        </button>
                                    </div>

                                    {/* Chat Messages */}
                                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                                        {chatMessages.map((msg) => (
                                            <div
                                                key={msg.id}
                                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div className={`max-w-[80%] p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user'
                                                    ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-br-none'
                                                    : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none'
                                                    }`}>
                                                    {msg.text}
                                                </div>
                                            </div>
                                        ))}
                                        <div ref={chatEndRef} />
                                    </div>

                                    {/* Chat Input */}
                                    <div className="p-4 bg-white border-t border-slate-100">
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all"
                                                placeholder={`Write a sentence with "${displayWord}"...`}
                                                value={chatInput}
                                                onChange={(e) => setChatInput(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                                                autoFocus
                                            />
                                            <button
                                                onClick={handleSendChat}
                                                disabled={!chatInput.trim()}
                                                className="px-4 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                // Enhanced Flashcard
                                <div className="relative w-full max-w-md aspect-[3/4] perspective-1000">
                                    <div
                                        className={`relative w-full h-full transition-all duration-700 preserve-3d cursor-pointer group ${isRevealed ? 'rotate-y-180' : ''}`}
                                        onClick={() => setIsRevealed(!isRevealed)}
                                    >
                                        {/* Front of Card */}
                                        <div className="absolute inset-0 w-full h-full backface-hidden">
                                            <div className="h-full bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-8 flex flex-col items-center justify-center relative overflow-hidden group-hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] group-hover:-translate-y-1 transition-all duration-300">
                                                {/* Decorative Background */}
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-60"></div>
                                                <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-indigo-50 to-purple-50 rounded-full blur-3xl -ml-16 -mb-16 opacity-60"></div>

                                                {/* Hint Icon (if not revealed) */}
                                                {!isRevealed && (
                                                    <div className="absolute top-6 right-6">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setShowTooltip(!showTooltip);
                                                            }}
                                                            className="p-2 text-slate-300 hover:text-blue-500 transition-colors relative"
                                                        >
                                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            {showTooltip && (
                                                                <div className="absolute top-full right-0 mt-2 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg whitespace-nowrap z-20">
                                                                    Space to reveal • 1-5 to rate
                                                                </div>
                                                            )}
                                                        </button>
                                                    </div>
                                                )}

                                                {/* Language Label */}
                                                <div className="mb-8">
                                                    <span className="px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 text-sm font-semibold border border-blue-100/50 shadow-sm">
                                                        {displayLang}
                                                    </span>
                                                </div>

                                                {/* Main Word */}
                                                <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-slate-800 to-slate-600 text-center mb-8 tracking-tight leading-tight select-text">
                                                    {displayWord}
                                                </h1>

                                                {/* Audio Button */}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        speakWord(displayWord || '', displayLang);
                                                    }}
                                                    className="p-4 rounded-2xl bg-white border border-slate-100 shadow-lg text-blue-500 hover:text-blue-600 hover:scale-110 hover:shadow-xl transition-all duration-300 group/audio"
                                                >
                                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                                    </svg>
                                                </button>

                                                {/* Tap to Reveal Hint */}
                                                <div className="absolute bottom-8 text-slate-300 text-sm font-medium flex items-center gap-2 animate-pulse">
                                                    <span>Tap to reveal meaning</span>
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Back of Card */}
                                        <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180">
                                            <div className="h-full bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-8 flex flex-col items-center justify-center relative overflow-hidden text-white border border-slate-700/50">
                                                {/* Decorative Background */}
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                                                <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -ml-16 -mb-16"></div>

                                                {/* Language Label */}
                                                <div className="mb-8">
                                                    <span className="px-4 py-1.5 rounded-full bg-white/10 text-white/90 text-sm font-semibold border border-white/10 backdrop-blur-sm shadow-sm">
                                                        {meaningLang}
                                                    </span>
                                                </div>

                                                {/* Meaning */}
                                                <h2 className="text-4xl font-bold text-center mb-4 text-white tracking-tight leading-tight select-text">
                                                    {displayMeaning}
                                                </h2>

                                                {/* Audio Button (Meaning) */}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        speakWord(displayMeaning || '', meaningLang);
                                                    }}
                                                    className="mb-8 p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all duration-200 backdrop-blur-sm"
                                                >
                                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                                    </svg>
                                                </button>

                                                <div className="w-full max-w-xs space-y-4 relative z-10">
                                                    <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent w-full"></div>
                                                    <div className="text-center">
                                                        <p className="text-sm font-medium text-slate-400 mb-4">How well did you know this?</p>
                                                        <div className="grid grid-cols-5 gap-2">
                                                            {[1, 2, 3, 4, 5].map((level) => (
                                                                <button
                                                                    key={level}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleRate(level as DifficultyLevel);
                                                                    }}
                                                                    className={`
                                  h-12 rounded-xl text-lg font-bold transition-all duration-200
                                  ${clickedRating === level
                                                                            ? 'bg-white text-slate-900 scale-110 shadow-lg ring-2 ring-white/50'
                                                                            : 'bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20'
                                                                        }
                                `}
                                                                >
                                                                    {level}
                                                                </button>
                                                            ))}
                                                        </div>
                                                        <div className="flex justify-between px-1 mt-2 text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                                                            <span>Hard</span>
                                                            <span>Easy</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Intro Video Overlay (Simulated) */}
                                    {showLangIntro && (
                                        <div className="absolute inset-0 bg-black/90 backdrop-blur-md z-50 rounded-3xl flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300">
                                            <div className="w-20 h-20 mb-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center animate-pulse shadow-[0_0_40px_rgba(79,70,229,0.3)]">
                                                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                                </svg>
                                            </div>
                                            <h3 className="text-2xl font-bold text-white mb-2">Listen & Learn</h3>
                                            <p className="text-slate-400 max-w-xs">{currentWord.text1} ({sourceLanguageName})</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Right Panel - Context & AI Details */}
                        <div className="w-1/2 flex flex-col bg-white">
                            <div className="flex-1 overflow-y-auto p-8 relative">
                                <div className="max-w-xl mx-auto space-y-8">
                                    {/* Context & Usage Section */}
                                    <div className="space-y-6 animate-in slide-in-from-right-8 duration-500 delay-100">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                                </svg>
                                            </div>
                                            <h3 className="text-lg font-bold text-slate-800">Context & Usage</h3>
                                        </div>

                                        {/* AI Generated Content or Examples */}
                                        {aiLoading ? (
                                            <div className="space-y-4">
                                                <div className="h-4 bg-slate-100 rounded w-3/4 animate-pulse"></div>
                                                <div className="h-4 bg-slate-100 rounded w-1/2 animate-pulse"></div>
                                                <div className="h-32 bg-slate-50 rounded-xl animate-pulse border border-slate-100"></div>
                                            </div>
                                        ) : aiResult ? (
                                            <div className="space-y-6">
                                                {/* Example Sentences */}
                                                <div className="space-y-4">
                                                    {aiResult.examples?.map((ex, i) => (
                                                        <div key={i} className="group p-4 rounded-xl bg-slate-50 hover:bg-white border border-slate-100 hover:border-blue-100 hover:shadow-md transition-all duration-300">
                                                            <div className="flex gap-4">
                                                                <div className="mt-1">
                                                                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                                                                        {i + 1}
                                                                    </div>
                                                                </div>
                                                                <div className="flex-1 space-y-2">
                                                                    <p className="text-slate-800 font-medium leading-relaxed">{ex.sentence}</p>
                                                                    <p className="text-slate-500 text-sm">{ex.translation}</p>
                                                                </div>
                                                                <button
                                                                    onClick={() => speakText(ex.sentence, sourceLanguageName)}
                                                                    className="self-start p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                                >
                                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Etymology & Grammar */}
                                                <div className="grid grid-cols-2 gap-4">
                                                    {aiResult.etymology && (
                                                        <div className="p-4 rounded-xl bg-purple-50 border border-purple-100">
                                                            <h4 className="text-purple-900 font-semibold mb-2 text-sm">Etymology</h4>
                                                            <p className="text-purple-700 text-sm leading-relaxed">{aiResult.etymology}</p>
                                                        </div>
                                                    )}
                                                    {aiResult.grammar && (
                                                        <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100">
                                                            <h4 className="text-indigo-900 font-semibold mb-2 text-sm">Grammar</h4>
                                                            <p className="text-indigo-700 text-sm leading-relaxed">{aiResult.grammar}</p>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Synonyms */}
                                                {aiResult.synonyms && aiResult.synonyms.length > 0 && (
                                                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                                                        <h4 className="text-emerald-900 font-semibold mb-3 text-sm flex items-center gap-2">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                                            </svg>
                                                            Synonyms & Related Words
                                                        </h4>
                                                        <div className="flex flex-wrap gap-2">
                                                            {aiResult.synonyms.map((syn, i) => (
                                                                <span key={i} className="px-3 py-1 bg-white border border-emerald-200 rounded-lg text-emerald-700 text-sm hover:scale-105 transition-transform cursor-default">
                                                                    {syn}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Image Generation */}

                                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                                                    <h4 className="text-slate-800 font-semibold mb-3 text-sm flex items-center gap-2">
                                                        <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                        Visual Aid
                                                    </h4>
                                                    <div className="flex gap-3">
                                                        <button
                                                            onClick={() => handleImageClick(currentWord.text1, sourceLanguageName)}
                                                            className="flex-1 py-2 px-4 bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-lg text-sm font-medium transition-all shadow-sm flex items-center justify-center gap-2"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                            </svg>
                                                            View Image
                                                        </button>
                                                        <button
                                                            onClick={() => handleImageClick(currentWord.text1, sourceLanguageName)}
                                                            className="flex-1 py-2 px-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg text-sm font-medium hover:from-purple-600 hover:to-pink-600 transition-all shadow-md flex items-center justify-center gap-2"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                            </svg>
                                                            Generate New
                                                        </button>
                                                    </div>
                                                </div>

                                            </div>
                                        ) : altDefinition ? (
                                            <div className="p-6 rounded-xl bg-orange-50 border border-orange-100 text-orange-900">
                                                <p className="leading-relaxed">{altDefinition}</p>
                                            </div>
                                        ) : (
                                            /* Default View / No AI yet */
                                            <div className="text-center py-12 px-4">
                                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                    </svg>
                                                </div>
                                                <h4 className="text-lg font-semibold text-slate-700 mb-2">Unlock AI Insights</h4>
                                                <p className="text-slate-500 mb-6 max-w-xs mx-auto text-sm">Get detailed explanations, examples, and etymology powered by Gemini AI.</p>

                                                <button
                                                    onClick={runAi}
                                                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium shadow-lg shadow-blue-200 hover:shadow-xl hover:-translate-y-0.5 transition-all"
                                                >
                                                    Analyze Word
                                                </button>
                                            </div>
                                        )}

                                        {/* AI Error */}
                                        {aiError && (
                                            <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm flex items-start gap-3">
                                                <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <div className="flex-1">
                                                    <p className="font-semibold mb-1">Analysis Failed</p>
                                                    <p>{aiError}</p>
                                                    <button onClick={runAi} className="mt-2 text-xs font-bold uppercase tracking-wider text-red-800 hover:underline">Retry</button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Bottom Fade */}
                                <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
                            </div>

                            {/* AI Control Bar */}
                            <div className="p-4 border-t border-slate-100 bg-slate-50/80 backdrop-blur-sm flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={toggleChatMode}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${isChatMode
                                                ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-200'
                                                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                                            }`}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                        </svg>
                                        {isChatMode ? 'Chat Active' : 'Start Chat'}
                                    </button>

                                    <button
                                        onClick={runAi}
                                        disabled={aiLoading}
                                        className="flex items-center gap-2 px-4 py-2 bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-xl text-sm font-medium transition-all"
                                    >
                                        <svg className={`w-4 h-4 ${aiLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        Refresh Analysis
                                    </button>
                                </div>

                                <div className="text-xs text-slate-400 font-medium">
                                    Powered by Gemini 2.0 Flash
                                </div>
                            </div>
                        </div>
                    </div>


                    {/* Image Modal */}
                    <WordImageModal
                        word={currentImageWord}
                        languageName={currentImageLanguage}
                        isOpen={showImageModal}
                        onClose={() => setShowImageModal(false)}
                    />

                </div>
            </div>
        </div>
    );
};

export default EvaluationModal;
