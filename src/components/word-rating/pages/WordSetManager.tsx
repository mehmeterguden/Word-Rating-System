import React, { useState } from 'react';
import { WordSet } from '../types';
import { LANGUAGES, DEFAULT_SEPARATOR } from '../utils/languages';

interface WordSetManagerProps {
    wordSets: WordSet[];
    activeSetId: string;
    onCreateSet: (name: string, language1: string, language2: string, separator: string, description?: string) => void;
    onSetActive: (id: string) => void;
    onDeleteSet: (id: string) => void;
}

const WordSetManager: React.FC<WordSetManagerProps> = ({
    wordSets,
    activeSetId,
    onCreateSet,
    onSetActive,
    onDeleteSet
}) => {
    const [isCreating, setIsCreating] = useState(false);
    const [newName, setNewName] = useState('');
    const [description, setDescription] = useState('');
    const [lang1, setLang1] = useState('English');
    const [lang2, setLang2] = useState('Turkish');
    const [separator, setSeparator] = useState(DEFAULT_SEPARATOR);

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (newName && lang1 && lang2) {
            onCreateSet(newName, lang1, lang2, separator, description);
            setIsCreating(false);
            setNewName('');
            setDescription('');
            setSeparator(DEFAULT_SEPARATOR);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Word Sets</h1>
                    <p className="text-slate-500 mt-1">Manage your vocabulary collections</p>
                </div>
                <button
                    onClick={() => setIsCreating(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Create New Set
                </button>
            </div>

            {/* Create Modal */}
            {isCreating && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-in">
                        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white">
                            <h2 className="text-2xl font-bold">Create New Word Set</h2>
                            <p className="opacity-90 mt-1">Configure your new vocabulary collection</p>
                        </div>

                        <form onSubmit={handleCreate} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Set Name</label>
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                    placeholder="e.g., Business English, Travel Phrases"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Description (Optional)</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none h-24"
                                    placeholder="What is this set about?"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Language 1</label>
                                    <select
                                        value={lang1}
                                        onChange={(e) => setLang1(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all appearance-none bg-white"
                                    >
                                        {LANGUAGES.map(l => (
                                            <option key={l.code} value={l.name}>{l.flag} {l.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Language 2</label>
                                    <select
                                        value={lang2}
                                        onChange={(e) => setLang2(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all appearance-none bg-white"
                                    >
                                        {LANGUAGES.map(l => (
                                            <option key={l.code} value={l.name}>{l.flag} {l.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Separator</label>
                                <input
                                    type="text"
                                    value={separator}
                                    onChange={(e) => setSeparator(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all font-mono"
                                    placeholder=" - "
                                    required
                                />
                                <p className="text-xs text-slate-500 mt-1">Used when formatting translations text.</p>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsCreating(false)}
                                    className="px-6 py-3 rounded-xl text-slate-600 font-semibold hover:bg-slate-100 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all hover:scale-105"
                                >
                                    Create Set
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Sets Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {wordSets.map(set => (
                    <div
                        key={set.id}
                        onClick={() => onSetActive(set.id)}
                        className={`
              relative group p-6 rounded-2xl border-2 transition-all duration-300 cursor-pointer overflow-hidden
              ${set.id === activeSetId
                                ? 'border-indigo-500 bg-indigo-50/50 shadow-xl scale-[1.02]'
                                : 'border-slate-100 bg-white hover:border-indigo-200 hover:shadow-lg hover:scale-[1.01]'}
            `}
                    >
                        {/* Active Indicator */}
                        {set.id === activeSetId && (
                            <div className="absolute top-0 right-0 p-3">
                                <div className="bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                                    Active
                                </div>
                            </div>
                        )}

                        <div className="flex items-start justify-between mb-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300">
                                📚
                            </div>

                            {/* Delete Button (only if not active and not the last one) */}
                            {set.id !== activeSetId && wordSets.length > 1 && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (window.confirm('Are you sure? All words in this set will be deleted.')) {
                                            onDeleteSet(set.id);
                                        }
                                    }}
                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                    title="Delete Set"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            )}
                        </div>

                        <h3 className="text-xl font-bold text-slate-800 mb-1 truncate">{set.name}</h3>
                        {set.description && (
                            <p className="text-slate-500 text-sm mb-4 line-clamp-2 min-h-[2.5rem]">{set.description}</p>
                        )}
                        {!set.description && <div className="min-h-[2.5rem] text-slate-400 text-sm italic py-1">No description</div>}

                        <div className="flex items-center gap-2 mt-4 text-sm font-medium text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                            <span>{set.language1}</span>
                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                            <span>{set.language2}</span>
                        </div>

                        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-sm">
                            <span className="text-slate-500 flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                                {set.wordCount} words
                            </span>
                            <span className="text-slate-400">
                                Created {new Date(set.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default WordSetManager;
