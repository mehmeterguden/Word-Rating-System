import React, { useState, useEffect } from 'react';
import { Word } from '../types';

const DebugPage: React.FC = () => {
  const [localStorageData, setLocalStorageData] = useState<{ [key: string]: string }>({});
  const [isExpanded, setIsExpanded] = useState<{ [key: string]: boolean }>({});
  const [duplicateStats, setDuplicateStats] = useState<{
    totalWords: number;
    uniqueWords: number;
    duplicates: number;
    duplicateGroups: { [key: string]: Word[] };
  } | null>(null);

  useEffect(() => {
    // Get all localStorage data
    const data: { [key: string]: string } = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        try {
          const value = localStorage.getItem(key);
          data[key] = value || '';
        } catch (error) {
          data[key] = `Error reading: ${error}`;
        }
      }
    }
    setLocalStorageData(data);
    
    // Analyze word duplicates
    analyzeWordDuplicates();
  }, []);

  const analyzeWordDuplicates = () => {
    try {
      const wordsData = localStorage.getItem('word-rating-system-words');
      if (!wordsData) {
        setDuplicateStats(null);
        return;
      }

      const words: Word[] = JSON.parse(wordsData);
      const wordGroups: { [key: string]: Word[] } = {};
      
      // Group words by text1 and text2 combination
      words.forEach(word => {
        const key = `${word.text1}|${word.text2}`;
        if (!wordGroups[key]) {
          wordGroups[key] = [];
        }
        wordGroups[key].push(word);
      });

      // Find duplicates
      const duplicateGroups: { [key: string]: Word[] } = {};
      Object.entries(wordGroups).forEach(([key, group]) => {
        if (group.length > 1) {
          duplicateGroups[key] = group;
        }
      });

      const totalWords = words.length;
      const uniqueWords = Object.keys(wordGroups).length;
      const duplicates = Object.values(duplicateGroups).reduce((acc, group) => acc + group.length - 1, 0);

      setDuplicateStats({
        totalWords,
        uniqueWords,
        duplicates,
        duplicateGroups
      });
    } catch (error) {
      console.error('Error analyzing duplicates:', error);
      setDuplicateStats(null);
    }
  };

  const toggleExpanded = (key: string) => {
    setIsExpanded(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const clearAllData = () => {
    if (window.confirm('Are you sure you want to clear all localStorage data? This action cannot be undone.')) {
      localStorage.clear();
      setLocalStorageData({});
      setIsExpanded({});
    }
  };

  const clearItem = (key: string) => {
    if (window.confirm(`Are you sure you want to clear "${key}"?`)) {
      localStorage.removeItem(key);
      setLocalStorageData(prev => {
        const newData = { ...prev };
        delete newData[key];
        return newData;
      });
      analyzeWordDuplicates();
    }
  };

  const removeDuplicateWords = () => {
    if (!duplicateStats || duplicateStats.duplicates === 0) {
      alert('No duplicate words found!');
      return;
    }

    if (!window.confirm(`Are you sure you want to remove ${duplicateStats.duplicates} duplicate words? This action cannot be undone.`)) {
      return;
    }

    try {
      const wordsData = localStorage.getItem('word-rating-system-words');
      if (!wordsData) return;

      const words: Word[] = JSON.parse(wordsData);
      const wordGroups: { [key: string]: Word[] } = {};
      
      // Group words by text1 and text2 combination
      words.forEach(word => {
        const key = `${word.text1}|${word.text2}`;
        if (!wordGroups[key]) {
          wordGroups[key] = [];
        }
        wordGroups[key].push(word);
      });

      // Keep only the first occurrence of each word group
      const cleanedWords: Word[] = [];
      Object.values(wordGroups).forEach(group => {
        // Sort by creation date and keep the oldest one
        const sortedGroup = group.sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        cleanedWords.push(sortedGroup[0]);
      });

      // Save cleaned words back to localStorage
      localStorage.setItem('word-rating-system-words', JSON.stringify(cleanedWords));
      
      // Refresh data
      setLocalStorageData(prev => ({
        ...prev,
        'word-rating-system-words': JSON.stringify(cleanedWords)
      }));
      
      analyzeWordDuplicates();
      alert(`Successfully removed ${duplicateStats.duplicates} duplicate words!`);
    } catch (error) {
      console.error('Error removing duplicates:', error);
      alert('Error removing duplicates. Please try again.');
    }
  };

  const removeSpecificDuplicates = (key: string) => {
    if (!duplicateStats || !duplicateStats.duplicateGroups[key]) {
      return;
    }

    const group = duplicateStats.duplicateGroups[key];
    if (group.length <= 1) return;

    if (!window.confirm(`Are you sure you want to remove ${group.length - 1} duplicate(s) of "${group[0].text1} - ${group[0].text2}"?`)) {
      return;
    }

    try {
      const wordsData = localStorage.getItem('word-rating-system-words');
      if (!wordsData) return;

      const words: Word[] = JSON.parse(wordsData);
      const [text1, text2] = key.split('|');
      
      // Find all words with this combination
      const matchingWords = words.filter(word => word.text1 === text1 && word.text2 === text2);
      
      // Keep only the oldest one
      const sortedWords = matchingWords.sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      const wordToKeep = sortedWords[0];
      
      // Remove all matching words and add back only the one to keep
      const cleanedWords = words.filter(word => !(word.text1 === text1 && word.text2 === text2));
      cleanedWords.push(wordToKeep);
      
      // Save cleaned words back to localStorage
      localStorage.setItem('word-rating-system-words', JSON.stringify(cleanedWords));
      
      // Refresh data
      setLocalStorageData(prev => ({
        ...prev,
        'word-rating-system-words': JSON.stringify(cleanedWords)
      }));
      
      analyzeWordDuplicates();
      alert(`Successfully removed ${group.length - 1} duplicate(s) of "${text1} - ${text2}"!`);
    } catch (error) {
      console.error('Error removing specific duplicates:', error);
      alert('Error removing duplicates. Please try again.');
    }
  };

  const formatValue = (value: string) => {
    try {
      // Try to parse as JSON for better formatting
      const parsed = JSON.parse(value);
      return JSON.stringify(parsed, null, 2);
    } catch {
      // If not JSON, return as is
      return value;
    }
  };

  const getValuePreview = (value: string) => {
    if (value.length > 100) {
      return value.substring(0, 100) + '...';
    }
    return value;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl ring-1 ring-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-800 tracking-tight">LocalStorage Debug</h1>
                <p className="text-slate-600 mt-2">
                  View and manage all localStorage data for this application
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                >
                  Refresh
                </button>
                <button
                  onClick={clearAllData}
                  className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Duplicate Words Section */}
        {duplicateStats && (
          <div className="mb-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl ring-1 ring-slate-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Duplicate Words Analysis</h2>
                  <p className="text-slate-600 mt-1">
                    Found {duplicateStats.duplicates} duplicate words out of {duplicateStats.totalWords} total words
                  </p>
                </div>
                {duplicateStats.duplicates > 0 && (
                  <button
                    onClick={removeDuplicateWords}
                    className="px-6 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors font-medium"
                  >
                    Remove All Duplicates
                  </button>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-xl">
                  <div className="text-2xl font-bold text-blue-600">{duplicateStats.totalWords}</div>
                  <div className="text-sm text-blue-700">Total Words</div>
                </div>
                <div className="bg-green-50 p-4 rounded-xl">
                  <div className="text-2xl font-bold text-green-600">{duplicateStats.uniqueWords}</div>
                  <div className="text-sm text-green-700">Unique Words</div>
                </div>
                <div className="bg-red-50 p-4 rounded-xl">
                  <div className="text-2xl font-bold text-red-600">{duplicateStats.duplicates}</div>
                  <div className="text-sm text-red-700">Duplicates</div>
                </div>
              </div>

              {/* Duplicate Groups */}
              {Object.keys(duplicateStats.duplicateGroups).length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">
                    Duplicate Groups ({Object.keys(duplicateStats.duplicateGroups).length})
                  </h3>
                  <div className="max-h-96 overflow-y-auto space-y-3 pr-2">
                    {Object.entries(duplicateStats.duplicateGroups).map(([key, group]) => (
                      <div key={key} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-slate-800">
                              {group[0].text1} - {group[0].text2}
                            </div>
                            <div className="text-sm text-slate-600 mt-1">
                              {group.length} copies • Set: {group[0].setId}
                            </div>
                            <div className="text-xs text-slate-500 mt-1">
                              IDs: {group.map(w => w.id).join(', ')}
                            </div>
                          </div>
                          <button
                            onClick={() => removeSpecificDuplicates(key)}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm flex-shrink-0 ml-3"
                          >
                            Remove {group.length - 1} Duplicate{group.length - 1 > 1 ? 's' : ''}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Data Display */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl ring-1 ring-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-xl font-semibold text-slate-800">
              LocalStorage Items ({Object.keys(localStorageData).length})
            </h2>
          </div>

          {Object.keys(localStorageData).length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-slate-600 mb-2">No LocalStorage Data</h3>
              <p className="text-slate-500">No data has been stored in localStorage yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {Object.entries(localStorageData).map(([key, value]) => (
                <div key={key} className="p-6 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-slate-800 font-mono">
                          {key}
                        </h3>
                        <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-full">
                          {value.length} chars
                        </span>
                      </div>
                      
                      <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                        {isExpanded[key] ? (
                          <div className="max-h-96 overflow-y-auto">
                            <pre className="text-sm text-slate-700 whitespace-pre-wrap font-mono">
                              {formatValue(value)}
                            </pre>
                          </div>
                        ) : (
                          <div className="text-sm text-slate-600 font-mono">
                            {getValuePreview(value)}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => toggleExpanded(key)}
                        className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        {isExpanded[key] ? 'Collapse' : 'Expand'}
                      </button>
                      <button
                        onClick={() => clearItem(key)}
                        className="px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="mt-6 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl ring-1 ring-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-xl">
              <div className="text-2xl font-bold text-blue-600">{Object.keys(localStorageData).length}</div>
              <div className="text-sm text-blue-700">Total Items</div>
            </div>
            <div className="bg-green-50 p-4 rounded-xl">
              <div className="text-2xl font-bold text-green-600">
                {Object.values(localStorageData).reduce((acc, val) => acc + val.length, 0).toLocaleString()}
              </div>
              <div className="text-sm text-green-700">Total Characters</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-xl">
              <div className="text-2xl font-bold text-purple-600">
                {(Object.values(localStorageData).reduce((acc, val) => acc + val.length, 0) / 1024).toFixed(2)}
              </div>
              <div className="text-sm text-purple-700">Size (KB)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugPage;
