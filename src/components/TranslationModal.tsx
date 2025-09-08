import React, { useState, useEffect } from 'react';
import { TranslationResponse } from '../types';
import { generateWordTranslations } from '../utils/wordTranslation';

interface TranslationModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceLanguageName: string;
  targetLanguageName: string;
  separator: string;
  onAddTranslations: (translations: { text1: string; text2: string; language1Name: string; language2Name: string }[]) => void;
  preFilledWords?: string[];
}

const TranslationModal: React.FC<TranslationModalProps> = ({
  isOpen,
  onClose,
  sourceLanguageName,
  targetLanguageName,
  separator,
  onAddTranslations,
  preFilledWords = []
}) => {
  const [inputWords, setInputWords] = useState('');
  const [translationResponse, setTranslationResponse] = useState<TranslationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTranslations, setSelectedTranslations] = useState<Set<number>>(new Set());
  const [selectedAlternatives, setSelectedAlternatives] = useState<Map<number, string>>(new Map());

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      // Pre-fill input with words from main input if available
      if (preFilledWords.length > 0) {
        setInputWords(preFilledWords.join('\n'));
      } else {
        setInputWords('');
      }
      setTranslationResponse(null);
      setError(null);
      setSelectedTranslations(new Set());
      setSelectedAlternatives(new Map());
    }
  }, [isOpen, preFilledWords]);

  const handleGenerateTranslations = async () => {
    if (!inputWords.trim()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Parse input words (one per line)
      const words = inputWords.trim().split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
      
      if (words.length === 0) {
        setError('Please enter at least one word');
        return;
      }
      
      const response = await generateWordTranslations({
        words,
        sourceLanguageName,
        targetLanguageName,
        separator
      });
      
      setTranslationResponse(response);
      
      // Select all translations by default
      setSelectedTranslations(new Set(words.map((_, index) => index)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate translations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTranslationToggle = (index: number) => {
    setSelectedTranslations(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
        // Remove alternative selection when deselecting translation
        setSelectedAlternatives(prev => {
          const newMap = new Map(prev);
          newMap.delete(index);
          return newMap;
        });
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const handleAlternativeSelect = (translationIndex: number, alternative: string) => {
    setSelectedAlternatives(prev => {
      const newMap = new Map(prev);
      newMap.set(translationIndex, alternative);
      return newMap;
    });
  };

  const handleSelectAll = () => {
    if (translationResponse) {
      setSelectedTranslations(new Set(translationResponse.translations.map((_, index) => index)));
    }
  };

  const handleDeselectAll = () => {
    setSelectedTranslations(new Set());
  };

  const handleAddSelectedTranslations = () => {
    if (!translationResponse) return;
    
    const translationsToAdd = translationResponse.translations
      .filter((_, index) => selectedTranslations.has(index))
      .map(translation => {
        const translationIndex = translationResponse.translations.indexOf(translation);
        const selectedAlternative = selectedAlternatives.get(translationIndex);
        
        return {
          text1: translation.originalWord,
          text2: selectedAlternative || translation.translation,
          language1Name: sourceLanguageName,
          language2Name: targetLanguageName
        };
      });
    
    onAddTranslations(translationsToAdd);
    onClose();
  };

  const handleCopyFormattedText = () => {
    if (translationResponse) {
      navigator.clipboard.writeText(translationResponse.formattedText);
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getConfidenceIcon = (confidence: string) => {
    switch (confidence) {
      case 'high': return '🟢';
      case 'medium': return '🟡';
      case 'low': return '🔴';
      default: return '⚪';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">AI Word Translation</h2>
              <p className="text-blue-100">
                Generate translations using AI: {sourceLanguageName} → {targetLanguageName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-blue-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {/* Input Section */}
          {!translationResponse && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Enter words to translate (one per line):
                </label>
                <textarea
                  value={inputWords}
                  onChange={(e) => setInputWords(e.target.value)}
                  placeholder={`Enter words in ${sourceLanguageName}:\nhello\nworld\ncomputer\nhouse`}
                  className="w-full h-32 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg resize-none"
                />
                <div className="text-sm text-gray-500 mt-1">
                  Each line should contain one word in {sourceLanguageName}
                </div>
              </div>

              {/* Generate Button */}
              <div className="text-center">
                <button
                  onClick={handleGenerateTranslations}
                  disabled={isLoading || !inputWords.trim()}
                  className="px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 font-bold text-lg shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating Translations...
                    </div>
                  ) : (
                    'Generate Translations'
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-red-700 font-medium">Error: {error}</span>
              </div>
            </div>
          )}

          {/* Translation Results */}
          {translationResponse && (
            <div className="space-y-4">
              {/* Formatted Text Preview */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-green-800 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Ready-to-use Format
                  </h4>
                  <button
                    onClick={handleCopyFormattedText}
                    className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Copy
                  </button>
                </div>
                <pre className="text-green-700 text-sm bg-white p-3 rounded-lg border overflow-x-auto">
                  {translationResponse.formattedText}
                </pre>
              </div>

              {/* Translation List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-gray-800">Translation Results</h4>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSelectAll}
                      className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-lg hover:bg-blue-200 transition-colors"
                    >
                      Select All
                    </button>
                    <button
                      onClick={handleDeselectAll}
                      className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>
                
                {translationResponse.translations.map((translation, index) => (
                  <div
                    key={index}
                    className={`border rounded-xl p-4 transition-all duration-200 cursor-pointer ${
                      selectedTranslations.has(index)
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                        : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-25'
                    }`}
                    onClick={() => handleTranslationToggle(index)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <span className="text-lg font-bold text-gray-800 mr-3">
                            {translation.originalWord}
                          </span>
                          <span className="text-lg text-gray-400 mr-3">{separator}</span>
                          <span className="text-lg font-bold text-blue-600 mr-3">
                            {translation.translation}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getConfidenceColor(translation.confidence)}`}>
                            {getConfidenceIcon(translation.confidence)} {translation.confidence}
                          </span>
                        </div>
                        
                        {translation.alternatives && translation.alternatives.length > 0 && (
                          <div className="mb-2">
                            <span className="text-sm text-gray-600 mb-2 block">Alternatives: </span>
                            <div className="flex flex-wrap gap-2">
                              {translation.alternatives.map((alternative, altIndex) => {
                                const isSelected = selectedAlternatives.get(index) === alternative;
                                return (
                                  <button
                                    key={altIndex}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAlternativeSelect(index, alternative);
                                    }}
                                    className={`px-3 py-1 rounded-lg text-sm transition-all duration-200 ${
                                      isSelected
                                        ? 'bg-blue-500 text-white shadow-md'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                  >
                                    {alternative}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        
                        {translation.context && (
                          <p className="text-gray-600 text-sm">{translation.context}</p>
                        )}
                      </div>
                      
                      <div className={`ml-4 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        selectedTranslations.has(index)
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300'
                      }`}>
                        {selectedTranslations.has(index) && (
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {translationResponse && (
                <>
                  Selected: {selectedTranslations.size} of {translationResponse.translations.length} translations
                </>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSelectedTranslations}
                disabled={selectedTranslations.size === 0}
                className="px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 font-medium"
              >
                Add {selectedTranslations.size} Translations
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TranslationModal;
