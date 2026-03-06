import React, { useState, useEffect } from 'react';
import { Word } from '../types';

interface EvaluationOptionsProps {
    words: Word[];
    onStart: (options: EvaluationOptions) => void;
    onCancel: () => void;
}

export interface EvaluationOptions {
    batchSize: number;
    wordCount: number;
    difficulty?: number;
    includeEvaluated: boolean;
    shuffle: boolean;
}

const EvaluationOptions: React.FC<EvaluationOptionsProps> = ({ words, onStart, onCancel }) => {
    const unevaluatedCount = words.filter(w => !w.isEvaluated).length;
    const evaluatedCount = words.filter(w => w.isEvaluated).length;

    const [batchSize, setBatchSize] = useState(10);
    const [wordCount, setWordCount] = useState(Math.min(20, unevaluatedCount || evaluatedCount));
    const [includeEvaluated, setIncludeEvaluated] = useState(unevaluatedCount === 0);
    const [shuffle, setShuffle] = useState(true);
    const [selectedDifficulty, setSelectedDifficulty] = useState<number | undefined>(undefined);

    // Update max word count based on selection
    useEffect(() => {
        let max = 0;
        if (includeEvaluated) {
            max = words.length;
        } else {
            max = unevaluatedCount;
        }

        if (selectedDifficulty !== undefined) {
            const filtered = words.filter(w =>
                (includeEvaluated || !w.isEvaluated) &&
                w.difficulty === selectedDifficulty
            );
            max = filtered.length;
        }

        if (wordCount > max && max > 0) {
            setWordCount(max);
        }
        if (wordCount === 0 && max > 0) {
            setWordCount(Math.min(20, max));
        }
    }, [includeEvaluated, selectedDifficulty, words, unevaluatedCount]);

    const handleStart = () => {
        onStart({
            batchSize,
            wordCount,
            difficulty: selectedDifficulty,
            includeEvaluated,
            shuffle
        });
    };

    const getMaxWords = () => {
        let filtered = words;
        if (!includeEvaluated) {
            filtered = filtered.filter(w => !w.isEvaluated);
        }
        if (selectedDifficulty !== undefined) {
            filtered = filtered.filter(w => w.difficulty === selectedDifficulty);
        }
        return filtered.length;
    };

    const maxWords = getMaxWords();

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 p-4 flex items-center justify-center">
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-blue-200/50 p-8 w-full max-w-lg">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg ring-2 ring-blue-100">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Evaluation Options</h2>
                    <p className="text-slate-600">Configure your evaluation session</p>
                </div>

                <div className="space-y-6">
                    {/* Word Source Selection */}
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                        <label className="flex items-center space-x-3 mb-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={includeEvaluated}
                                onChange={(e) => setIncludeEvaluated(e.target.checked)}
                                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-slate-300"
                            />
                            <span className="text-slate-700 font-medium">Include previously evaluated words</span>
                        </label>
                        <div className="text-xs text-slate-500 ml-8">
                            Available: {includeEvaluated ? words.length : unevaluatedCount} words
                        </div>
                    </div>

                    {/* Difficulty Filter */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Filter by Level (Optional)
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {[1, 2, 3, 4, 5].map((level) => (
                                <button
                                    key={level}
                                    onClick={() => setSelectedDifficulty(selectedDifficulty === level ? undefined : level)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${selectedDifficulty === level
                                            ? 'bg-blue-600 text-white shadow-md'
                                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                                        }`}
                                >
                                    Level {level}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Session Size */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Session Size ({wordCount} words)
                        </label>
                        <input
                            type="range"
                            min="1"
                            max={Math.min(50, maxWords)}
                            value={wordCount}
                            onChange={(e) => setWordCount(parseInt(e.target.value))}
                            disabled={maxWords === 0}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                        <div className="flex justify-between text-xs text-slate-500 mt-1">
                            <span>1</span>
                            <span>{Math.min(50, maxWords)}</span>
                        </div>
                    </div>

                    {/* Batch Size */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Analysis Batch Size
                        </label>
                        <select
                            value={batchSize}
                            onChange={(e) => setBatchSize(parseInt(e.target.value))}
                            className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        >
                            {[5, 10, 15, 20].map(size => (
                                <option key={size} value={size}>{size} words at a time</option>
                            ))}
                        </select>
                    </div>

                    {/* Shuffle Option */}
                    <div className="flex items-center space-x-3">
                        <input
                            type="checkbox"
                            id="shuffle"
                            checked={shuffle}
                            onChange={(e) => setShuffle(e.target.checked)}
                            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-slate-300"
                        />
                        <label htmlFor="shuffle" className="text-slate-700 font-medium cursor-pointer">
                            Shuffle words
                        </label>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4 pt-4">
                        <button
                            onClick={onCancel}
                            className="flex-1 px-6 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-semibold"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleStart}
                            disabled={maxWords === 0}
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all font-bold"
                        >
                            Start Session
                        </button>
                    </div>

                    {maxWords === 0 && (
                        <p className="text-center text-red-500 text-sm">
                            No words available matching your criteria.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EvaluationOptions;
