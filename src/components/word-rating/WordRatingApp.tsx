import React, { useState, useEffect } from 'react';
import { Word, Page, DifficultyLevel, WordSet } from './types/index';
import Home from './components/Home';
import AddWords from './components/AddWords';
import EvaluationOptions, { EvaluationOptions as EvaluationOptionsType } from './components/EvaluationOptions';
import Study from './components/Study';
import WordSetManager from './components/WordSetManager';
import DebugPage from './components/DebugPage';
import Settings from './components/Settings';
import TextSelectionTest from './components/TextSelectionTest';
import WordSelectionContainer from './WordSelectionContainer';
import WordTranslationProvider from './components/WordTranslationProvider';
import { useWordAnalysis } from './hooks/useWordAnalysis';
// import { initialWords } from './data/initialWords'; // Evaluate if needed

const WordRatingApp: React.FC = () => {
    const [currentPage, setCurrentPage] = useState<Page>('home');
    const [words, setWords] = useState<Word[]>([]);
    const [activeSetId, setActiveSetId] = useState<string>('default');
    const [wordSets, setWordSets] = useState<WordSet[]>([
        {
            id: 'default',
            name: 'My Collection',
            description: 'Default word collection',
            language1: 'English',
            language2: 'Turkish',
            separator: '-',
            createdAt: new Date(),
            isActive: true,
            wordCount: 0
        }
    ]);
    const [developerMode, setDeveloperMode] = useState(false);
    const [evaluationOptions, setEvaluationOptions] = useState<EvaluationOptionsType | null>(null);

    // Load data from localStorage on mount
    useEffect(() => {
        try {
            const savedWords = localStorage.getItem('word-rating-system-words');
            const savedSets = localStorage.getItem('word-rating-system-sets');
            const savedActiveSet = localStorage.getItem('word-rating-system-active-set');
            const savedDevMode = localStorage.getItem('word-rating-system-developer-mode');

            if (savedWords) {
                // Parse dates correctly
                const parsedWords = JSON.parse(savedWords).map((w: any) => ({
                    ...w,
                    createdAt: new Date(w.createdAt)
                }));
                setWords(parsedWords);
            }

            if (savedSets) {
                const parsedSets = JSON.parse(savedSets).map((s: any) => ({
                    ...s,
                    createdAt: new Date(s.createdAt)
                }));
                setWordSets(parsedSets);
            }

            if (savedActiveSet) setActiveSetId(savedActiveSet);
            if (savedDevMode === 'true') setDeveloperMode(true);

        } catch (error) {
            console.error('Error loading data:', error);
        }
    }, []);

    // Save data effects
    useEffect(() => {
        localStorage.setItem('word-rating-system-words', JSON.stringify(words));

        // Update word counts in sets
        const updatedSets = wordSets.map(set => ({
            ...set,
            wordCount: words.filter(w => w.setId === set.id).length
        }));

        // Only update if counts changed to avoid infinite loops (simplified check)
        // Actually we should just save to localStorage here, state update for sets should be handled separately if needed
        // But for now let's just save.
        // wait, if we update 'wordSets' state here, we might loop.
        // So let's just save 'updatedSets' to localStorage.
        localStorage.setItem('word-rating-system-sets', JSON.stringify(updatedSets));

    }, [words, wordSets]); // wordSets dependency might be tricky if we update it here.

    useEffect(() => {
        localStorage.setItem('word-rating-system-active-set', activeSetId);
    }, [activeSetId]);

    // Handlers
    const handleAddWords = (newWords: Word[]) => {
        const wordsWithSetId = newWords.map(w => ({
            ...w,
            setId: activeSetId
        }));
        setWords(prev => [...prev, ...wordsWithSetId]);
        setCurrentPage('home');
    };

    const handleUpdateWord = (updatedWord: Word) => {
        setWords(prev => prev.map(w => w.id === updatedWord.id ? updatedWord : w));
    };

    const handleCreateSet = (name: string, description?: string) => {
        const newSet: WordSet = {
            id: Date.now().toString(),
            name,
            description,
            language1: 'English',
            language2: 'Turkish',
            separator: '-',
            createdAt: new Date(),
            isActive: false,
            wordCount: 0
        };
        setWordSets(prev => [...prev, newSet]);
        setActiveSetId(newSet.id);
    };

    const handleDeleteSet = (setId: string) => {
        if (wordSets.length <= 1) return; // Cannot delete last set

        setWordSets(prev => prev.filter(s => s.id !== setId));
        setWords(prev => prev.filter(w => w.setId !== setId));

        if (activeSetId === setId) {
            const remaining = wordSets.filter(s => s.id !== setId);
            if (remaining.length > 0) setActiveSetId(remaining[0].id);
        }
    };

    const handleUpdateSet = (setId: string, name: string, description?: string) => {
        setWordSets(prev => prev.map(s => s.id === setId ? { ...s, name, description } : s));
    };

    const handleExportToExcel = (setId: string) => {
        // Implement export functionality
        alert('Export to Excel feature coming soon!');
    };

    const handleExportToText = (setId: string) => {
        const setWords = words.filter(w => w.setId === setId);
        const text = setWords.map(w => `${w.text1} - ${w.text2}`).join('\n');

        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `word-set-${setId}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Get active words
    const activeWords = words.filter(w => w.setId === activeSetId);

    // Evaluation Start Logic
    const handleStartEvaluation = (options?: EvaluationOptionsType) => {
        if (options) {
            setEvaluationOptions(options);
            setCurrentPage('evaluate');
        } else {
            // Show options first
            setEvaluationOptions(null);
            setCurrentPage('evaluate'); // But wait, EvaluationOptions page is what allows selecting options.
            // If we are already on 'evaluate' page, we show options or the actual evaluation?
            // Let's assume 'evaluate' page shows options first, then transitions to actual evaluation process/component.
            // But here we are just switching the page.
            // Actually, if we want to show options first, we might need a separate component or state.
            // Let's use 'evaluate-options' maybe? Or handle it inside the page.
            // For now, let's assume Page 'evaluate' handles both (via conditional rendering inside if we were building it that way).
            // But `EvaluationOptions` is a component.
            // Let's make `evaluate` page show `EvaluationOptions` component first.
        }
    };

    // Navigation Bar (Simple)
    const Navigation = () => (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 flex justify-around z-50 md:sticky md:top-0 md:bg-white/80 md:backdrop-blur-xl md:border-b md:border-t-0 md:mb-0">
            <NavButton page="home" icon="🏠" label="Home" />
            <NavButton page="add" icon="➕" label="Add Words" />
            <NavButton page="sets" icon="📚" label="Sets" />
            {developerMode && <NavButton page="debug" icon="🔧" label="Debug" />}
            <NavButton page="settings" icon="⚙️" label="Settings" />
        </nav>
    );

    const NavButton = ({ page, icon, label }: { page: Page, icon: string, label: string }) => (
        <button
            onClick={() => {
                setCurrentPage(page);
                if (page === 'evaluate') setEvaluationOptions(null); // Reset options when navigating away/back
            }}
            className={`flex flex-col items-center p-2 rounded-xl transition-all ${currentPage === page ? 'text-blue-600 bg-blue-50 scale-105' : 'text-slate-400 hover:text-slate-600'
                }`}
        >
            <span className="text-xl mb-1">{icon}</span>
            <span className="text-xs font-medium">{label}</span>
        </button>
    );

    return (
        <WordTranslationProvider>
            <div className="pb-20 md:pb-0 md:pt-4">
                <Navigation />

                <div className="md:pt-4">
                    {currentPage === 'home' && (
                        <Home
                            words={activeWords}
                            onStartEvaluation={() => setCurrentPage('evaluate')}
                            onStartStudy={() => setCurrentPage('study')}
                            onResumeStudy={() => setCurrentPage('study')}
                        />
                    )}

                    {currentPage === 'add' && (
                        <AddWords
                            onAddWords={handleAddWords}
                            existingWords={words} // Check against all words or just active? Usually all to prevent duplicates globaly maybe?
                        />
                    )}

                    {currentPage === 'sets' && (
                        <WordSetManager
                            wordSets={wordSets}
                            activeSetId={activeSetId}
                            onSetActive={setActiveSetId}
                            onCreateSet={handleCreateSet}
                            onDeleteSet={handleDeleteSet}
                            onUpdateSet={handleUpdateSet}
                            onExportToExcel={handleExportToExcel}
                            onExportToText={handleExportToText}
                        />
                    )}

                    {currentPage === 'evaluate' && (
                        evaluationOptions ? (
                            // Here we would render the actual evaluation interface (e.g. flashcards for evaluation)
                            // But as per current set of files, 'Study' seems to cover both "Study" and "Evaluate" if configured?
                            // The request implies Evaluation is about determining difficulty level initially.
                            // I haven't migrated `Evaluation.tsx` or similar. I only have `EvaluationOptions`.
                            // Wait, I missed `Evaluation.tsx`?
                            // I created `Study.tsx` which has `useStudyAlgorithm`.
                            // `Home.tsx` has `onStartEvaluation`.
                            // If `currentPage` is `evaluate`, and we have options, we need the Evaluation component.
                            // Is it `WordRatingCard`?
                            // Or maybe I should reuse `Study` for evaluation?
                            // Actually, `WordRatingCard.tsx` in `src/components/word-rating/WordRatingCard.tsx` is for single word rating.
                            // I might need a harness for a batch of `WordRatingCard`s.
                            // Let's assume for now `Study` component handles it or I haven't fully implemented the "Evaluation Session" runner yet.
                            // I will use `Study` component for now as a placeholder, or just show `EvaluationOptions`.
                            // The `EvaluationOptions` component calls `onStart` with options.
                            // I'll log it for now.
                            <div className="p-4 text-center">
                                <h2 className="text-2xl font-bold">Evaluation Session</h2>
                                <p>Options selected: {JSON.stringify(evaluationOptions)}</p>
                                <button onClick={() => setEvaluationOptions(null)} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">Back</button>
                                {/* TODO: Implement EvaluationSession component that uses WordRatingCard iteratively */}
                            </div>
                        ) : (
                            <EvaluationOptions
                                words={activeWords}
                                onStart={setEvaluationOptions}
                                onCancel={() => setCurrentPage('home')}
                            />
                        )
                    )}

                    {currentPage === 'study' && (
                        <Study
                            words={activeWords}
                            onUpdateWord={handleUpdateWord}
                            onExit={() => setCurrentPage('home')}
                        />
                    )}

                    {currentPage === 'settings' && (
                        <Settings setDeveloperMode={setDeveloperMode} />
                    )}

                    {currentPage === 'debug' && (
                        <DebugPage />
                    )}

                    {currentPage === 'text-selection-test' && (
                        <TextSelectionTest />
                    )}
                </div>

                {/* Global Components */}
                <WordSelectionContainer />
            </div>
        </WordTranslationProvider>
    );
};

export default WordRatingApp;
