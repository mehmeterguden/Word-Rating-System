import React, { useState, useEffect } from 'react';
import { Word, DifficultyLevel } from '../../types';
import { QuizQuestion, generateQuizQuestion, generateHint, generateQuizWords } from '../../utils/quizAi';
import { QuizModeProps, QuizSession, QuizStats, QuizResponse } from '../../types/QuizTypes';
import QuizCard from './QuizCard';
import QuizFeedback from './QuizFeedback';

// Common quiz utilities and hooks
export const useQuizBase = (props: QuizModeProps) => {
  const [currentSession, setCurrentSession] = useState<QuizSession | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
  const [currentWord, setCurrentWord] = useState<Word | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState<{ isCorrect: boolean; timestamp: number } | null>(null);
  const [sessionStats, setSessionStats] = useState<QuizStats>({
    totalWords: 0,
    correctAnswers: 0,
    incorrectAnswers: 0,
    accuracy: 0,
    currentStreak: 0,
    longestStreak: 0,
    averageResponseTime: 0,
    totalTime: 0
  });
  const [isGeneratingMore, setIsGeneratingMore] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [isLoadingHint, setIsLoadingHint] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [hintRequests, setHintRequests] = useState(0);

  const availableWords = props.words.filter(word => 
    word.isEvaluated && 
    word.difficulty && 
    word.difficulty > 1
  );

  // Common helper methods
  const getAISelectedWords = async (count: number, usedIds: Set<number>): Promise<Word[]> => {
    const unusedWords = availableWords.filter(word => !usedIds.has(word.id));
    if (unusedWords.length === 0) return [];
    
    try {
      const selectedWords = await generateQuizWords(
        count,
        usedIds,
        availableWords.map(word => ({
          id: word.id,
          text1: word.text1,
          text2: word.text2,
          difficulty: word.difficulty || 2
        })),
        props.configuration.sourceLanguageName,
        props.configuration.targetLanguageName
      );
      
      return selectedWords.map(selectedWord => 
        availableWords.find(word => word.id === selectedWord.id)!
      ).filter(Boolean);
    } catch (error) {
      console.error('AI word selection failed, using random selection:', error);
      const shuffled = [...unusedWords].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, Math.min(count, unusedWords.length));
    }
  };

  const generateMoreQuizWords = async (session: QuizSession) => {
    if (isGeneratingMore) return session;
    
    setIsGeneratingMore(true);
    try {
      const newWords = await getAISelectedWords(5, session.usedWordIds);
      const updatedSession = {
        ...session,
        quizWords: [...session.quizWords, ...newWords]
      };
      return updatedSession;
    } catch (error) {
      console.error('Error generating more quiz words:', error);
      return session;
    } finally {
      setIsGeneratingMore(false);
    }
  };

  const handleHint = async () => {
    if (!currentWord || isLoadingHint) return;
    
    setIsLoadingHint(true);
    setHint(null);
    setHintRequests(prev => prev + 1);
    
    try {
      const hintText = await generateHint(
        currentWord.text1,
        props.configuration.sourceLanguageName,
        props.configuration.explanationLanguageName
      );
      setHint(hintText);
    } catch (error) {
      console.error('Error generating hint:', error);
      setHint('Hint not available at the moment.');
    } finally {
      setIsLoadingHint(false);
    }
  };

  const loadQuestion = async (word: Word) => {
    console.log('🔄 loadQuestion called with word:', word);
    
    if (!word) {
      console.log('❌ No word provided to loadQuestion');
      return;
    }
    
    console.log('⏳ Setting loading state to true');
    setIsLoading(true);
    
    try {
      console.log('🤖 Generating quiz question for:', { 
        text1: word.text1, 
        text2: word.text2, 
        difficulty: word.difficulty 
      });
      
      const question = await generateQuizQuestion(
        word.text1,
        word.text2,
        props.configuration.sourceLanguageName,
        props.configuration.targetLanguageName,
        props.configuration.explanationLanguageName,
        word.difficulty || 2
      );
      
      console.log('✅ Quiz question generated successfully:', question);
      setCurrentQuestion(question);
      setCurrentWord(word);
      console.log('📊 State updated: currentQuestion and currentWord set');
    } catch (error) {
      console.error('❌ Error generating quiz question:', error);
      
      // Create better fallback options
      console.log('🔄 Creating fallback question due to error');
      const fallbackOptions = [
        { text: word.text2, isCorrect: true, explanation: 'This is the correct translation' },
        { text: 'Similar word 1', isCorrect: false, explanation: 'This is incorrect' },
        { text: 'Similar word 2', isCorrect: false, explanation: 'This is incorrect' },
        { text: 'Similar word 3', isCorrect: false, explanation: 'This is incorrect' }
      ];
      
      const fallbackQuestion: QuizQuestion = {
        word: word.text1,
        correctAnswer: word.text2,
        options: fallbackOptions,
        difficulty: word.difficulty || 2
      };
      
      console.log('✅ Fallback question created:', fallbackQuestion);
      setCurrentQuestion(fallbackQuestion);
      setCurrentWord(word);
      console.log('📊 Fallback state updated: currentQuestion and currentWord set');
    } finally {
      console.log('⏳ Setting loading state to false');
      setIsLoading(false);
    }
  };

  const updateStats = (isCorrect: boolean, responseTime: number) => {
    setSessionStats(prev => {
      const newCorrectAnswers = prev.correctAnswers + (isCorrect ? 1 : 0);
      const newIncorrectAnswers = prev.incorrectAnswers + (isCorrect ? 0 : 1);
      const totalAnswered = newCorrectAnswers + newIncorrectAnswers;
      const newAccuracy = totalAnswered > 0 ? (newCorrectAnswers / totalAnswered) * 100 : 0;
      const newCurrentStreak = isCorrect ? prev.currentStreak + 1 : 0;
      const newLongestStreak = Math.max(prev.longestStreak, newCurrentStreak);
      
      const totalResponseTime = prev.averageResponseTime * (totalAnswered - 1) + responseTime;
      const newAverageResponseTime = totalAnswered > 0 ? totalResponseTime / totalAnswered : 0;
      
      return {
        ...prev,
        correctAnswers: newCorrectAnswers,
        incorrectAnswers: newIncorrectAnswers,
        accuracy: newAccuracy,
        currentStreak: newCurrentStreak,
        longestStreak: newLongestStreak,
        averageResponseTime: newAverageResponseTime,
        totalTime: prev.totalTime + responseTime
      };
    });
  };

  const endQuiz = () => {
    if (!currentSession) return;

    const completedSession = {
      ...currentSession,
      endTime: new Date()
    };

    setCurrentSession(completedSession);
    props.onShowResult(completedSession, sessionStats);
  };

  const initializeQuiz = async () => {
    if (availableWords.length === 0) {
      throw new Error('No words available for quiz. Please add and evaluate some words first.');
    }
    
    try {
      const initialWords = await getAISelectedWords(5, new Set());
      
      if (initialWords.length === 0) {
        throw new Error('No suitable words found for quiz generation.');
      }
      
      const session: QuizSession = {
        id: `quiz-${Date.now()}`,
        mode: props.configuration.mode,
        startTime: new Date(),
        responses: [],
        currentQuestionIndex: 0,
        usedWordIds: new Set(),
        quizWords: initialWords,
        configuration: props.configuration
      };
      
      setCurrentSession(session);
      setCurrentIndex(0);
      setSessionStats({
        totalWords: initialWords.length,
        correctAnswers: 0,
        incorrectAnswers: 0,
        accuracy: 0,
        currentStreak: 0,
        longestStreak: 0,
        averageResponseTime: 0,
        totalTime: 0
      });
      
      if (initialWords.length > 0) {
        await loadQuestion(initialWords[0]);
      }
    } catch (error) {
      console.error('Error initializing quiz:', error);
      throw error; // Re-throw to be caught by the calling component
    }
  };

  return {
    // State
    currentSession,
    setCurrentSession,
    currentQuestion,
    setCurrentQuestion,
    currentWord,
    setCurrentWord,
    currentIndex,
    setCurrentIndex,
    isLoading,
    setIsLoading,
    lastResponse,
    setLastResponse,
    sessionStats,
    setSessionStats,
    isGeneratingMore,
    setIsGeneratingMore,
    hint,
    setHint,
    isLoadingHint,
    setIsLoadingHint,
    showFeedback,
    setShowFeedback,
    hintRequests,
    setHintRequests,
    availableWords,
    
    // Methods
    getAISelectedWords,
    generateMoreQuizWords,
    handleHint,
    loadQuestion,
    updateStats,
    endQuiz,
    initializeQuiz
  };
};

// Common render components
export const QuizLoadingScreen: React.FC = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
    <div className="text-center">
      <div className="relative mb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto shadow-lg animate-spin">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>
      
      <h3 className="text-xl font-bold text-slate-800 mb-2">Loading...</h3>
      <p className="text-slate-600 text-sm">Preparing your quiz question</p>
    </div>
  </div>
);

export const QuizErrorScreen: React.FC<{ onEndQuiz: () => void; error?: string }> = ({ onEndQuiz, error }) => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
    <div className="text-center max-w-lg mx-auto p-8">
      <div className="relative mb-8">
        <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-rose-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
      </div>
      
      <h3 className="text-2xl font-bold text-slate-800 mb-3">Quiz Generation Failed</h3>
      <p className="text-slate-600 mb-4 text-lg">We couldn't generate a quiz question for this word.</p>
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700 text-sm font-medium">Error Details:</p>
          <p className="text-red-600 text-sm mt-1">{error}</p>
        </div>
      )}
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-blue-700 text-sm font-medium mb-2">Possible Solutions:</p>
        <ul className="text-blue-600 text-sm text-left space-y-1">
          <li>• Check your internet connection</li>
          <li>• Verify your API key in Settings</li>
          <li>• Try again in a few moments</li>
          <li>• Make sure you have evaluated words</li>
        </ul>
      </div>
      
      <button
        onClick={onEndQuiz}
        className="px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl font-bold text-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-3 mx-auto"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        <span>End Quiz</span>
      </button>
    </div>
  </div>
);