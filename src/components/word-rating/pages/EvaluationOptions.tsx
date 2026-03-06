import React from 'react';
import { Word } from '../types';

interface EvaluationOptionsProps {
    onStartEvaluation: (random: boolean, count?: number) => void;
    pendingCount: number;
}

const EvaluationOptions: React.FC<EvaluationOptionsProps> = ({ onStartEvaluation, pendingCount }) => {
    return (
        <div className="max-w-2xl mx-auto py-12 px-4">
            <div className="bg-white rounded-3xl shadow-2xl p-8 border border-slate-100 overflow-hidden relative">
                {/* Background Decorative Elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-full blur-3xl -mr-16 -mt-16 z-0"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-blue-50 to-indigo-50 rounded-full blur-2xl -ml-10 -mb-10 z-0"></div>

                <div className="relative z-10 text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg mb-6 transform rotate-3 hover:rotate-6 transition-transform duration-300">
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                        </svg>
                    </div>

                    <h2 className="text-3xl font-bold text-slate-800 mb-2">Start Evaluation</h2>
                    <p className="text-slate-500 mb-8 max-w-md mx-auto">
                        Review your words to rate their difficulty.
                        {pendingCount > 0
                            ? `You have ${pendingCount} unevaluated words ready for review.`
                            : "You're all caught up! You can review old words or add new ones."}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button
                            onClick={() => onStartEvaluation(false)}
                            disabled={pendingCount === 0}
                            className={`
                group relative p-6 rounded-2xl border-2 text-left transition-all duration-300
                ${pendingCount > 0
                                    ? 'border-indigo-100 bg-white hover:border-indigo-500 hover:shadow-xl cursor-pointer'
                                    : 'border-slate-100 bg-slate-50 cursor-not-allowed opacity-60'}
              `}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <span className={`p-3 rounded-xl ${pendingCount > 0 ? 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white' : 'bg-slate-200 text-slate-400'} transition-colors duration-300`}>
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                    </svg>
                                </span>
                                {pendingCount > 0 && (
                                    <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded-full">
                                        {pendingCount} Pending
                                    </span>
                                )}
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 mb-1">Standard Mode</h3>
                            <p className="text-sm text-slate-500">Evaluate only new words you haven't rated yet.</p>
                        </button>

                        <button
                            onClick={() => onStartEvaluation(true)}
                            className="group relative p-6 rounded-2xl border-2 border-purple-100 bg-white hover:border-purple-500 hover:shadow-xl cursor-pointer transition-all duration-300 text-left"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <span className="p-3 rounded-xl bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors duration-300">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                </span>
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 mb-1">Random Review</h3>
                            <p className="text-sm text-slate-500">Practice with a random selection of words.</p>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EvaluationOptions;
