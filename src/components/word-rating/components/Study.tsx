import React, { useState, useEffect } from 'react';
import { Word } from '../types';
import { useStudyAlgorithm } from '../hooks/useStudyAlgorithm';
import StudyCard from './study/StudyCard';
import StudyProgress from './study/StudyProgress';
import StudyResult from './study/StudyResult';
import StudyAiAnalysis from './study/StudyAiAnalysis';
import QuizModeSelector from './study/QuizModeSelector';
import ClassicQuizMode from './study/ClassicQuizMode';
import SpeedQuizMode from './study/SpeedQuizMode';
import { QuizConfiguration, QuizSession, QuizStats } from '../types/QuizTypes';

interface StudyProps {
    words: Word[];
    onUpdateWord: (word: Word) => void;
    onExit: () => void;
}

const Study: React.FC<StudyProps> = ({ words, onUpdateWord, onExit }) => {
    const [showResult, setShowResult] = useState(false);
    const [resultSession, setResultSession] = useState<QuizSession | null>(null);
    const [resultStats, setResultStats] = useState<QuizStats | null>(null);
    const [quizConfiguration, setQuizConfiguration] = useState<QuizConfiguration | null>(null);

    const {
        currentWord,
        progress,
        sessionStats,
        submitAnswer,
        nextWord,
        updateDifficulty,
    } = useStudyAlgorithm(words, onUpdateWord, quizConfiguration?.wordCount || 10);

    // If no configuration is selected, show mode selector
    if (!quizConfiguration) {
        return (
            <QuizModeSelector
                words={words}
                onModeSelect={setQuizConfiguration}
                onBack={onExit}
            />
        );
    }

    const handleShowResult = (session: QuizSession, stats: QuizStats) => {
        setResultSession(session);
        setResultStats(stats);
        setShowResult(true);
    };

    const handleRestart = () => {
        setShowResult(false);
        setResultSession(null);
        setResultStats(null);
        setQuizConfiguration(null); // Go back to mode selector
    };

    if (showResult && resultSession && resultStats) {
        return (
            <StudyResult
                session={resultSession}
                stats={resultStats}
                onRestart={handleRestart}
                onExit={onExit}
            />
        );
    }

    // Render appropriate mode based on configuration
    if (quizConfiguration.mode === 'speed') {
        return (
            <SpeedQuizMode
                words={words}
                updateDifficulty={updateDifficulty}
                configuration={quizConfiguration}
                onEndQuiz={() => { }} // SpeedQuizMode handles ending internally via handleShowResult
                onShowResult={handleShowResult}
            />
        );
    }

    // Default to Classic mode
    return (
        <ClassicQuizMode
            words={words}
            updateDifficulty={updateDifficulty}
            configuration={quizConfiguration}
            onEndQuiz={() => { }} // ClassicQuizMode handles ending internally via handleShowResult
            onShowResult={handleShowResult}
        />
    );
};

export default Study;
