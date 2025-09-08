import React, { useState, useEffect, useCallback } from 'react';
import { generateAiContent, generateDefinitionOnly, AiResult } from '../../utils/ai';
import { Word } from '../../types';
import { getLanguageByName, getUniqueLanguages } from '../../utils/languages';

interface StudyAiAnalysisProps {
  currentWord: Word | null;
  sourceLanguageName: string;
  targetLanguageName: string;
  isOpen: boolean;
  onClose: () => void;
  isEmbedded?: boolean;
}

const StudyAiAnalysis: React.FC<StudyAiAnalysisProps> = ({
  currentWord,
  sourceLanguageName,
  targetLanguageName,
  isOpen,
  onClose,
  isEmbedded = false
}) => {
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<AiResult | null>(null);
  const [altDefinition, setAltDefinition] = useState<string>('');
  const [showLangIntro, setShowLangIntro] = useState(false);
  const [introLang, setIntroLang] = useState<string>('English');

  // Reset AI content when word changes
  useEffect(() => {
    if (currentWord) {
      setAiResult(null);
      setAiError(null);
      setAltDefinition('');
    }
  }, [currentWord?.id]);

  // Load AI content when panel opens
  useEffect(() => {
    if (isOpen && currentWord && !aiResult && !aiLoading) {
      handleRunAi();
    }
  }, [isOpen, currentWord]);

  // Listen for refresh event from parent
  useEffect(() => {
    const handleRefresh = () => {
      if (isOpen) {
        handleRunAi();
      }
    };

    window.addEventListener('refresh-ai-analysis', handleRefresh);
    return () => window.removeEventListener('refresh-ai-analysis', handleRefresh);
  }, [isOpen]);

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

  const handleRunAi = async () => {
    if (!currentWord) return;
    
    try {
      setAiError(null);
      setAiLoading(true);
      
      // Check if language preference is set
      let preferred = 'English';
      try { 
        preferred = localStorage.getItem('word-rating-system-ai-language') || 'English'; 
      } catch {}
      
      // Show language intro if not asked before
      const asked = localStorage.getItem('word-rating-system-ai-language-asked') === '1';
      if (!asked) {
        setIntroLang(preferred);
        setShowLangIntro(true);
        setAiLoading(false);
        return;
      }

      const result = await generateAiContent({
        word: currentWord.text1,
        sourceLanguageName,
        examplesLanguageName: sourceLanguageName, // Examples should be in the first word's language
        explanationLanguageName: preferred || targetLanguageName,
        mode: 'full'
      });
      
      setAiResult(result);
      
      // Pre-fetch alternative definition
      try {
        const def = await generateDefinitionOnly({
          word: currentWord.text1,
          examplesLanguageName: sourceLanguageName, // Examples should be in the first word's language
          explanationLanguageName: targetLanguageName,
          sourceLanguageName
        });
        setAltDefinition(def || '');
      } catch {
        setAltDefinition('');
      }
      
    } catch (err: any) {
      setAiError(err?.message || 'AI request failed');
    } finally {
      setAiLoading(false);
    }
  };

  const handleLanguageSelect = () => {
    try {
      localStorage.setItem('word-rating-system-ai-language', introLang);
      localStorage.setItem('word-rating-system-ai-language-asked', '1');
    } catch {}
    setShowLangIntro(false);
    handleRunAi();
  };

  const handleRefresh = () => {
    setAiResult(null);
    setAiError(null);
    handleRunAi();
  };

  if (!isOpen) return null;

  // Embedded mode - just return the content without modal wrapper
  if (isEmbedded) {
    return (
      <div className="space-y-4">
        {/* Content */}
        <div className="space-y-4">
          {showLangIntro && (
            <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4 shadow-sm mb-4">
              <div className="text-center mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg ring-2 ring-blue-100">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-blue-800 mb-1">Choose AI Answer Language</h3>
                <p className="text-blue-600 text-xs">Select your preferred language for AI explanations</p>
              </div>
              
              <div className="max-w-sm mx-auto">
                <div className="relative mb-3">
                  <select
                    value={introLang}
                    onChange={(e) => setIntroLang(e.target.value)}
                    className="w-full appearance-none px-3 py-2 rounded-lg border border-blue-200 bg-white text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-100 text-sm"
                  >
                    {getUniqueLanguages().map(l => (
                      <option key={l.code} value={l.name}>{l.name}</option>
                    ))}
                  </select>
                  <svg className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                  </svg>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={handleLanguageSelect}
                    className="flex-1 px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 shadow"
                  >
                    Continue
                  </button>
                  <button
                    onClick={() => { setShowLangIntro(false); handleRunAi(); }}
                    className="flex-1 px-3 py-2 rounded-lg bg-white text-blue-700 text-sm font-medium ring-1 ring-blue-200 hover:bg-blue-50"
                  >
                    Skip
                  </button>
                </div>
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
                  <span className="text-slate-600 text-sm font-medium">AI is analyzing...</span>
                </div>
                <div className="text-slate-400 text-xs">This may take a few seconds</div>
              </div>
            </div>
          )}

          {aiError && !aiLoading && (
            <div className="bg-red-50 text-red-700 text-xs px-4 py-3 rounded-xl shadow border border-red-200 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-semibold">Error</span>
              </div>
              {aiError}
            </div>
          )}

          {!aiLoading && !aiError && aiResult && (
            <div className="space-y-4">
              {/* Word Header */}
              <div className="rounded-xl border border-slate-200 p-4 bg-gradient-to-br from-slate-50 to-white shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold text-slate-900">{currentWord?.text1}</h3>
                    <button
                      onClick={() => {
                        if ('speechSynthesis' in window) {
                          const utterance = new SpeechSynthesisUtterance(currentWord?.text1 || '');
                          utterance.lang = getLanguageByName(targetLanguageName)?.code || 'en-US';
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
                  <div className="flex items-center gap-1">
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
                <div className="rounded-xl border border-sky-200 p-4 bg-gradient-to-br from-sky-50 to-white shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11h8M8 15h6M12 7h.01"/>
                      </svg>
                    </div>
                    <div className="text-sm font-semibold text-sky-800">Definition</div>
                    <span className="ml-auto inline-flex items-center text-xs px-2 py-1 rounded-full bg-sky-100 text-sky-700">
                      {aiResult.partOfSpeech || 'info'}
                    </span>
                  </div>
                  <div className="text-slate-800 text-sm leading-relaxed">
                    <div
                      className="prose prose-sm max-w-none text-slate-800"
                      dangerouslySetInnerHTML={{ __html: formatInlineText(aiResult.definition || '', true) }}
                    />
                    <div className="mt-2">
                      <details className="group">
                        <summary className="cursor-pointer text-xs text-blue-700 hover:underline font-medium">
                          Show explanation in {targetLanguageName}
                        </summary>
                        <div className="mt-2 text-slate-700 text-xs">
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

              {/* Examples */}
              {aiResult.examples && aiResult.examples.length > 0 && (
                <div className="rounded-xl border border-emerald-200 p-4 bg-gradient-to-br from-emerald-50 to-white shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                    </div>
                    <div className="text-sm font-semibold text-emerald-700">Examples</div>
                  </div>
                  <ul className="space-y-2">
                    {aiResult.examples.map((ex, idx) => {
                      const highlightedSentence = ex.sentence.replace(/\[\[w\]\](.*?)\[\[\/w\]\]/g, '<span class="underline decoration-blue-400 decoration-2 underline-offset-2 font-semibold text-slate-800">$1</span>');
                      
                      return (
                        <li key={idx} className="text-sm">
                          <div className="text-slate-800" dangerouslySetInnerHTML={{ __html: highlightedSentence }} />
                          {ex.translation && (
                            <div 
                              className="text-slate-500 mt-1 text-xs" 
                              dangerouslySetInnerHTML={{ __html: formatInlineText(ex.translation, true) }} 
                            />
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {/* Synonyms */}
              {aiResult.synonyms && aiResult.synonyms.length > 0 && (() => {
                const primarySynIdx = Math.max(0, aiResult.synonyms.findIndex((s) => s.isExact));
                return (
                  <div className="rounded-xl border border-amber-200 p-4 bg-gradient-to-br from-amber-50 to-white shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                        </svg>
                      </div>
                      <div className="text-sm font-semibold text-amber-700">Synonyms</div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {aiResult.synonyms.slice(0, 6).map((s, idx) => (
                        <span
                          key={idx}
                          title={idx === primarySynIdx ? 'Exact synonym (closest) – highlighted as primary' : s.isExact ? 'Exact synonym' : 'Similar meaning'}
                          className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${s.isExact ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-amber-100 text-amber-800'}`}
                        >
                          {s.word}
                          {idx === primarySynIdx && (
                            <svg className="text-amber-600 w-3 h-3" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.968 0 1.371 1.24.588 1.81l-2.802 2.036a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.802-2.036a1 1 0 00-1.176 0l-2.802 2.036c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L3.88 8.72c-.783-.57-.38-1.81.588-1.81H7.93a1 1 0 00.951-.69l1.07-3.292z"/>
                            </svg>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Antonyms */}
              {aiResult.antonyms && aiResult.antonyms.length > 0 && (() => {
                const primaryAntIdx = Math.max(0, aiResult.antonyms.findIndex((a) => a.isExact));
                return (
                  <div className="rounded-xl border border-red-200 p-4 bg-gradient-to-br from-red-50 to-white shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-full bg-red-100 text-red-700 flex items-center justify-center">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                      </div>
                      <div className="text-sm font-semibold text-red-700">Antonyms</div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {aiResult.antonyms.slice(0, 6).map((a, idx) => (
                        <span
                          key={idx}
                          title={idx === primaryAntIdx ? 'Exact antonym (clearest opposite) – highlighted as primary' : a.isExact ? 'Exact antonym' : 'Opposite meaning (near)'}
                          className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${a.isExact ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-orange-100 text-orange-800'}`}
                        >
                          {a.word}
                          {idx === primaryAntIdx && (
                            <svg className="text-red-600 w-3 h-3" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.968 0 1.371 1.24.588 1.81l-2.802 2.036a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.802-2.036a1 1 0 00-1.176 0l-2.802 2.036c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L3.88 8.72c-.783-.57-.38-1.81.588-1.81H7.93a1 1 0 00.951-.69l1.07-3.292z"/>
                            </svg>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Tips */}
              {aiResult.tips && aiResult.tips.length > 0 && (
                <div className="rounded-xl border border-indigo-200 p-4 bg-gradient-to-br from-indigo-50 to-white shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3c-3.866 0-7 3.134-7 7 0 2.761 1.5 5.158 3.75 6.32V18a.75.75 0 00.75.75h5a.75.75 0 00.75-.75v-1.68C17.5 15.158 19 12.761 19 10c0-3.866-3.134-7-7-7zm-3 18a3 3 0 006 0H9z"/>
                      </svg>
                    </div>
                    <div className="text-sm font-semibold text-indigo-700">Tips</div>
                  </div>
                  <ul className="list-disc pl-4 space-y-1">
                    {aiResult.tips.map((t, idx) => (
                      <li key={idx} className="text-sm text-slate-800" dangerouslySetInnerHTML={{ __html: formatInlineText(t, true) }} />
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {!aiLoading && !aiError && !aiResult && !showLangIntro && (
            <div className="text-center py-6">
              <div className="text-slate-500 text-xs">No analysis available. Click "Refresh" to get AI analysis.</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Modal mode - return the full modal
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div 
        className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
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
              <h2 className="text-xl font-semibold">AI Word Analysis</h2>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-white/80">
                {currentWord?.text1} • {sourceLanguageName} → {targetLanguageName}
              </div>
              
              {!aiLoading && !showLangIntro && (
                <button
                  onClick={handleRefresh}
                  className="px-4 py-2 text-sm rounded-xl transition-all duration-200 flex items-center gap-2 bg-white/20 text-white hover:bg-white/30"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Refresh</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
          {/* Same content as embedded mode but with larger sizing */}
          {showLangIntro && (
            <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-6 shadow-sm mb-6">
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg ring-2 ring-blue-100">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-blue-800 mb-2">Choose AI Answer Language</h3>
                <p className="text-blue-600 text-sm">Select your preferred language for AI explanations</p>
              </div>
              
              <div className="max-w-md mx-auto">
                <div className="relative mb-4">
                  <select
                    value={introLang}
                    onChange={(e) => setIntroLang(e.target.value)}
                    className="w-full appearance-none px-4 py-3 rounded-xl border border-blue-200 bg-white text-slate-800 shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-100"
                  >
                    {getUniqueLanguages().map(l => (
                      <option key={l.code} value={l.name}>{l.name}</option>
                    ))}
                  </select>
                  <svg className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                  </svg>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={handleLanguageSelect}
                    className="flex-1 px-4 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 shadow"
                  >
                    Continue
                  </button>
                  <button
                    onClick={() => { setShowLangIntro(false); handleRunAi(); }}
                    className="flex-1 px-4 py-3 rounded-xl bg-white text-blue-700 font-medium ring-1 ring-blue-200 hover:bg-blue-50"
                  >
                    Skip
                  </button>
                </div>
              </div>
            </div>
          )}

          {aiLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <span className="relative inline-flex h-6 w-6">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-6 w-6 bg-blue-500"></span>
                  </span>
                  <span className="text-slate-600 text-lg font-medium">AI is analyzing the word...</span>
                </div>
                <div className="text-slate-400 text-sm">This may take a few seconds</div>
              </div>
            </div>
          )}

          {aiError && !aiLoading && (
            <div className="bg-red-50 text-red-700 text-sm px-6 py-4 rounded-2xl shadow border border-red-200 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-semibold">Error</span>
              </div>
              {aiError}
            </div>
          )}

          {!aiLoading && !aiError && aiResult && (
            <div className="space-y-6">
              {/* Word Header */}
              <div className="rounded-2xl border border-slate-200 p-6 bg-gradient-to-br from-slate-50 to-white shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <h3 className="text-3xl font-bold text-slate-900">{currentWord?.text1}</h3>
                    <button
                      onClick={() => {
                        if ('speechSynthesis' in window) {
                          const utterance = new SpeechSynthesisUtterance(currentWord?.text1 || '');
                          utterance.lang = getLanguageByName(targetLanguageName)?.code || 'en-US';
                          speechSynthesis.speak(utterance);
                        }
                      }}
                      className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                      title="Listen pronunciation"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/>
                      </svg>
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
                      {aiResult.partOfSpeech || 'Unknown'}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium">
                      {aiResult.cefrLevel || 'A1'}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-slate-600 text-lg font-mono">
                    /{aiResult.pronunciation || 'prəˌnʌnsiˈeɪʃən'}/
                  </div>
                  <div className="text-slate-500 text-sm">
                    {aiResult.alternativePronunciation || 'duh · mand'}
                  </div>
                </div>
              </div>

              {/* Definition */}
              {(aiResult.definition || aiResult.partOfSpeech) && (
                <div className="rounded-2xl border border-sky-200 p-6 bg-gradient-to-br from-sky-50 to-white shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11h8M8 15h6M12 7h.01"/>
                      </svg>
                    </div>
                    <div className="text-lg font-semibold text-sky-800">Definition</div>
                    <span className="ml-auto inline-flex items-center text-xs px-3 py-1 rounded-full bg-sky-100 text-sky-700">
                      {aiResult.partOfSpeech || 'info'}
                    </span>
                  </div>
                  <div className="text-slate-800 text-base leading-relaxed">
                    <div
                      className="prose prose-base max-w-none text-slate-800"
                      dangerouslySetInnerHTML={{ __html: formatInlineText(aiResult.definition || '', true) }}
                    />
                    <div className="mt-4">
                      <details className="group">
                        <summary className="cursor-pointer text-sm text-blue-700 hover:underline font-medium">
                          Show explanation in {targetLanguageName}
                        </summary>
                        <div className="mt-3 text-slate-700 text-sm">
                          {altDefinition ? (
                            <div className="mt-2" dangerouslySetInnerHTML={{ __html: formatInlineText(altDefinition, true) }} />
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
                <div className="rounded-2xl border border-purple-200 p-5 bg-gradient-to-br from-purple-50 to-white shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center shadow-lg">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                      </svg>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-purple-800">Verb Forms</div>
                      <div className="text-xs text-purple-600">Conjugation patterns</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {/* 1st Form - Infinitive */}
                    <div className="bg-white/70 rounded-lg p-3 border border-purple-100">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold">1</div>
                        <span className="text-sm font-semibold text-purple-700">Infinitive</span>
                      </div>
                      <div className="text-base font-bold text-slate-800">
                        {aiResult.verbForms.infinitive}
                      </div>
                    </div>

                    {/* 2nd Form - Past */}
                    <div className="bg-white/70 rounded-lg p-3 border border-purple-100">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold">2</div>
                        <span className="text-sm font-semibold text-purple-700">Past</span>
                      </div>
                      <div className="text-base font-bold text-slate-800">
                        {aiResult.verbForms.past}
                      </div>
                    </div>

                    {/* 3rd Form - Past Participle */}
                    <div className="bg-white/70 rounded-lg p-3 border border-purple-100">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold">3</div>
                        <span className="text-sm font-semibold text-purple-700">Past Part.</span>
                      </div>
                      <div className="text-base font-bold text-slate-800">
                        {aiResult.verbForms.pastParticiple}
                      </div>
                    </div>

                    {/* 4th Form - Present Participle */}
                    <div className="bg-white/70 rounded-lg p-3 border border-purple-100">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold">4</div>
                        <span className="text-sm font-semibold text-purple-700">Present Part.</span>
                      </div>
                      <div className="text-base font-bold text-slate-800">
                        {aiResult.verbForms.presentParticiple}
                      </div>
                    </div>

                    {/* 5th Form - 3rd Person Singular */}
                    <div className="bg-white/70 rounded-lg p-3 border border-purple-100 col-span-2">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold">5</div>
                        <span className="text-sm font-semibold text-purple-700">3rd Person Singular</span>
                      </div>
                      <div className="text-base font-bold text-slate-800">
                        {aiResult.verbForms.thirdPersonSingular}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Examples */}
              {aiResult.examples && aiResult.examples.length > 0 && (
                <div className="rounded-2xl border border-emerald-200 p-6 bg-gradient-to-br from-emerald-50 to-white shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                    </div>
                    <div className="text-lg font-semibold text-emerald-700">Examples</div>
                  </div>
                  <ul className="space-y-3">
                    {aiResult.examples.map((ex, idx) => {
                      const highlightedSentence = ex.sentence.replace(/\[\[w\]\](.*?)\[\[\/w\]\]/g, '<span class="underline decoration-blue-400 decoration-2 underline-offset-2 font-semibold text-slate-800">$1</span>');
                      
                      return (
                        <li key={idx} className="text-base">
                          <div className="text-slate-800" dangerouslySetInnerHTML={{ __html: highlightedSentence }} />
                          {ex.translation && (
                            <div 
                              className="text-slate-500 mt-1" 
                              dangerouslySetInnerHTML={{ __html: formatInlineText(ex.translation, true) }} 
                            />
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {/* Synonyms */}
              {aiResult.synonyms && aiResult.synonyms.length > 0 && (() => {
                const primarySynIdx = Math.max(0, aiResult.synonyms.findIndex((s) => s.isExact));
                return (
                  <div className="rounded-2xl border border-amber-200 p-6 bg-gradient-to-br from-amber-50 to-white shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                        </svg>
                      </div>
                      <div className="text-lg font-semibold text-amber-700">Synonyms</div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {aiResult.synonyms.slice(0, 8).map((s, idx) => (
                        <span
                          key={idx}
                          title={idx === primarySynIdx ? 'Exact synonym (closest) – highlighted as primary' : s.isExact ? 'Exact synonym' : 'Similar meaning'}
                          className={`px-3 py-2 rounded-full text-sm font-medium flex items-center gap-1 ${s.isExact ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-amber-100 text-amber-800'}`}
                        >
                          {s.word}
                          {idx === primarySynIdx && (
                            <svg className="text-amber-600 w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.968 0 1.371 1.24.588 1.81l-2.802 2.036a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.802-2.036a1 1 0 00-1.176 0l-2.802 2.036c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L3.88 8.72c-.783-.57-.38-1.81.588-1.81H7.93a1 1 0 00.951-.69l1.07-3.292z"/>
                            </svg>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Antonyms */}
              {aiResult.antonyms && aiResult.antonyms.length > 0 && (() => {
                const primaryAntIdx = Math.max(0, aiResult.antonyms.findIndex((a) => a.isExact));
                return (
                  <div className="rounded-2xl border border-red-200 p-6 bg-gradient-to-br from-red-50 to-white shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-red-100 text-red-700 flex items-center justify-center">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                      </div>
                      <div className="text-lg font-semibold text-red-700">Antonyms</div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {aiResult.antonyms.slice(0, 8).map((a, idx) => (
                        <span
                          key={idx}
                          title={idx === primaryAntIdx ? 'Exact antonym (clearest opposite) – highlighted as primary' : a.isExact ? 'Exact antonym' : 'Opposite meaning (near)'}
                          className={`px-3 py-2 rounded-full text-sm font-medium flex items-center gap-1 ${a.isExact ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-orange-100 text-orange-800'}`}
                        >
                          {a.word}
                          {idx === primaryAntIdx && (
                            <svg className="text-red-600 w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.968 0 1.371 1.24.588 1.81l-2.802 2.036a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.802-2.036a1 1 0 00-1.176 0l-2.802 2.036c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L3.88 8.72c-.783-.57-.38-1.81.588-1.81H7.93a1 1 0 00.951-.69l1.07-3.292z"/>
                            </svg>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Tips */}
              {aiResult.tips && aiResult.tips.length > 0 && (
                <div className="rounded-2xl border border-indigo-200 p-6 bg-gradient-to-br from-indigo-50 to-white shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3c-3.866 0-7 3.134-7 7 0 2.761 1.5 5.158 3.75 6.32V18a.75.75 0 00.75.75h5a.75.75 0 00.75-.75v-1.68C17.5 15.158 19 12.761 19 10c0-3.866-3.134-7-7-7zm-3 18a3 3 0 006 0H9z"/>
                      </svg>
                    </div>
                    <div className="text-lg font-semibold text-indigo-700">Tips</div>
                  </div>
                  <ul className="list-disc pl-6 space-y-2">
                    {aiResult.tips.map((t, idx) => (
                      <li key={idx} className="text-base text-slate-800" dangerouslySetInnerHTML={{ __html: formatInlineText(t, true) }} />
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {!aiLoading && !aiError && !aiResult && !showLangIntro && (
            <div className="text-center py-12">
              <div className="text-slate-500 text-sm">No analysis available. Click "Refresh" to get AI analysis.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudyAiAnalysis;
