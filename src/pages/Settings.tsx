import React, { useEffect, useState } from 'react';
import { LANGUAGES } from '../utils/languages';

const AI_LANG_KEY = 'word-rating-system-ai-language';

const Settings: React.FC = () => {
  const [aiLanguage, setAiLanguage] = useState<string>(() => {
    try {
      return localStorage.getItem(AI_LANG_KEY) || 'English';
    } catch {
      return 'English';
    }
  });

  useEffect(() => {
    try { localStorage.setItem(AI_LANG_KEY, aiLanguage); } catch {}
  }, [aiLanguage]);

  return (
    <div className="max-w-3xl mx-auto px-6">
      <div className="bg-gradient-to-br from-white to-slate-50 rounded-3xl shadow-xl ring-1 ring-slate-200 p-6 mt-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold text-slate-800">Settings</h1>
          <span className="px-3 py-1 rounded-full text-xs bg-blue-50 text-blue-700 ring-1 ring-blue-200">Personal</span>
        </div>

        <div className="space-y-8">
          <div className="p-5 rounded-2xl bg-white/80 backdrop-blur ring-1 ring-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-800">AI answer language</div>
                  <div className="text-xs text-slate-500">Choose the language for AI analysis responses</div>
                </div>
              </div>
              <span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs">Current: {aiLanguage}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="relative">
                <select
                  value={aiLanguage}
                  onChange={(e) => setAiLanguage(e.target.value)}
                  className="w-full appearance-none px-4 py-3 rounded-xl border border-slate-200 bg-white/90 shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-100 text-slate-800"
                >
                  {LANGUAGES.map(l => (
                    <option key={l.code} value={l.name}>{l.name}</option>
                  ))}
                </select>
                <svg className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
              </div>
              <div className="flex items-center">
                <p className="text-xs text-slate-500">Default is English. You can change it anytime.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;


