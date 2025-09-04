import React, { useEffect, useState } from 'react';
import { LANGUAGES } from '../utils/languages';
import { Page } from '../types';

interface SettingsProps {
  setCurrentPage: (page: Page) => void;
  setDeveloperMode: (enabled: boolean) => void;
}

const AI_LANG_KEY = 'word-rating-system-ai-language';
const DEV_MODE_KEY = 'word-rating-system-developer-mode';

const Settings: React.FC<SettingsProps> = ({ setCurrentPage, setDeveloperMode }) => {
  const [aiLanguage, setAiLanguage] = useState<string>(() => {
    try {
      return localStorage.getItem(AI_LANG_KEY) || 'English';
    } catch {
      return 'English';
    }
  });

  const [developerMode, setLocalDeveloperMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem(DEV_MODE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try { localStorage.setItem(AI_LANG_KEY, aiLanguage); } catch {}
  }, [aiLanguage]);

  useEffect(() => {
    try { 
      localStorage.setItem(DEV_MODE_KEY, developerMode.toString()); 
      setDeveloperMode(developerMode);
    } catch {}
  }, [developerMode, setDeveloperMode]);

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

          {/* Developer Mode Section */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 ring-1 ring-purple-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 text-purple-700 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-800">Developer Mode</div>
                  <div className="text-xs text-slate-500">Access advanced debugging and data management tools</div>
                </div>
              </div>
              <span className="px-2 py-1 rounded-lg bg-purple-100 text-purple-700 text-xs font-medium">Advanced</span>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <p className="text-xs text-slate-600">Enable developer mode to access advanced debugging tools</p>
                  <div className="flex items-center">
                    <button
                      onClick={() => setLocalDeveloperMode(!developerMode)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                        developerMode ? 'bg-purple-600' : 'bg-slate-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          developerMode ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <span className="ml-2 text-xs font-medium text-slate-700">
                      {developerMode ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>
              </div>
              
              {developerMode && (
                <div className="flex items-center justify-between pt-2 border-t border-purple-200">
                  <p className="text-xs text-slate-600">View and manage localStorage data, debug application state, and access development tools.</p>
                  <button
                    onClick={() => setCurrentPage('debug')}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-sm hover:shadow-md font-medium text-sm"
                  >
                    Open Debug Panel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;


