import React, { useState, useEffect, useRef, useCallback } from 'react';
import { generateAiContent, AiResult } from '../utils/ai';
import { Word, DifficultyLevel } from '../types';
import { getLanguageByName, LANGUAGES, getUniqueLanguages } from '../utils/languages';
import { generateChatReply, generateChatGreeting, generateDefinitionOnly } from '../utils/ai';
import ImageModal from './ImageModal';
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
  const [followupText, setFollowupText] = useState('');
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
      try { chatLang = localStorage.getItem('word-rating-system-ai-language') || 'English'; } catch {}
      
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
  

  // Resolve language code from display name and speak via browser TTS
  const resolveLangCode = (languageName?: string): string | undefined => {
    if (!languageName) return undefined;
    const match = getLanguageByName(languageName);
    return match?.code;
  };

  const speakWord = (text: string, languageName?: string) => {
    try {
      const synth = (window as any).speechSynthesis as SpeechSynthesis | undefined;
      if (!synth) return;
      synth.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const langCode = resolveLangCode(languageName) || 'en';
      utterance.lang = langCode === 'en' ? 'en-US' : langCode;
      // Choose voice: saved per-language preference > lang match > fallback
      const voices = (availableVoices.length ? availableVoices : (synth.getVoices?.() || []));
      const voiceKey = `tts-voice-${langCode}`;
      let preferredName: string | null = null;
      try { preferredName = localStorage.getItem(voiceKey); } catch {}
      let chosen: SpeechSynthesisVoice | undefined = preferredName ? voices.find(v => v.name === preferredName) : undefined;
      if (!chosen) {
        chosen = voices.find(v => v.lang?.toLowerCase().startsWith(langCode));
      }
      if (!chosen) {
        chosen = voices[0];
      }
      if (chosen) utterance.voice = chosen;
      utterance.rate = 0.95;
      utterance.pitch = 1;
      utterance.volume = 1;
      synth.speak(utterance);
    } catch {
      // No-op on unsupported environments
    }
  };
  const getVoiceKey = (code: string) => `tts-voice-${code}`;

  // Reset reveal and AI state when word changes
  useEffect(() => {
    setIsRevealed(false);
    // Reset AI content to prompt
    setAiResult(null);
    setAiMessages([]);
    // Reset chat history for new word
    setChatHistory([]);
    // Prepare chat greeting in preferred language
    (async () => {
      try {
        let chatLang = 'English';
        try { chatLang = localStorage.getItem('word-rating-system-ai-language') || 'English'; } catch {}
        const greet = await generateChatGreeting({ 
          word1: currentWord?.text1 || '', 
          chatLanguageName: chatLang,
          sourceLanguageName
        });
        setChatMessages([{ id: 'welcome', role: 'assistant', text: greet }]);
      } catch {
        setChatMessages([{ id: 'welcome', role: 'assistant', text: `Hello! We can chat here. I can help you with the word "${currentWord?.text1 || ''}". How can I help?` }]);
      }
    })();
  }, [currentWord?.id]);
  // Load available speech voices
  useEffect(() => {
    const synth = (window as any).speechSynthesis as SpeechSynthesis | undefined;
    if (!synth) return;
    const loadVoices = () => setAvailableVoices(synth.getVoices?.() || []);
    loadVoices();
    synth.addEventListener?.('voiceschanged', loadVoices);
    return () => synth.removeEventListener?.('voiceschanged', loadVoices);
  }, []);


  useEffect(() => {
    const synth = (window as any).speechSynthesis as SpeechSynthesis | undefined;
    if (!synth) return;
    const loadVoices = () => {
      const v = synth.getVoices?.() || [];
      setAvailableVoices(v);
    };
    loadVoices();
    synth.addEventListener?.('voiceschanged', loadVoices);
    return () => synth.removeEventListener?.('voiceschanged', loadVoices);
  }, []);

  // Keyboard event handlers
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
          const rating = parseInt(event.key) as DifficultyLevel;
          handleRate(rating);
          break;
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          if (currentIndex > 0) {
            onPrevious();
          }
          break;
        case 'ArrowRight':
        case ' ':
          if (event.key === ' ') {
            // When chat is open or typing in inputs, do not toggle reveal/hide
            const target = event.target as HTMLElement | null;
            const isTyping = !!target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable === true);
            if (isTyping) {
              // Let space behave normally in inputs; prevent flashcard toggle
              return;
            }
            event.preventDefault();
            setIsRevealed(!isRevealed);
          } else if (currentIndex < totalWords - 1) {
            onNext();
          }
          break;

      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onPrevious, onNext, currentIndex, totalWords, isRevealed]);

  const handleRate = (rating: DifficultyLevel) => {
    setClickedRating(rating);
    setTimeout(() => {
      onRate(rating);
      setClickedRating(null);
    }, 800);
  };

  const runAi = async (mode: 'explain' | 'examples' | 'synonyms' | 'followup' | 'full') => {
    if (!currentWord) return;
    try {
      setAiError(null);
      setAiLoading(true);
      // Resolve preferred AI answer language
      let preferred = 'English';
      try { preferred = localStorage.getItem('word-rating-system-ai-language') || 'English'; } catch {}
      const result = await generateAiContent({
        word: currentWord.text1,
        sourceLanguageName,
        examplesLanguageName: targetLanguageName, // first word's language
        explanationLanguageName: preferred || targetLanguageName,
        mode,
        userQuestion: mode === 'followup' ? followupText : undefined
      });
      setAiOpen(true);
      if (mode === 'followup') {
        // Do NOT modify the analysis card; only add a chat-style assistant text
        const pieces: string[] = [];
        if (result.definition) pieces.push(result.definition);
        if (result.examples && result.examples.length > 0) {
          const ex = result.examples.slice(0, 2).map(e => {
            const highlightedSentence = e.sentence.replace(/\[\[w\]\](.*?)\[\[\/w\]\]/g, '<span class="underline decoration-blue-400 decoration-2 underline-offset-2 font-semibold">$1</span>');
            return `${highlightedSentence}${e.translation ? ` — ${e.translation}` : ''}`;
          });
          pieces.push(ex.join('\n'));
        }
        if (result.tips && result.tips.length > 0) {
          pieces.push(result.tips.slice(0, 3).join('\n'));
        }
        const text = pieces.join('\n\n') || 'Here is some guidance.';
        setAiMessages((prev) => [...prev, { role: 'assistant', text }]);
      } else {
        // Update only the analysis card; DO NOT push into chat stream
        setAiResult(result);
        // Pre-fetch alternative definition in the examples language for quick display
        try {
          const def = await generateDefinitionOnly({
            word: currentWord.text1,
            examplesLanguageName: targetLanguageName,
            explanationLanguageName: targetLanguageName,
            sourceLanguageName
          });
          setAltDefinition(def || '');
        } catch {
          setAltDefinition('');
        }
      }
    } catch (err: any) {
      setAiError(err?.message || 'AI request failed');
    } finally {
      setAiLoading(false);
    }
  };

  const handleOpenAi = () => {
    setAiOpen((v) => {
      const next = !v;
      if (next) {
        // First-time language onboarding UI
        try {
          const asked = localStorage.getItem('word-rating-system-ai-language-asked') === '1';
          const preferred = localStorage.getItem('word-rating-system-ai-language') || 'English';
          setIntroLang(preferred);
          if (!asked) {
            setShowLangIntro(true);
          } else if (aiMessages.length === 0 && !aiLoading) {
            runAi('full');
          }
        } catch {
          if (aiMessages.length === 0 && !aiLoading) runAi('full');
        }
      }
      return next;
    });
  };
  
  const handleSendFollowup = () => {
    if (!followupText.trim() || aiLoading) return;
    // No chat mode anymore
    return;
  };

  const formatInlineText = useCallback((text: string, isAssistant: boolean = false) => {
    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    
    const boldClass = isAssistant ? 'font-semibold text-slate-800' : 'font-semibold text-white';
    
    return escaped
      .replace(/\*\*(.+?)\*\*/g, `<strong class="${boldClass}">$1</strong>`)
      .replace(/__(.+?)__/g, '<span class="underline decoration-indigo-400 underline-offset-4 text-slate-800">$1</span>')
      .replace(/\[\[w\]\](.*?)\[\[\/w\]\]/g, '<span class="underline decoration-blue-400 decoration-2 underline-offset-2 font-semibold text-slate-800">$1</span>');
  }, []);



  const getRatingButtonColor = (rating: number, isSelected: boolean = false) => {
    if (isSelected) {
      switch (rating) {
        case 1: return 'bg-gradient-to-br from-green-400 to-emerald-600 text-white shadow-xl scale-110 ring-4 ring-emerald-100';
        case 2: return 'bg-gradient-to-br from-blue-400 to-indigo-600 text-white shadow-xl scale-110 ring-4 ring-indigo-100';
        case 3: return 'bg-gradient-to-br from-yellow-400 to-amber-600 text-white shadow-xl scale-110 ring-4 ring-amber-100';
        case 4: return 'bg-gradient-to-br from-orange-400 to-red-500 text-white shadow-xl scale-110 ring-4 ring-orange-100';
        case 5: return 'bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-xl scale-110 ring-4 ring-rose-100';
        default: return 'bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow-lg scale-110';
      }
    } else {
      switch (rating) {
        case 1: return 'bg-gradient-to-br from-green-50 to-emerald-50 text-emerald-700 hover:from-green-100 hover:to-emerald-100 hover:scale-105 border-2 border-emerald-200 hover:border-emerald-300 shadow';
        case 2: return 'bg-gradient-to-br from-blue-50 to-indigo-50 text-indigo-700 hover:from-blue-100 hover:to-indigo-100 hover:scale-105 border-2 border-indigo-200 hover:border-indigo-300 shadow';
        case 3: return 'bg-gradient-to-br from-yellow-50 to-amber-50 text-amber-700 hover:from-yellow-100 hover:to-amber-100 hover:scale-105 border-2 border-amber-200 hover:border-amber-300 shadow';
        case 4: return 'bg-gradient-to-br from-orange-50 to-red-50 text-orange-700 hover:from-orange-100 hover:to-red-100 hover:scale-105 border-2 border-orange-200 hover:border-orange-300 shadow';
        case 5: return 'bg-gradient-to-br from-rose-50 to-red-50 text-rose-700 hover:from-rose-100 hover:to-red-100 hover:scale-105 border-2 border-rose-200 hover:border-rose-300 shadow';
        default: return 'bg-gradient-to-br from-gray-50 to-slate-50 text-gray-700 hover:from-gray-100 hover:to-slate-100 hover:scale-105 border-2 border-gray-200 hover:border-gray-300 shadow';
      }
    }
  };

  const getDifficultyLabel = (rating: number): string => {
    switch (rating) {
      case 1: return 'Very Easy';
      case 2: return 'Easy';
      case 3: return 'Medium';
      case 4: return 'Hard';
      case 5: return 'Very Hard';
      default: return 'Not Rated';
    }
  };

  const getDifficultyBadgeColor = (difficulty: number) => {
    switch (difficulty) {
      case 1: return 'bg-gradient-to-r from-green-400 to-green-600';
      case 2: return 'bg-gradient-to-r from-blue-400 to-blue-600';
      case 3: return 'bg-gradient-to-r from-yellow-400 to-yellow-600';
      case 4: return 'bg-gradient-to-r from-orange-400 to-orange-600';
      case 5: return 'bg-gradient-to-r from-red-400 to-red-600';
      default: return 'bg-gradient-to-r from-gray-400 to-gray-600';
    }
  };

  // Voices state for TTS menus
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [showEnMenuFor, setShowEnMenuFor] = useState<'source' | 'target' | null>(null);

  if (!currentWord) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className={`bg-white rounded-3xl shadow-2xl w-full max-h-[90vh] overflow-hidden transition-[max-width] duration-300 ease-out ${aiOpen ? 'max-w-7xl' : 'max-w-4xl'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onClose}
                className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <h2 className="text-xl font-semibold">Word Evaluation</h2>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Progress */}
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">
                  {currentIndex + 1} / {totalWords}
                </span>
                <div className="w-24 h-2 bg-white/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white transition-all duration-500 ease-out"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Info Icon */}
              <div className="relative">
                <button
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                  className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
                
                {showTooltip && (
                  <div className="absolute top-full right-0 mt-2 p-3 bg-gray-800 text-white text-sm rounded-lg shadow-lg whitespace-nowrap z-[9999]">
                    <div className="space-y-1">
                      <div><strong>1-5:</strong> Rate difficulty</div>
                      <div><strong>Space:</strong> Reveal answer</div>
                      <div><strong>←→:</strong> Navigate</div>
                      <div><strong>ESC:</strong> Close</div>
                    </div>
                    <div className="absolute bottom-full right-4 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-800"></div>
                  </div>
                )}
              </div>

              {/* Format Toggle Button */}
              <button
                onClick={() => setLocalFormatReversed(!localFormatReversed)}
                className="px-4 py-2 text-sm rounded-xl transition flex items-center gap-2 bg-white/20 text-white/90 hover:text-white hover:bg-white/30"
                title="Toggle word format"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
                {localFormatReversed ? `${sourceLanguageName} → ${targetLanguageName}` : `${targetLanguageName} → ${sourceLanguageName}`}
              </button>

              {/* AI Assistant - Integrated panel */}
              <div className="flex items-center gap-1 p-1 rounded-2xl bg-white/20 backdrop-blur-sm">
                <button
                  onClick={() => { setIsChatMode(false); handleOpenAi(); }}
                  className={`px-4 py-2 text-sm rounded-xl transition-all duration-200 flex items-center gap-2 ${!isChatMode && aiOpen ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg' : 'text-white/90 hover:text-white hover:bg-white/20'}`}
                  title="AI Analysis - Get detailed word analysis with examples, synonyms, and tips"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <span>Analysis</span>
                </button>
                
                <div className="w-px h-6 bg-white/30"></div>
                
                <button
                  onClick={() => { setIsChatMode(true); setAiOpen(true); }}
                  className={`px-4 py-2 text-sm rounded-xl transition-all duration-200 flex items-center gap-2 ${isChatMode && aiOpen ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg' : 'text-white/90 hover:text-white hover:bg-white/20'}`}
                  title="AI Chat - Have a conversation about this word"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span>AI Chat</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content grid: left evaluation, right AI side panel */}
        <div className="p-6 md:p-8">
          <div className={`grid gap-6 ${aiOpen ? 'md:grid-cols-[minmax(0,1fr)_420px]' : 'md:grid-cols-1'}`}>
            {/* Left: evaluation flow */}
            <div>
          <div className="mb-8">
            {/* Flashcard Container */}
            <div className="relative bg-gradient-to-br from-slate-50 to-gray-100 rounded-3xl p-8 shadow-xl border border-gray-200">
              <div className="flex items-center justify-center gap-3 mb-4">
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-white border border-slate-200 text-slate-700 shadow-sm flex items-center gap-1">
                  {targetLanguageName}
                  {(() => {
                    const code = resolveLangCode(targetLanguageName);
                    let list = availableVoices.filter(v => v.lang?.toLowerCase().startsWith(code || ''));
                    const current = code ? (localStorage.getItem(getVoiceKey(code)) || '') : '';
                    if (!code || list.length === 0) return null;
                    // English: put popular accents on top, then a divider, then others
                    let popular: SpeechSynthesisVoice[] = [];
                    let others: SpeechSynthesisVoice[] = list;
                    if (code === 'en') {
                      const preferred = ['en-US','en-GB','en-AU','en-CA','en-IN'];
                      const pickFor = (lang: string) => {
                        const group = list.filter(v => (v.lang || '').toString() === lang);
                        if (group.length === 0) return undefined;
                        const google = group.find(v => (v.name || '').toLowerCase().includes('google'));
                        return google || group[0];
                      };
                      const picked = preferred.map(pickFor).filter(Boolean) as SpeechSynthesisVoice[];
                      const pickedSet = new Set(picked.map(v => v.name));
                      popular = picked; // small curated list
                      others = list.filter(v => !pickedSet.has(v.name));
                    }
                    return (
                    <span className="relative">
                      <button
                        onClick={() => setShowEnMenuFor(showEnMenuFor === 'target' ? null : 'target')}
                        className="-mr-1 p-1 rounded-lg hover:bg-slate-100 text-slate-600"
                        title="Choose voice"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
                      </button>
                      {showEnMenuFor === 'target' && (
                        <div className="absolute left-0 mt-2 w-56 max-h-60 overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg z-[9999]">
                          {(popular.length ? popular : list).map(v => (
                            <button
                              key={`top-${v.name}`}
                              onClick={() => { try{ localStorage.setItem(getVoiceKey(code), v.name); }catch{}; setShowEnMenuFor(null); }}
                              className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 ${current === v.name ? 'bg-blue-50 text-blue-700' : 'text-slate-700'}`}
                            >
                              {v.name} <span className="text-xs text-slate-500">({v.lang})</span>
                            </button>
                          ))}
                          {popular.length > 0 && others.length > 0 && (
                            <div className="my-1 mx-2 h-px bg-slate-200" />
                          )}
                          {others.length > 0 && popular.length > 0 && others.map(v => (
                            <button
                              key={`other-${v.name}`}
                              onClick={() => { try{ localStorage.setItem(getVoiceKey(code), v.name); }catch{}; setShowEnMenuFor(null); }}
                              className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 ${current === v.name ? 'bg-blue-50 text-blue-700' : 'text-slate-700'}`}
                            >
                              {v.name} <span className="text-xs text-slate-500">({v.lang})</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </span>
                    );
                  })()}
                </span>
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-white border border-slate-200 text-slate-700 shadow-sm flex items-center gap-1">
                  {sourceLanguageName}
                  {(() => {
                    const code = resolveLangCode(sourceLanguageName);
                    let list = availableVoices.filter(v => v.lang?.toLowerCase().startsWith(code || ''));
                    const current = code ? (localStorage.getItem(getVoiceKey(code)) || '') : '';
                    if (!code || list.length === 0) return null;
                    let popular: SpeechSynthesisVoice[] = [];
                    let others: SpeechSynthesisVoice[] = list;
                    if (code === 'en') {
                      const preferred = ['en-US','en-GB','en-AU','en-CA','en-IN'];
                      const pickFor = (lang: string) => {
                        const group = list.filter(v => (v.lang || '').toString() === lang);
                        if (group.length === 0) return undefined;
                        const google = group.find(v => (v.name || '').toLowerCase().includes('google'));
                        return google || group[0];
                      };
                      const picked = preferred.map(pickFor).filter(Boolean) as SpeechSynthesisVoice[];
                      const pickedSet = new Set(picked.map(v => v.name));
                      popular = picked;
                      others = list.filter(v => !pickedSet.has(v.name));
                    }
                    return (
                    <span className="relative">
                      <button
                        onClick={() => setShowEnMenuFor(showEnMenuFor === 'source' ? null : 'source')}
                        className="-mr-1 p-1 rounded-lg hover:bg-slate-100 text-slate-600"
                        title="Choose voice"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
                      </button>
                      {showEnMenuFor === 'source' && (
                        <div className="absolute left-0 mt-2 w-56 max-h-60 overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg z-[9999]">
                          {(popular.length ? popular : list).map(v => (
                            <button
                              key={`top-${v.name}`}
                              onClick={() => { try{ localStorage.setItem(getVoiceKey(code), v.name); }catch{}; setShowEnMenuFor(null); }}
                              className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 ${current === v.name ? 'bg-blue-50 text-blue-700' : 'text-slate-700'}`}
                            >
                              {v.name} <span className="text-xs text-slate-500">({v.lang})</span>
                            </button>
                          ))}
                          {popular.length > 0 && others.length > 0 && (
                            <div className="my-1 mx-2 h-px bg-slate-200" />
                          )}
                          {others.length > 0 && popular.length > 0 && others.map(v => (
                            <button
                              key={`other-${v.name}`}
                              onClick={() => { try{ localStorage.setItem(getVoiceKey(code), v.name); }catch{}; setShowEnMenuFor(null); }}
                              className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 ${current === v.name ? 'bg-blue-50 text-blue-700' : 'text-slate-700'}`}
                            >
                              {v.name} <span className="text-xs text-slate-500">({v.lang})</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </span>
                    );
                  })()}
                </span>
              </div>
              {/* First Language (Always Visible) */}
              <div className="text-center mb-6">
                    <div className="flex items-center justify-center gap-3">
                <h3 className="text-3xl font-bold text-gray-800 mb-2">
                  {localFormatReversed ? currentWord.text2 : currentWord.text1}
                </h3>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => speakWord(localFormatReversed ? currentWord.text2 : currentWord.text1, localFormatReversed ? sourceLanguageName : targetLanguageName)}
                          className="mb-2 p-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 shadow-sm hover:shadow transition"
                          title={`Kelimeyi dinle (${localFormatReversed ? sourceLanguageName : targetLanguageName})`}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5l-4 4H4v6h3l4 4V5z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.54 8.46a5 5 0 010 7.07M17.95 6.05a8 8 0 010 11.31" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleImageClick(localFormatReversed ? currentWord.text2 : currentWord.text1, localFormatReversed ? sourceLanguageName : targetLanguageName)}
                          className="mb-2 p-2 rounded-xl bg-purple-100 hover:bg-purple-200 border border-purple-200 text-purple-700 shadow-sm hover:shadow transition"
                          title="Show image"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    
              </div>
              
              {/* Divider */}
              <div className="flex items-center justify-center mb-6">
                <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                <div className="mx-4 text-gray-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>
                <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
              </div>
              
              {/* Second Language (Revealable) */}
              <div className="text-center">
                {isRevealed ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-3">
                      <h3 className="text-3xl font-bold text-gray-800">
                        {localFormatReversed ? currentWord.text1 : currentWord.text2}
                      </h3>
                      <button
                        onClick={() => speakWord(localFormatReversed ? currentWord.text1 : currentWord.text2, localFormatReversed ? targetLanguageName : sourceLanguageName)}
                        className="p-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 shadow-sm hover:shadow transition"
                        title={`Kelimeyi dinle (${localFormatReversed ? targetLanguageName : sourceLanguageName})`}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5l-4 4H4v6h3l4 4V5z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.54 8.46a5 5 0 010 7.07M17.95 6.05a8 8 0 010 11.31" />
                        </svg>
                      </button>
                    </div>
                    
                  </div>
                ) : (
                  <div className="flex justify-center items-center">
                    <button
                      onClick={() => setIsRevealed(true)}
                      className="group relative min-h-[80px] w-80 flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-200 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 overflow-hidden"
                    >
                      {/* Background pattern */}
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-100/20 via-transparent to-purple-100/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      
                      {/* Main content */}
                      <div className="relative flex items-center space-x-3">
                        <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full shadow-lg group-hover:shadow-xl transition-all duration-300">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-bold text-gray-700 group-hover:text-gray-800 transition-colors duration-300">
                            Click to reveal
                          </div>
                          <div className="text-sm text-gray-500 group-hover:text-gray-600 transition-colors duration-300">
                            Press Space key
                          </div>
                        </div>
                      </div>
                      
                      {/* Pulse animation */}
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-400/20 to-purple-400/20 animate-pulse opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </button>
                  </div>
                )}
                
                {/* Hide Button - Only show when revealed */}
                {isRevealed && (
                  <div className="flex justify-center mt-6">
                    <button
                      onClick={() => setIsRevealed(false)}
                      className="group relative px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 active:scale-95 bg-gradient-to-r from-gray-100 to-gray-200 border-2 border-gray-300 text-gray-600 hover:from-gray-200 hover:to-gray-300 hover:border-gray-400 hover:text-gray-700 shadow-lg hover:shadow-xl overflow-hidden"
                    >
                      {/* Background pattern */}
                      <div className="absolute inset-0 bg-gradient-to-r from-gray-200/20 via-transparent to-gray-300/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      
                      {/* Content */}
                      <div className="relative flex items-center space-x-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                        </svg>
                        <span>Hide Answer</span>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Selected Rating Indicator */}
          {currentWord.isEvaluated && (
            <div className="mb-6 text-center">
              <div className={`inline-flex items-center space-x-3 px-6 py-3 rounded-full text-lg font-bold animate-fadeIn shadow-lg ${getDifficultyBadgeColor(currentWord.difficulty)}`}>
                <span className="text-2xl">⭐</span>
                <span className="text-white">Difficulty: {getDifficultyLabel(currentWord.difficulty)}</span>
              </div>
            </div>
          )}

          {/* Rating Buttons */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
              {currentWord.isEvaluated ? 'You can change your rating below:' : 'How would you rate this word?'}
            </h3>
            
            <div className="grid grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5].map((rating) => (
                <div key={rating} className="flex flex-col items-center space-y-3">
                  <div className="relative">
                    <button
                      onClick={() => handleRate(rating as DifficultyLevel)}
                      className={`w-16 h-16 rounded-2xl text-xl font-extrabold transition-all duration-300 transform hover:scale-110 active:scale-95 shadow-xl hover:shadow-2xl ${
                        clickedRating === rating ? 'animate-bounce shadow-2xl' : ''
                      } ${
                        clickedRating === rating 
                          ? 'ring-4 ring-yellow-400 shadow-yellow-200'
                          : currentWord.difficulty === rating && currentWord.isEvaluated
                          ? getRatingButtonColor(rating, true) + ' rating-glow rating-selected'
                          : getRatingButtonColor(rating)
                      }`}
                    >
                      {rating}
                    </button>
                    
                    {/* Selected rating indicator */}
                    {currentWord.difficulty === rating && currentWord.isEvaluated && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg animate-pulse border-2 border-white">
                        <span className="text-white text-xs font-bold">✓</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Difficulty Label */}
                  <div className="text-center">
                    <div className={`text-sm font-semibold px-3 py-2 rounded-lg ${
                      currentWord.difficulty === rating && currentWord.isEvaluated
                        ? getRatingButtonColor(rating, true) + ' rating-glow rating-selected'
                        : getRatingButtonColor(rating)
                    }`}>
                      {getDifficultyLabel(rating)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between">
            <button
              onClick={onPrevious}
              disabled={currentIndex === 0}
              className={`group relative px-6 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center space-x-3 overflow-hidden ${
                currentIndex > 0
                  ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 text-blue-700 hover:from-blue-100 hover:to-indigo-100 hover:border-blue-300 hover:text-blue-800 shadow-lg hover:shadow-xl'
                  : 'bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {/* Background pattern for enabled state */}
              {currentIndex > 0 && (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-200/20 via-transparent to-indigo-200/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              )}
              
              {/* Content */}
              <div className="relative flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Previous</span>
              </div>
            </button>

            <button
              onClick={onClose}
              className="group relative px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 active:scale-95 bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 text-red-700 hover:from-red-100 hover:to-pink-100 hover:border-red-300 hover:text-red-800 shadow-lg hover:shadow-xl overflow-hidden"
            >
              {/* Background pattern */}
              <div className="absolute inset-0 bg-gradient-to-r from-red-200/20 via-transparent to-pink-200/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              {/* Content */}
              <div className="relative flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Stop Evaluation</span>
              </div>
            </button>

            <button
              onClick={onNext}
              disabled={currentIndex === totalWords - 1}
              className={`group relative px-6 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center space-x-3 overflow-hidden ${
                currentIndex < totalWords - 1
                  ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 text-green-700 hover:from-green-100 hover:to-emerald-100 hover:border-green-300 hover:text-green-800 shadow-lg hover:shadow-xl'
                  : 'bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {/* Background pattern for enabled state */}
              {currentIndex < totalWords - 1 && (
                <div className="absolute inset-0 bg-gradient-to-r from-green-200/20 via-transparent to-emerald-200/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              )}
              
              {/* Content */}
              <div className="relative flex items-center space-x-2">
                <span>Next</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
              </div>
            </div>

            {/* Right: AI side panel - chat style */}
            {aiOpen && (
              <aside className="bg-white rounded-3xl shadow-2xl ring-1 ring-slate-200 h-full md:max-h-[calc(90vh-160px)] md:sticky md:top-6 flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-white/70 backdrop-blur">
                  <div className="flex items-center gap-2">
                    <div className="text-xs text-slate-500">
                      {localFormatReversed 
                        ? `${sourceLanguageName} → ${targetLanguageName} · ${currentWord?.text2}${currentWord?.text1 ? ` / ${currentWord?.text1}` : ''}`
                        : `${targetLanguageName} → ${sourceLanguageName} · ${currentWord?.text1}${currentWord?.text2 ? ` / ${currentWord?.text2}` : ''}`
                      }
                    </div>
                  </div>
                                    <div className="flex items-center gap-2">
                    {!isChatMode && (
                      <button 
                        onClick={() => runAi('full')} 
                        disabled={aiLoading} 
                        className={`px-3 py-2 text-xs font-medium rounded-xl transition-all duration-200 flex items-center gap-2 ${aiLoading ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg hover:shadow-xl hover:scale-105'}`}
                        title="Refresh AI analysis"
                      >
                        <svg className={`w-3.5 h-3.5 ${aiLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>{aiLoading ? 'Loading...' : 'Refresh'}</span>
                      </button>
                    )}
                  </div>
                </div>
                {/* Body: chat or analysis */}
                {isChatMode ? (
                  <div className="flex-1 flex flex-col">
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-br from-white/60 to-slate-50 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
                      {chatMessages.map(m => {
                        if (m.role === 'assistant') {
                          // Parse lightweight "code blocks" for sections; render rest as normal text bubble
                          const text = m.text;
                          const exBlock = text.match(/```examples[\s\S]*?```/);
                          const tipsBlock = text.match(/```tips[\s\S]*?```/);
                          const clean = text
                            .replace(/```examples[\s\S]*?```/g, '')
                            .replace(/```tips[\s\S]*?```/g, '')
                            .trim();
                          const exItems = exBlock ? exBlock[0].replace(/```examples|```/g, '').split('\n').map(s => s.trim()).filter(s => s.startsWith('-')).map(s => s.replace(/^\-\s*/, '')) : [];
                          const tipItems = tipsBlock ? tipsBlock[0].replace(/```tips|```/g, '').split('\n').map(s => s.trim()).filter(s => s.startsWith('-')).map(s => s.replace(/^\-\s*/, '')) : [];

                          return (
                            <div key={m.id} className="flex justify-start">
                              <div className="max-w-[80%] space-y-3">
                                {clean && (
                                  <div className="px-4 py-3 rounded-2xl bg-white/85 text-slate-800 border border-slate-200 rounded-bl-sm shadow backdrop-blur whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: formatInlineText(clean, true) }} />
                                )}
                                {exItems.length > 0 && (
                                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3">
                                    <div className="text-xs uppercase tracking-wide text-emerald-700 font-semibold mb-2">Examples</div>
                                    <ul className="space-y-1">
                                      {exItems.map((e, i) => {
                                        const highlightedExample = e.replace(/\[\[w\]\](.*?)\[\[\/w\]\]/g, '<span class="underline decoration-blue-400 decoration-2 underline-offset-2 font-semibold text-slate-800">$1</span>');
                                        return (
                                          <li key={i} className="text-sm" dangerouslySetInnerHTML={{ __html: `• ${highlightedExample}` }} />
                                        );
                                      })}
                                    </ul>
                                  </div>
                                )}
                                {tipItems.length > 0 && (
                                  <div className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-3">
                                    <div className="text-xs uppercase tracking-wide text-indigo-700 font-semibold mb-2">Tips</div>
                                    <ul className="space-y-1">
                                      {tipItems.map((t, i) => {
                                        const highlightedTip = t.replace(/\[\[w\]\](.*?)\[\[\/w\]\]/g, '<span class="underline decoration-blue-400 decoration-2 underline-offset-2 font-semibold text-slate-800">$1</span>');
                                        return (
                                          <li key={i} className="text-sm" dangerouslySetInnerHTML={{ __html: `• ${highlightedTip}` }} />
                                        );
                                      })}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div key={m.id} className="flex justify-end">
                            <div className="max-w-[80%] px-4 py-2 rounded-2xl text-sm shadow bg-blue-600/90 text-white rounded-br-sm" dangerouslySetInnerHTML={{ __html: formatInlineText(m.text || '', false) }} />
                          </div>
                        );
                      })}
                      <div ref={chatEndRef} />
                    </div>
                    <div className="p-3 border-t border-slate-100 bg-white/70 backdrop-blur">
                      <div className="flex items-center gap-2">
                        <input
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          onKeyDown={(e) => { 
                            if (e.key === 'Enter') { 
                              e.preventDefault(); 
                              handleSendChat(); 
                            }
                            // Prevent 1,2,3,4 keys from triggering rating in chat
                            if (['1', '2', '3', '4', '5'].includes(e.key)) {
                              e.stopPropagation();
                            }
                          }}
                          placeholder="Mesaj yaz..."
                          className="flex-1 px-4 py-3 rounded-xl border border-slate-200 bg-white/90 shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-100"
                        />
                        <button onClick={handleSendChat} className="px-4 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 shadow">
                          Gönder
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 overflow-auto p-4 space-y-4">
                    {showLangIntro && (
                      <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-sm font-semibold text-blue-800">Choose AI answer language</div>
                          <span className="text-xs text-blue-700">You can change later in Settings</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="relative">
                            <select
                              value={introLang}
                              onChange={(e) => setIntroLang(e.target.value)}
                              className="w-full appearance-none px-4 py-3 rounded-xl border border-blue-200 bg-white/90 text-slate-800 shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-100"
                            >
                              {getUniqueLanguages().map(l => (
                                <option key={l.code} value={l.name}>{l.name}</option>
                              ))}
                            </select>
                            <svg className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                try {
                                  localStorage.setItem('word-rating-system-ai-language', introLang);
                                  localStorage.setItem('word-rating-system-ai-language-asked', '1');
                                } catch {}
                                setShowLangIntro(false);
                                if (!aiLoading) runAi('full');
                              }}
                              className="px-4 py-3 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 shadow"
                            >
                              Continue
                            </button>
                            <button
                              onClick={() => { setShowLangIntro(false); if (!aiLoading) runAi('full'); }}
                              className="px-4 py-3 rounded-xl bg-white text-blue-700 text-sm font-medium ring-1 ring-blue-200 hover:bg-blue-50"
                            >
                              Skip
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                    {!aiResult && !aiLoading && !aiError && (
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm text-slate-700 flex items-center justify-between">
                        <span>Analyze this word with AI?</span>
                        <div className="flex gap-2">
                          <button onClick={() => runAi('full')} className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs hover:bg-blue-700">Analyze</button>
                          <button onClick={() => setAiOpen(false)} className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs hover:bg-slate-200">Not now</button>
                        </div>
                      </div>
                    )}
                                         {aiLoading && (
                       <div className="flex items-center justify-center py-8">
                         <div className="text-center">
                           <div className="flex items-center justify-center gap-2 mb-2">
                             <span className="relative inline-flex h-4 w-4">
                               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                               <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-500"></span>
                             </span>
                             <span className="text-slate-600 text-sm font-medium">AI is preparing explanation...</span>
                           </div>
                           <div className="text-slate-400 text-xs">This may take a few seconds</div>
                         </div>
                       </div>
                     )}
                    {aiError && !aiLoading && (
                      <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-2xl shadow border border-red-200">
                        {aiError}
                      </div>
                    )}
                    {!aiLoading && !aiError && aiResult && (
                      <div className="space-y-6">
                        {/* Word Header */}
                        <div className="rounded-2xl border border-slate-200 p-4 bg-gradient-to-br from-slate-50 to-white shadow-sm">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <h3 className="text-2xl font-bold text-slate-900">{currentWord?.text1}</h3>
                              <button
                                onClick={() => {
                                  if ('speechSynthesis' in window) {
                                    const utterance = new SpeechSynthesisUtterance(currentWord?.text1);
                                    utterance.lang = resolveLangCode(targetLanguageName) || 'en-US';
                                    speechSynthesis.speak(utterance);
                                  }
                                }}
                                className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                                title="Listen pronunciation"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/>
                                </svg>
                              </button>
                            </div>
                            <div className="flex items-center gap-2">
                                                              <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                                 {aiResult.partOfSpeech || 'Unknown'}
                               </span>
                               <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                                 {aiResult.cefrLevel || 'A1'}
                               </span>
                            </div>
                          </div>
                                                     <div className="space-y-1">
                             <div className="text-slate-600 text-sm font-mono">
                               /{aiResult.pronunciation || 'prəˌnʌnsiˈeɪʃən'}/
                             </div>
                             <div className="text-slate-500 text-xs">
                               {aiResult.alternativePronunciation || 'duh · mand'}
                             </div>
                           </div>
                        </div>
                        {/* Definition */}
                        {(aiResult.definition || aiResult.partOfSpeech) && (
                          <div className="rounded-2xl border border-sky-200 p-4 bg-gradient-to-br from-sky-50 to-white shadow-sm">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11h8M8 15h6M12 7h.01"/></svg>
                              </div>
                              <div className="text-sm font-semibold text-sky-800">Definition</div>
                              <span className="ml-auto inline-flex items-center text-[10px] px-2 py-0.5 rounded-full bg-sky-100 text-sky-700">{aiResult.partOfSpeech || 'info'}</span>
                            </div>
                            <div className="text-slate-800 text-sm leading-relaxed">
                              <div
                                className="prose prose-sm max-w-none text-slate-800"
                                dangerouslySetInnerHTML={{ __html: formatInlineText(aiResult.definition || '', true) }}
                              />
                              <div className="mt-3">
                                <details className="group">
                                  <summary className="cursor-pointer text-xs text-blue-700 hover:underline">Show explanation in {targetLanguageName}</summary>
                                  <div className="mt-2 text-slate-700 text-sm">
                                    {altDefinition ? (
                                      <div className="mt-1" dangerouslySetInnerHTML={{ __html: formatInlineText(altDefinition, true) }} />
                                    ) : (
                                      <div className="text-slate-400 text-xs">Loading…</div>
                                    )}
                                  </div>
                                </details>
                              </div>
                            </div>
                          </div>
                        )}
                        {/* Verb Forms */}
                        {aiResult.verbForms && aiResult.partOfSpeech?.toLowerCase().includes('verb') && (
                          <div className="rounded-xl border border-purple-200 p-4 bg-gradient-to-br from-purple-50 to-white shadow-sm">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                                </svg>
                              </div>
                              <div className="text-sm font-semibold text-purple-700">Verb Forms</div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2">
                              {/* 1st Form - Infinitive */}
                              <div className="bg-white/60 rounded-lg p-2 border border-purple-100">
                                <div className="flex items-center gap-1 mb-1">
                                  <div className="w-4 h-4 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold">1</div>
                                  <span className="text-xs font-medium text-purple-700">Infinitive</span>
                                </div>
                                <div className="text-sm font-bold text-slate-800">
                                  {aiResult.verbForms.infinitive}
                                </div>
                              </div>

                              {/* 2nd Form - Past */}
                              <div className="bg-white/60 rounded-lg p-2 border border-purple-100">
                                <div className="flex items-center gap-1 mb-1">
                                  <div className="w-4 h-4 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold">2</div>
                                  <span className="text-xs font-medium text-purple-700">Past</span>
                                </div>
                                <div className="text-sm font-bold text-slate-800">
                                  {aiResult.verbForms.past}
                                </div>
                              </div>

                              {/* 3rd Form - Past Participle */}
                              <div className="bg-white/60 rounded-lg p-2 border border-purple-100">
                                <div className="flex items-center gap-1 mb-1">
                                  <div className="w-4 h-4 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold">3</div>
                                  <span className="text-xs font-medium text-purple-700">Past Part.</span>
                                </div>
                                <div className="text-sm font-bold text-slate-800">
                                  {aiResult.verbForms.pastParticiple}
                                </div>
                              </div>

                              {/* 4th Form - Present Participle */}
                              <div className="bg-white/60 rounded-lg p-2 border border-purple-100">
                                <div className="flex items-center gap-1 mb-1">
                                  <div className="w-4 h-4 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold">4</div>
                                  <span className="text-xs font-medium text-purple-700">Present Part.</span>
                                </div>
                                <div className="text-sm font-bold text-slate-800">
                                  {aiResult.verbForms.presentParticiple}
                                </div>
                              </div>

                              {/* 5th Form - 3rd Person Singular */}
                              <div className="bg-white/60 rounded-lg p-2 border border-purple-100 col-span-2">
                                <div className="flex items-center gap-1 mb-1">
                                  <div className="w-4 h-4 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold">5</div>
                                  <span className="text-xs font-medium text-purple-700">3rd Person Singular</span>
                                </div>
                                <div className="text-sm font-bold text-slate-800">
                                  {aiResult.verbForms.thirdPersonSingular}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        {aiResult.examples && aiResult.examples.length > 0 && (
                          <div className="rounded-2xl border border-emerald-200 p-4 bg-gradient-to-br from-emerald-50 to-white shadow-sm">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                              </div>
                              <div className="text-sm font-semibold text-emerald-700">Examples</div>
                            </div>
                            <ul className="space-y-2">
                              {aiResult.examples.map((ex, idx) => {
                                // Simple and reliable [[w]] tag replacement
                                const highlightedSentence = ex.sentence.replace(/\[\[w\]\](.*?)\[\[\/w\]\]/g, '<span class="underline decoration-blue-400 decoration-2 underline-offset-2 font-semibold text-slate-800">$1</span>');
                                
                                return (
                                  <li key={idx} className="text-sm">
                                    <div className="text-slate-800" dangerouslySetInnerHTML={{ __html: highlightedSentence }} />
                                    {ex.translation && (
                                      <div 
                                        className="text-slate-500" 
                                        dangerouslySetInnerHTML={{ __html: formatInlineText(ex.translation, true) }} 
                                      />
                                    )}
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        )}
                        {aiResult.synonyms && aiResult.synonyms.length > 0 && (() => {
                          const primarySynIdx = Math.max(0, aiResult.synonyms.findIndex((s) => s.isExact));
                          return (
                            <div className="rounded-2xl border border-amber-200 p-4 bg-gradient-to-br from-amber-50 to-white shadow-sm">
                              <div className="flex items-center gap-2 mb-3">
                                <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
                                </div>
                                <div className="text-sm font-semibold text-amber-700">Synonyms</div>
                              </div>
                                                             <div className="flex flex-wrap gap-2">
                                 {aiResult.synonyms.slice(0, 8).map((s, idx) => (
                                  <span
                                    key={idx}
                                    title={idx === primarySynIdx ? 'Exact synonym (closest) – highlighted as primary' : s.isExact ? 'Exact synonym' : 'Similar meaning'}
                                    className={`px-2.5 py-1.5 rounded-full text-xs font-medium flex items-center gap-1 ${s.isExact ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-amber-100 text-amber-800'}`}
                                  >
                                    {s.word}
                                    {idx === primarySynIdx && (
                                      <svg className="text-amber-600 w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.968 0 1.371 1.24.588 1.81l-2.802 2.036a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.802-2.036a1 1 0 00-1.176 0l-2.802 2.036c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L3.88 8.72c-.783-.57-.38-1.81.588-1.81H7.93a1 1 0 00.951-.69l1.07-3.292z"/>
                                      </svg>
                                    )}
                                  </span>
                                ))}
                              </div>
                            </div>
                          );
                        })()}
                        {aiResult.antonyms && aiResult.antonyms.length > 0 && (() => {
                          const primaryAntIdx = Math.max(0, aiResult.antonyms.findIndex((a) => a.isExact));
                          return (
                            <div className="rounded-2xl border border-red-200 p-4 bg-gradient-to-br from-red-50 to-white shadow-sm">
                              <div className="flex items-center gap-2 mb-3">
                                <div className="w-8 h-8 rounded-full bg-red-100 text-red-700 flex items-center justify-center">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                                </div>
                                <div className="text-sm font-semibold text-red-700">Antonyms</div>
                              </div>
                                                             <div className="flex flex-wrap gap-2">
                                 {aiResult.antonyms.slice(0, 8).map((a, idx) => (
                                  <span
                                    key={idx}
                                    title={idx === primaryAntIdx ? 'Exact antonym (clearest opposite) – highlighted as primary' : a.isExact ? 'Exact antonym' : 'Opposite meaning (near)'}
                                    className={`px-2.5 py-1.5 rounded-full text-xs font-medium flex items-center gap-1 ${a.isExact ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-orange-100 text-orange-800'}`}
                                  >
                                    {a.word}
                                    {idx === primaryAntIdx && (
                                      <svg className="text-red-600 w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.968 0 1.371 1.24.588 1.81l-2.802 2.036a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.802-2.036a1 1 0 00-1.176 0l-2.802 2.036c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L3.88 8.72c-.783-.57-.38-1.81.588-1.81H7.93a1 1 0 00.951-.69l1.07-3.292z"/>
                                      </svg>
                                    )}
                                  </span>
                                ))}
                              </div>
                            </div>
                          );
                        })()}
                        {aiResult.tips && aiResult.tips.length > 0 && (
                          <div className="rounded-2xl border border-indigo-200 p-4 bg-gradient-to-br from-indigo-50 to-white shadow-sm">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3c-3.866 0-7 3.134-7 7 0 2.761 1.5 5.158 3.75 6.32V18a.75.75 0 00.75.75h5a.75.75 0 00.75-.75v-1.68C17.5 15.158 19 12.761 19 10c0-3.866-3.134-7-7-7zm-3 18a3 3 0 006 0H9z"/></svg>
                              </div>
                              <div className="text-sm font-semibold text-indigo-700">Tips</div>
                            </div>
                            <ul className="list-disc pl-5 space-y-1">
                              {aiResult.tips.map((t, idx) => (
                                <li key={idx} className="text-sm text-slate-800" dangerouslySetInnerHTML={{ __html: formatInlineText(t, true) }} />
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                    {!aiLoading && !aiError && !aiResult && (
                      <div className="text-xs text-slate-500">No data found. Click “Refresh” to get information about the word.</div>
                    )}
                  </div>
                )}
              </aside>
            )}
          </div>
        </div>
      </div>
      {/* Chat integrated in AI panel; no separate modal */}
      
      {/* Image Modal */}
      <ImageModal
        word={currentImageWord}
        languageName={currentImageLanguage}
        isOpen={showImageModal}
        onClose={() => setShowImageModal(false)}
      />
    </div>
  );
};

export default EvaluationModal;
