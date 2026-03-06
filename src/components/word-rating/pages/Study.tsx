import React, { useState, useEffect } from 'react';
import { Word, DifficultyLevel } from '../types';
import { calculateNextReview } from '../../../utils/studyAlgorithm';
import WordRatingCard from '../WordRatingCard';
import WordImageModal from '../WordImageModal';
import Confetti from 'react-confetti';

interface StudyProps {
    words: Word[];
    onUpdateDifficulty: (id: number, difficulty: DifficultyLevel, internalScore?: number) => void;
    onExit: () => void;
    initialWord?: Word; // Optional initial word to start with
}

const Study: React.FC<StudyProps> = ({ words, onUpdateDifficulty, onExit, initialWord }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [complete, setComplete] = useState(false);
    const [sessionWords, setSessionWords] = useState<Word[]>([]);

    // Image modal state
    const [showImageModal, setShowImageModal] = useState(false);
    const [currentImageWord, setCurrentImageWord] = useState('');
    const [currentImageLanguage, setCurrentImageLanguage] = useState('');

    // Initialize session words
    useEffect(() => {
        if (initialWord) {
            // If specific word provided, just study that one
            setSessionWords([initialWord]);
        } else {
            // Otherwise use the full list provided (which should already be filtered/randomized by parent)
            setSessionWords(words);
        }
    }, [words, initialWord]);

    const handleRate = (rating: DifficultyLevel, internalScore?: number) => {
        if (sessionWords.length === 0) return;

        // Update the word
        const currentWord = sessionWords[currentIndex];
        onUpdateDifficulty(currentWord.id, rating, internalScore);

        // Initial word modunda veya son kelimede isek bitir
        if (initialWord || currentIndex >= sessionWords.length - 1) {
            setComplete(true);
            setTimeout(() => {
                onExit();
            }, 3000); // 3 seconds to show completion screen
        } else {
            setCurrentIndex(prev => prev + 1);
        }
    };

    const handleImageClick = (wordText: string, languageName?: string) => {
        setCurrentImageWord(wordText);
        setCurrentImageLanguage(languageName || '');
        setShowImageModal(true);
    };

    if (sessionWords.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (complete) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 relative overflow-hidden">
                <Confetti
                    width={window.innerWidth}
                    height={window.innerHeight}
                    recycle={true}
                    numberOfPieces={200}
                />
                <div className="bg-white p-12 rounded-3xl shadow-2xl text-center transform scale-110 border border-slate-100 relative z-10">
                    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-4xl font-extrabold text-slate-800 mb-2">Session Complete!</h2>
                    <p className="text-slate-500 text-lg">Great job keeping up with your studies.</p>
                </div>
            </div>
        );
    }

    const currentWord = sessionWords[currentIndex];
    // Calculate progress percentage
    const progress = ((currentIndex) / sessionWords.length) * 100;

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative">
            {/* Progress Bar */}
            {!initialWord && (
                <div className="absolute top-0 left-0 w-full h-2 bg-slate-200">
                    <div
                        className="h-full bg-indigo-600 transition-all duration-300 ease-out"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
            )}

            <div className="w-full max-w-lg relative z-10">
                <div className="mb-6 flex justify-between items-center text-slate-500 font-medium px-2">
                    {!initialWord ? (
                        <span>Word {currentIndex + 1} of {sessionWords.length}</span>
                    ) : (
                        <span>Single Review Mode</span>
                    )}
                    <button
                        onClick={onExit}
                        className="hover:text-slate-800 transition-colors flex items-center gap-1"
                    >
                        <span>Exit</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <WordRatingCard
                    word={currentWord}
                    onRate={handleRate}
                    isStudyMode={true}
                    onImageClick={() => handleImageClick(currentWord.text1, currentWord.language1Name)}
                />
            </div>

            {showImageModal && (
                <WordImageModal
                    word={currentImageWord}
                    language={currentImageLanguage}
                    onClose={() => setShowImageModal(false)}
                />
            )}
        </div>
    );
};

export default Study;
