import React, { useState, useEffect } from 'react';
import {
    getApiKey,
    setUserApiKey,
    testApiKey,
    clearAllUserApiKeys,
    getRemainingLimits,
    ApiKeyStatus,
    getAllApiKeyStatuses,
    getApiKeyStatusText,
    getApiKeyStatusColor
} from '../utils/apiKeys';

const Settings: React.FC = () => {
    const [geminiKey, setGeminiKey] = useState('');
    const [unsplashKey, setUnsplashKey] = useState('');
    const [pixabayKey, setPixabayKey] = useState('');

    const [showGemini, setShowGemini] = useState(false);
    const [showUnsplash, setShowUnsplash] = useState(false);
    const [showPixabay, setShowPixabay] = useState(false);

    const [statuses, setStatuses] = useState<Record<string, ApiKeyStatus> | null>(null);

    const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
    const [testMessage, setTestMessage] = useState('');

    const [limits, setLimits] = useState<{ unsplash: number; pixabay: number }>({ unsplash: 0, pixabay: 0 });

    const [imageApiPreference, setImageApiPreference] = useState('auto');
    const [aiModel, setAiModel] = useState('gemini-2.5-flash-lite');

    // Load saved keys and set local state
    useEffect(() => {
        const gKey = getApiKey('gemini');
        const uKey = getApiKey('unsplash');
        const pKey = getApiKey('pixabay');

        if (gKey) setGeminiKey(gKey);
        if (uKey) setUnsplashKey(uKey);
        if (pKey) setPixabayKey(pKey);

        setStatuses(getAllApiKeyStatuses());
        setLimits(getRemainingLimits());

        const savedPref = localStorage.getItem('word-rating-system-image-api-preference');
        if (savedPref) setImageApiPreference(savedPref);

        const savedModel = localStorage.getItem('word-rating-system-ai-model');
        if (savedModel) setAiModel(savedModel);
    }, []);

    const handleSave = (keyType: 'gemini' | 'unsplash' | 'pixabay', key: string) => {
        setUserApiKey(keyType, key);
        setStatuses(getAllApiKeyStatuses());

        // Show temporary success feedback
        const btn = document.getElementById(`save-${keyType}`);
        if (btn) {
            const originalText = btn.innerText;
            btn.innerText = 'Saved!';
            btn.classList.add('bg-green-600');
            setTimeout(() => {
                btn.innerText = originalText;
                btn.classList.remove('bg-green-600');
            }, 2000);
        }
    };

    const handleTest = async (keyType: 'gemini' | 'unsplash' | 'pixabay', key: string) => {
        setTestStatus('testing');
        setTestMessage(`Testing ${keyType} API key...`);

        const success = await testApiKey(keyType, key);

        if (success) {
            setTestStatus('success');
            setTestMessage(`${keyType} API key is valid!`);
            // Update limits if image API
            if (keyType === 'unsplash' || keyType === 'pixabay') {
                setLimits(getRemainingLimits());
            }
        } else {
            setTestStatus('error');
            setTestMessage(`Invalid ${keyType} API key or connection failed.`);
        }

        setTimeout(() => {
            setTestStatus('idle');
            setTestMessage('');
        }, 3000);
    };

    const handleClearAll = () => {
        if (window.confirm('Are you sure you want to clear all saved API keys? You will need to re-enter them.')) {
            clearAllUserApiKeys();
            setGeminiKey('');
            setUnsplashKey('');
            setPixabayKey('');
            setStatuses(getAllApiKeyStatuses());
        }
    };

    const handlePreferenceChange = (pref: string) => {
        setImageApiPreference(pref);
        localStorage.setItem('word-rating-system-image-api-preference', pref);
    };

    const handleModelChange = (model: string) => {
        setAiModel(model);
        localStorage.setItem('word-rating-system-ai-model', model);
    };

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-slate-200 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </div>
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Settings</h1>
                    <p className="text-slate-500">Configure API keys and preferences</p>
                </div>
            </div>

            {testMessage && (
                <div className={`fixed bottom-6 right-6 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 z-50 animate-slide-in-right ${testStatus === 'success' ? 'bg-green-500 text-white' :
                        testStatus === 'error' ? 'bg-red-500 text-white' :
                            'bg-indigo-600 text-white'
                    }`}>
                    {testStatus === 'testing' && (
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    )}
                    {testStatus === 'success' && (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    )}
                    {testStatus === 'error' && (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    )}
                    <span className="font-medium">{testMessage}</span>
                </div>
            )}

            {/* AI Settings Section */}
            <section className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-white">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <h2 className="text-lg font-bold">AI Configuration (Gemini)</h2>
                    </div>
                    {statuses?.gemini && (
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${statuses.gemini.isConfigured ? 'bg-green-400 text-green-900' : 'bg-white/20 text-white'
                            }`}>
                            {statuses.gemini.isConfigured ? 'Active' : 'Not Configured'}
                        </span>
                    )}
                </div>

                <div className="p-6 space-y-6">
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700">API Key</label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <input
                                    type={showGemini ? "text" : "password"}
                                    value={geminiKey}
                                    onChange={(e) => setGeminiKey(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all pr-12 font-mono text-sm"
                                    placeholder="Enter your Gemini API key..."
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowGemini(!showGemini)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showGemini ? (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                            <button
                                onClick={() => handleSave('gemini', geminiKey)}
                                id="save-gemini"
                                className="px-6 py-3 bg-slate-800 text-white font-semibold rounded-xl hover:bg-slate-700 transition-colors shadow-lg shadow-slate-200"
                            >
                                Save
                            </button>
                            <button
                                onClick={() => handleTest('gemini', geminiKey)}
                                className="px-6 py-3 bg-indigo-50 text-indigo-700 font-semibold rounded-xl hover:bg-indigo-100 transition-colors border border-indigo-100"
                            >
                                Test
                            </button>
                        </div>
                        {statuses?.gemini && (
                            <p className={`text-sm mt-2 flex items-center gap-2 ${statuses.gemini.isConfigured ? 'text-green-600' : 'text-slate-500'}`}>
                                <span className={`w-2 h-2 rounded-full ${statuses.gemini.isConfigured ? 'bg-green-500' : 'bg-slate-300'}`}></span>
                                {getApiKeyStatusText(statuses.gemini)}
                            </p>
                        )}
                    </div>

                    <div className="pt-6 border-t border-slate-100">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">AI Model</label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {[
                                { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite', desc: 'Default - Fast & Efficient' },
                                { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', desc: 'Balanced Performance' },
                                { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', desc: 'Stable Legacy Model' }
                            ].map(model => (
                                <button
                                    key={model.id}
                                    onClick={() => handleModelChange(model.id)}
                                    className={`p-4 rounded-xl border-2 text-left transition-all ${aiModel === model.id
                                            ? 'border-indigo-500 bg-indigo-50/50 ring-1 ring-indigo-500'
                                            : 'border-slate-100 hover:border-indigo-200 hover:bg-slate-50'
                                        }`}
                                >
                                    <div className={`font-bold ${aiModel === model.id ? 'text-indigo-700' : 'text-slate-700'}`}>
                                        {model.name}
                                    </div>
                                    <div className="text-xs text-slate-500 mt-1">{model.desc}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Image API Settings Section */}
            <section className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-white">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <h2 className="text-lg font-bold">Image Sources</h2>
                    </div>
                    <div className="flex gap-2">
                        <span className="bg-white/20 text-white px-2 py-1 rounded text-xs font-mono">
                            Use: {imageApiPreference.toUpperCase()}
                        </span>
                    </div>
                </div>

                <div className="p-6 space-y-8">
                    {/* Preference Selection */}
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                        {['auto', 'unsplash', 'pixabay'].map((pref) => (
                            <button
                                key={pref}
                                onClick={() => handlePreferenceChange(pref)}
                                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${imageApiPreference === pref
                                        ? 'bg-white text-emerald-700 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                {pref === 'auto' ? 'Auto (Recommended)' : pref.charAt(0).toUpperCase() + pref.slice(1)}
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Unsplash Config */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <label className="font-bold text-slate-700">Unsplash API</label>
                                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-lg font-mono">
                                    Remaining: {limits.unsplash}/50
                                </span>
                            </div>

                            <div className="relative">
                                <input
                                    type={showUnsplash ? "text" : "password"}
                                    value={unsplashKey}
                                    onChange={(e) => setUnsplashKey(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all pr-12 font-mono text-sm"
                                    placeholder="Unsplash Access Key..."
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowUnsplash(!showUnsplash)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showUnsplash ? (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleSave('unsplash', unsplashKey)}
                                    id="save-unsplash"
                                    className="flex-1 px-4 py-2 bg-slate-800 text-white font-semibold rounded-lg hover:bg-slate-700 transition-colors shadow-md"
                                >
                                    Save
                                </button>
                                <button
                                    onClick={() => handleTest('unsplash', unsplashKey)}
                                    className="flex-1 px-4 py-2 bg-emerald-50 text-emerald-700 font-semibold rounded-lg hover:bg-emerald-100 transition-colors border border-emerald-100"
                                >
                                    Test
                                </button>
                            </div>
                        </div>

                        {/* Pixabay Config */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <label className="font-bold text-slate-700">Pixabay API</label>
                                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-lg font-mono">
                                    Remaining: {limits.pixabay}/5000
                                </span>
                            </div>

                            <div className="relative">
                                <input
                                    type={showPixabay ? "text" : "password"}
                                    value={pixabayKey}
                                    onChange={(e) => setPixabayKey(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all pr-12 font-mono text-sm"
                                    placeholder="Pixabay API Key..."
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPixabay(!showPixabay)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showPixabay ? (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleSave('pixabay', pixabayKey)}
                                    id="save-pixabay"
                                    className="flex-1 px-4 py-2 bg-slate-800 text-white font-semibold rounded-lg hover:bg-slate-700 transition-colors shadow-md"
                                >
                                    Save
                                </button>
                                <button
                                    onClick={() => handleTest('pixabay', pixabayKey)}
                                    className="flex-1 px-4 py-2 bg-emerald-50 text-emerald-700 font-semibold rounded-lg hover:bg-emerald-100 transition-colors border border-emerald-100"
                                >
                                    Test
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Danger Zone */}
            <section className="bg-red-50 rounded-3xl p-6 border border-red-100">
                <h3 className="text-red-800 font-bold mb-2">Reset Application Data</h3>
                <p className="text-red-600 text-sm mb-4">Clear all saved API keys from local storage.</p>
                <button
                    onClick={handleClearAll}
                    className="px-6 py-3 bg-red-100 text-red-700 hover:bg-red-200 rounded-xl font-bold transition-colors"
                >
                    Clear All Keys
                </button>
            </section>
        </div>
    );
};

export default Settings;
