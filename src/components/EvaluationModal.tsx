import React, { useState, useEffect } from 'react';
import { generateAiContent, AiResult } from '../utils/ai';
import { Word, DifficultyLevel } from '../types';
import { getLanguageByName } from '../utils/languages';

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
  const [followupText, setFollowupText] = useState('');
  const [aiMessages, setAiMessages] = useState<Array<{ role: 'user' | 'assistant'; text?: string; result?: AiResult }>>([]);
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedEnVoiceName, setSelectedEnVoiceName] = useState<string | null>(() => {
    try { return localStorage.getItem('tts-en-voice') || null; } catch { return null; }
  });
  const [showEnMenuFor, setShowEnMenuFor] = useState<'source' | 'target' | null>(null);
  

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
    setAiChatOpen(false);
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
      const result = await generateAiContent({
        word: currentWord.text1,
        sourceLanguageName,
        targetLanguageName,
        mode,
        userQuestion: mode === 'followup' ? followupText : undefined
      });
      setAiResult(result);
      setAiOpen(true);
      if (mode === 'followup') {
        // Append assistant message for follow-up
        setAiMessages((prev) => [...prev, { role: 'assistant', result }]);
      } else {
        // Initial or other modes: show as assistant message
        if (aiMessages.length === 0) {
          setAiMessages([{ role: 'assistant', result }]);
        } else {
          setAiMessages((prev) => [...prev, { role: 'assistant', result }]);
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
        // Auto-load full content on first open
        if (aiMessages.length === 0 && !aiLoading) {
          runAi('full');
        }
        setAiChatOpen(false);
      }
      return next;
    });
  };

  const handleSendFollowup = () => {
    if (!followupText.trim() || aiLoading) return;
    // Push user message then run follow-up
    setAiMessages((prev) => [...prev, { role: 'user', text: followupText.trim() }]);
    runAi('followup');
    setFollowupText('');
  };

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

  const englishVoices = availableVoices.filter(v => v.lang?.toLowerCase().startsWith('en'));
  const saveSelectedEnVoice = (name: string) => {
    setSelectedEnVoiceName(name);
    try { localStorage.setItem('tts-en-voice', name); } catch {}
  };

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

              {/* AI Assistant - Integrated panel */}
              <button
                onClick={handleOpenAi}
                className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl shadow transition-all duration-200 flex items-center gap-2"
                title="AI Assistant"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                AI
              </button>
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
                    const list = availableVoices.filter(v => v.lang?.toLowerCase().startsWith(code || ''));
                    const current = code ? (localStorage.getItem(getVoiceKey(code)) || '') : '';
                    if (!code || list.length === 0) return null;
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
                          {list.map(v => (
                            <button
                              key={v.name}
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
                    const list = availableVoices.filter(v => v.lang?.toLowerCase().startsWith(code || ''));
                    const current = code ? (localStorage.getItem(getVoiceKey(code)) || '') : '';
                    if (!code || list.length === 0) return null;
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
                          {list.map(v => (
                            <button
                              key={v.name}
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
                  {currentWord.text1}
                </h3>
                      <button
                        onClick={() => speakWord(currentWord.text1, targetLanguageName)}
                        className="mb-2 p-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 shadow-sm hover:shadow transition"
                        title={`Kelimeyi dinle (${targetLanguageName})`}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5l-4 4H4v6h3l4 4V5z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.54 8.46a5 5 0 010 7.07M17.95 6.05a8 8 0 010 11.31" />
                        </svg>
                      </button>
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
                        {currentWord.text2}
                      </h3>
                      <button
                        onClick={() => speakWord(currentWord.text2, sourceLanguageName)}
                        className="p-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 shadow-sm hover:shadow transition"
                        title={`Kelimeyi dinle (${sourceLanguageName})`}
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
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="text-base font-semibold text-slate-800">AI Assistant</div>
                    <div className="text-xs text-slate-500">{sourceLanguageName} → {targetLanguageName} · {currentWord?.text1}{currentWord?.text2 ? ` / ${currentWord?.text2}` : ''}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => runAi('full')} disabled={aiLoading} className={`px-3 py-1.5 rounded-xl text-xs font-medium ${aiLoading ? 'bg-slate-200 text-slate-500' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>Yenile</button>
                    <button onClick={() => setAiChatOpen((v) => !v)} className={`px-3 py-1.5 rounded-xl text-xs font-medium ${aiChatOpen ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}>Chat</button>
                  </div>
                </div>
                {/* Body Scroll */}
                <div className="flex-1 overflow-auto p-4 space-y-4">
                  {!aiResult && !aiLoading && !aiError && (
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm text-slate-700 flex items-center justify-between">
                      <span>Analyze this word with AI?</span>
                      <div className="flex gap-2">
                        <button onClick={() => runAi('full')} className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs hover:bg-blue-700">Analyze</button>
                        <button onClick={() => setAiOpen(false)} className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs hover:bg-slate-200">Not now</button>
                      </div>
                    </div>
                  )}
                  {/* Loading skeleton */}
                  {aiLoading && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-slate-500 text-sm">
                        <span className="relative inline-flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                        </span>
                        AI is thinking...
                      </div>
                      <div className="animate-pulse space-y-2">
                        <div className="h-4 w-32 bg-slate-200 rounded"></div>
                        <div className="h-3 w-4/5 bg-slate-200 rounded"></div>
                        <div className="h-3 w-3/5 bg-slate-200 rounded"></div>
                        <div className="h-4 w-24 bg-slate-200 rounded mt-4"></div>
                        <div className="h-3 w-11/12 bg-slate-200 rounded"></div>
                        <div className="h-3 w-10/12 bg-slate-200 rounded"></div>
                        <div className="h-3 w-9/12 bg-slate-200 rounded"></div>
                      </div>
                    </div>
                  )}
                  {/* Error */}
                  {aiError && !aiLoading && (
                    <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-2xl shadow border border-red-200">
                      {aiError}
                    </div>
                  )}
                  {/* AI Card */}
                  {!aiLoading && !aiError && aiResult && (
                    <div className="space-y-6">
                      {/* Definition */}
                      {(aiResult.definition || aiResult.partOfSpeech) && (
                        <div className="rounded-2xl border border-slate-200 p-4 bg-gradient-to-br from-slate-50 to-white shadow-sm">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                              </div>
                              <div className="text-sm font-semibold text-slate-800">Definition</div>
                            </div>
                            {aiResult.partOfSpeech && (<span className="px-2 py-1 rounded-full bg-slate-100 text-slate-600 text-xs">{aiResult.partOfSpeech}</span>)}
                          </div>
                          {aiResult.definition && (
                            <div className="text-slate-800 text-sm leading-relaxed">{aiResult.definition}</div>
                          )}
                        </div>
                      )}
                      {/* Examples */}
                      {aiResult.examples && aiResult.examples.length > 0 && (
                        <div className="rounded-2xl border border-emerald-200 p-4 bg-gradient-to-br from-emerald-50 to-white shadow-sm">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                            </div>
                            <div className="text-sm font-semibold text-emerald-700">Examples</div>
                          </div>
                          <ul className="space-y-2">
                            {aiResult.examples.map((ex, idx) => (
                              <li key={idx} className="text-sm">
                                <div className="text-slate-800">{ex.sentence}</div>
                                {ex.translation && <div className="text-slate-500">{ex.translation}</div>}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {/* Synonyms */}
                      {aiResult.synonyms && aiResult.synonyms.length > 0 && (
                        <div className="rounded-2xl border border-amber-200 p-4 bg-gradient-to-br from-amber-50 to-white shadow-sm">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
                            </div>
                            <div className="text-sm font-semibold text-amber-700">Synonyms</div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {aiResult.synonyms.map((s, idx) => (
                              <span key={idx} className="px-2.5 py-1.5 rounded-full bg-amber-100 text-amber-800 text-xs font-medium">{s}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {/* Tips */}
                      {aiResult.tips && aiResult.tips.length > 0 && (
                        <div className="rounded-2xl border border-indigo-200 p-4 bg-gradient-to-br from-indigo-50 to-white shadow-sm">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3"/></svg>
                            </div>
                            <div className="text-sm font-semibold text-indigo-700">Tips</div>
                          </div>
                          <ul className="list-disc pl-5 space-y-1">
                            {aiResult.tips.map((t, idx) => (
                              <li key={idx} className="text-sm text-slate-800">{t}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                  {/* Empty state */}
                  {!aiLoading && !aiError && !aiResult && (
                    <div className="text-xs text-slate-500">Veri yok. "Yenile" ile tekrar deneyin.</div>
                  )}
                  {/* Chat area toggle */}
                  {aiChatOpen && (
                    <div className="pt-2 border-t border-slate-100">
                      <div className="text-xs font-semibold text-slate-500 mb-2">Chat</div>
                      {/* Chat messages */}
                      <div className="space-y-3">
                        {aiMessages.map((m, idx) => (
                          <div key={idx} className={`flex ${m.role === 'assistant' ? 'justify-start' : 'justify-end'}`}>
                            {m.role === 'user' ? (
                              <div className="max-w-[80%] bg-blue-600 text-white text-sm px-4 py-3 rounded-2xl rounded-br-sm shadow">{m.text}</div>
                            ) : (
                              <div className="max-w-[85%] bg-slate-50 text-slate-800 text-sm px-4 py-3 rounded-2xl rounded-bl-sm shadow border border-slate-200">
                                {m.result ? (
                                  <div className="space-y-2">
                                    {m.result.definition && <div>{m.result.definition}</div>}
                                  </div>
                                ) : '...'}
                              </div>
                            )}
                          </div>
                        ))}
                        {aiLoading && (
                          <div className="flex justify-start">
                            <div className="max-w-[70%] bg-slate-50 text-slate-600 text-sm px-4 py-3 rounded-2xl rounded-bl-sm shadow border border-slate-200">
                              <div className="flex items-center gap-2">
                                <span>AI yazıyor</span>
                                <span className="flex gap-1">
                                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.2s]"></span>
                                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0s]"></span>
                                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                {/* Composer (visible only when chat open) */}
                {aiChatOpen && (
                  <div className="p-3 border-t border-slate-100 bg-white">
                    <div className="flex items-end gap-2">
                      <div className="flex-1 relative">
                        <textarea
                          value={followupText}
                          onChange={(e) => setFollowupText(e.target.value)}
                          rows={1}
                          placeholder="Kısa bir soru yaz (kullanım, kalıplar, karışıklıklar...)"
                          className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-2 pr-10 text-sm focus:outline-none focus:ring-4 focus:ring-blue-100"
                          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendFollowup(); } }}
                        />
                        {followupText && (
                          <button onClick={() => setFollowupText('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-slate-100">
                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                      <button
                        onClick={handleSendFollowup}
                        disabled={!followupText.trim() || aiLoading}
                        className={`px-4 py-2 rounded-2xl text-white text-sm font-medium ${followupText.trim() && !aiLoading ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-300 cursor-not-allowed'}`}
                        title="Gönder"
                      >
                        Gönder
                      </button>
                    </div>
                  </div>
                )}
              </aside>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EvaluationModal;
