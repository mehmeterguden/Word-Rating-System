import React, { useState } from 'react';
import { Word, DifficultyLevel } from '../../types/word-rating';
import { displayLevelToScore } from '../../utils/word-rating/studyAlgorithm';
import WordImageModal from './WordImageModal';
import { Volume2, Image as ImageIcon, Check, Trash2, RotateCcw } from 'lucide-react';

interface WordRatingCardProps {
    word: Word;
    onUpdateDifficulty: (id: number, difficulty: DifficultyLevel, internalScore?: number) => void;
    onRemoveWord: (id: number) => void;
    onResetEvaluation: (id: number) => void;
    onStartEvaluationWithWord?: (word: Word) => void;
    fallbackLearningLanguageName?: string; // Used if word.language1Name is missing
    fallbackKnownLanguageName?: string; // Used if word.language2Name is missing
    isSelectionMode?: boolean;
    isSelected?: boolean;
    onToggleSelection?: (wordId: number) => void;
    onImageClick?: (wordText: string, languageName?: string) => void; // For global image modal
}

const WordRatingCard: React.FC<WordRatingCardProps> = ({
    word,
    onUpdateDifficulty,
    onRemoveWord,
    onResetEvaluation,
    onStartEvaluationWithWord,
    fallbackLearningLanguageName,
    fallbackKnownLanguageName,
    isSelectionMode = false,
    isSelected = false,
    onToggleSelection,
    onImageClick
}) => {
    const [showImageModal, setShowImageModal] = useState(false);
    const [currentImageWord, setCurrentImageWord] = useState('');
    const [currentImageLanguage, setCurrentImageLanguage] = useState('');

    const getRatingButtonColor = (rating: number, isSelected: boolean) => {
        if (isSelected) {
            switch (rating) {
                case 1: return 'bg-gradient-to-br from-green-400 to-emerald-600 text-white shadow-xl scale-110 ring-4 ring-emerald-100';
                case 2: return 'bg-gradient-to-br from-blue-400 to-indigo-600 text-white shadow-xl scale-110 ring-4 ring-indigo-100';
                case 3: return 'bg-gradient-to-br from-yellow-400 to-amber-600 text-white shadow-xl scale-110 ring-4 ring-amber-100';
                case 4: return 'bg-gradient-to-br from-orange-400 to-red-500 text-white shadow-xl scale-110 ring-4 ring-orange-100';
                case 5: return 'bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-xl scale-110 ring-4 ring-rose-100';
                default: return 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg scale-110 border-2 border-blue-400';
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

    const getDifficultyBadgeColor = (difficulty: number) => {
        switch (difficulty) {
            case 1: return 'bg-gradient-to-r from-green-500 to-emerald-600 text-white';
            case 2: return 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white';
            case 3: return 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white';
            case 4: return 'bg-gradient-to-r from-orange-500 to-red-500 text-white';
            case 5: return 'bg-gradient-to-r from-red-500 to-rose-600 text-white';
            default: return 'bg-gray-100 text-gray-700 border border-gray-300';
        }
    };

    const getDifficultyLabel = (difficulty: number): string => {
        switch (difficulty) {
            case 1: return 'Very Easy';
            case 2: return 'Easy';
            case 3: return 'Medium';
            case 4: return 'Hard';
            case 5: return 'Very Hard';
            default: return 'Not Rated';
        }
    };

    const handleCardClick = (e: React.MouseEvent) => {
        // Don't trigger if clicking on buttons or interactive elements
        if (
            (e.target as HTMLElement).closest('button') ||
            (e.target as HTMLElement).closest('[role="button"]')
        ) {
            return;
        }

        if (onStartEvaluationWithWord) {
            onStartEvaluationWithWord(word);
        }
    };

    const getLanguageCode = (languageName: string): string => {
        const languageMap: { [key: string]: string } = {
            'English': 'en-US',
            'Turkish': 'tr-TR',
            'Spanish': 'es-ES',
            'French': 'fr-FR',
            'German': 'de-DE',
            'Italian': 'it-IT',
            'Portuguese': 'pt-PT',
            'Russian': 'ru-RU',
            'Chinese': 'zh-CN',
            'Japanese': 'ja-JP',
            'Korean': 'ko-KR',
            'Arabic': 'ar-SA',
            'Hindi': 'hi-IN',
            'Dutch': 'nl-NL',
            'Swedish': 'sv-SE',
            'Norwegian': 'no-NO',
            'Danish': 'da-DK',
            'Finnish': 'fi-FI',
            'Polish': 'pl-PL',
            'Czech': 'cs-CZ',
            'Hungarian': 'hu-HU',
            'Greek': 'el-GR',
            'Hebrew': 'he-IL',
            'Thai': 'th-TH',
            'Vietnamese': 'vi-VN',
            'Indonesian': 'id-ID',
            'Malay': 'ms-MY',
            'Filipino': 'fil-PH'
        };

        return languageMap[languageName] || 'en-US';
    };

    const speakWord = (text: string, language?: string) => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);

            // Set language if available
            if (language) {
                utterance.lang = getLanguageCode(language);
            }

            // Set voice properties for better pronunciation
            utterance.rate = 0.8;
            utterance.pitch = 1;
            utterance.volume = 1;

            // Try to find a voice that matches the language
            const voices = speechSynthesis.getVoices();
            const preferredVoice = voices.find(voice =>
                voice.lang.startsWith(getLanguageCode(language || 'en'))
            );

            if (preferredVoice) {
                utterance.voice = preferredVoice;
            }

            speechSynthesis.speak(utterance);
        } else {
            console.warn('Speech synthesis not supported');
        }
    };

    // Resim modal'ını aç
    const handleImageClick = (wordText: string, languageName?: string) => {
        if (onImageClick) {
            // Global modal kullan (Home sayfası için)
            onImageClick(wordText, languageName);
        } else {
            // Local modal kullan (diğer sayfalar için)
            setCurrentImageWord(wordText);
            setCurrentImageLanguage(languageName || '');
            setShowImageModal(true);
        }
    };

    return (
        <div
            onClick={isSelectionMode ? () => onToggleSelection?.(word.id) : handleCardClick}
            className={`bg-white/95 backdrop-blur-sm rounded-3xl p-6 transition-all duration-300 shadow-xl border border-slate-100 group relative overflow-hidden ${isSelected
                    ? 'ring-4 ring-green-200 border-green-300 bg-green-50/50'
                    : isSelectionMode
                        ? 'hover:bg-white hover:shadow-2xl hover:scale-[1.02] cursor-pointer hover:border-green-200 hover:ring-2 hover:ring-green-100'
                        : onStartEvaluationWithWord
                            ? 'hover:bg-white hover:shadow-2xl hover:scale-[1.02] cursor-pointer hover:border-blue-200 hover:ring-2 hover:ring-blue-100'
                            : 'hover:bg-white hover:shadow-2xl'
                }`}
        >
            <div className="flex items-center justify-between">
                {/* Left side - Word text and status */}
                <div className="flex items-center space-x-4 min-w-0 flex-1">
                    {/* Selection Checkbox */}
                    {isSelectionMode && (
                        <div className="flex-shrink-0">
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${isSelected
                                    ? 'bg-green-500 border-green-500'
                                    : 'border-gray-300 hover:border-green-400'
                                }`}>
                                {isSelected && (
                                    <Check className="w-4 h-4 text-white" />
                                )}
                            </div>
                        </div>
                    )}
                    <div className="flex flex-col min-w-0 w-full">
                        <div className="flex items-center space-x-3">
                            <span className={`text-xl font-semibold truncate ${word.isEvaluated ? 'text-gray-900' : 'text-gray-700'}`}>
                                {word.text1}
                            </span>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        speakWord(word.text1, word.language1Name || fallbackLearningLanguageName);
                                    }}
                                    className="p-1.5 rounded-full text-blue-500 hover:text-blue-700 hover:bg-blue-50 transition-all duration-200 hover:scale-110"
                                    title={`Listen to pronunciation of "${word.text1}"`}
                                >
                                    <Volume2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleImageClick(word.text1, word.language1Name || fallbackLearningLanguageName);
                                    }}
                                    className="p-1.5 rounded-full text-purple-500 hover:text-purple-700 hover:bg-purple-50 transition-all duration-200 hover:scale-110"
                                    title="Show image"
                                >
                                    <ImageIcon className="w-4 h-4" />
                                </button>
                            </div>
                            {((word.language1Name || fallbackLearningLanguageName) && (word.language2Name || fallbackKnownLanguageName)) && (
                                <span className="px-2 py-1 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap flex-shrink-0">
                                    {(word.language1Name || fallbackLearningLanguageName || '').toString()} → {(word.language2Name || fallbackKnownLanguageName || '').toString()}
                                </span>
                            )}
                            {!word.isEvaluated && (
                                <span className="px-3 py-1 text-xs font-medium bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-full flex-shrink-0 shadow-md animate-pulse">
                                    Pending
                                </span>
                            )}
                        </div>
                        {word.text2 && (
                            <div className="flex items-center space-x-2 mt-1 w-full">
                                <span className="text-base text-gray-500 truncate block max-w-[80%]">
                                    {word.text2}
                                </span>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        speakWord(word.text2, word.language2Name || fallbackKnownLanguageName);
                                    }}
                                    className="p-1 rounded-full text-blue-500 hover:text-blue-700 hover:bg-blue-50 transition-all duration-200 hover:scale-110 flex-shrink-0"
                                    title={`Listen to pronunciation of "${word.text2}"`}
                                >
                                    <Volume2 className="w-3 h-3" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right side - Fixed width layout */}
                <div className="flex items-center space-x-8 ml-6 flex-shrink-0">
                    {/* Difficulty Rating Buttons - Fixed Width Container */}
                    <div className="flex space-x-3 w-80 justify-center flex-shrink-0">
                        {[1, 2, 3, 4, 5].map((rating) => (
                            <button
                                key={rating}
                                onClick={() => {
                                    const internalScore = displayLevelToScore(rating as DifficultyLevel);
                                    onUpdateDifficulty(word.id, rating as DifficultyLevel, internalScore);
                                }}
                                className={`w-14 h-14 rounded-2xl text-lg font-extrabold transition-all duration-300 transform hover:scale-110 active:scale-95 ${getRatingButtonColor(rating, word.difficulty === rating)
                                    }`}
                            >
                                {rating}
                            </button>
                        ))}
                    </div>

                    {/* Difficulty Label - Fixed Width */}
                    <div className="w-40 flex items-center justify-center flex-shrink-0">
                        <span className={`px-6 py-3 rounded-2xl text-sm font-semibold shadow-lg w-full text-center ${getDifficultyBadgeColor(word.difficulty)}`}>
                            {word.difficulty > 0 ? getDifficultyLabel(word.difficulty) : 'Not Rated'}
                        </span>
                    </div>

                    {/* Action Buttons - Fixed Width */}
                    <div className="flex items-center space-x-3 w-24 flex-shrink-0">
                        {/* Reset Button */}
                        <button
                            onClick={() => onResetEvaluation(word.id)}
                            className={`p-3 rounded-2xl transition-all duration-300 ${word.isEvaluated
                                    ? 'text-orange-600 hover:text-orange-700 hover:bg-orange-50 hover:scale-110 shadow-md'
                                    : 'text-gray-300 cursor-not-allowed'
                                }`}
                            disabled={!word.isEvaluated}
                            title={word.isEvaluated ? "Reset Evaluation" : "Not yet evaluated"}
                        >
                            <RotateCcw className="w-5 h-5" />
                        </button>

                        {/* Delete Button */}
                        <button
                            onClick={() => onRemoveWord(word.id)}
                            className="p-3 rounded-2xl text-red-500 hover:text-red-700 hover:bg-red-50 hover:scale-110 transition-all duration-300 shadow-md"
                            title="Delete Word"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Image Modal */}
            <WordImageModal
                word={currentImageWord}
                languageName={currentImageLanguage}
                isOpen={showImageModal}
                onClose={() => setShowImageModal(false)}
            />
        </div>
    );
};

export default WordRatingCard;
