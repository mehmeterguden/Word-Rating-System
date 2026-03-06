import React from 'react';
import { Word } from '../types';

interface HomeProps {
    words: Word[];
    onStartEvaluation: () => void;
    onStartStudy: () => void;
    onResumeStudy: () => void;
}

const Home: React.FC<HomeProps> = ({
    words,
    onStartEvaluation,
    onStartStudy,
    onResumeStudy
}) => {
    const unevaluated = words.filter(w => !w.isEvaluated).length;
    const evaluated = words.filter(w => w.isEvaluated).length;
    const learning = words.filter(w => w.isEvaluated && w.difficulty && w.difficulty < 5 && w.difficulty > 1).length;
    const mastered = words.filter(w => w.isEvaluated && w.difficulty === 1).length;

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Hero Section */}
                <div className="text-center mb-16 relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-blue-200/30 to-purple-200/30 rounded-full blur-3xl -z-10 animate-pulse"></div>

                    <h1 className="text-6xl font-black mb-6 tracking-tight relative">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 animate-gradient-x">
                            LearnTrack
                        </span>
                        <span className="absolute -top-6 -right-6 text-2xl animate-bounce">✨</span>
                    </h1>

                    <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed mb-8">
                        Master new languages with our intelligent rating system.
                        Track your progress, focus on what matters, and learn faster.
                    </p>

                    <div className="flex justify-center gap-4">
                        <button
                            onClick={() => window.location.href = '/add-words'}
                            className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-lg hover:bg-slate-800 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex items-center space-x-2 group"
                        >
                            <svg className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                            </svg>
                            <span>Add New Words</span>
                        </button>

                        {unevaluated > 0 && (
                            <button
                                onClick={onStartEvaluation}
                                className="px-8 py-4 bg-white text-indigo-600 rounded-2xl font-bold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-indigo-100 flex items-center space-x-2 group"
                            >
                                <svg className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                </svg>
                                <span>Evaluate ({unevaluated})</span>
                            </button>
                        )}

                        {evaluated > 0 && (
                            <button
                                onClick={onStartStudy}
                                className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-bold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex items-center space-x-2 group"
                            >
                                <svg className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                                <span>Start Studying</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                    <StatCard
                        title="Total Words"
                        value={words.length}
                        icon={
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                        }
                        color="bg-blue-50"
                        textColor="text-blue-600"
                        trend="+12 this week"
                    />
                    <StatCard
                        title="Studied"
                        value={evaluated}
                        icon={
                            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        }
                        color="bg-purple-50"
                        textColor="text-purple-600"
                        trend={`${Math.round((evaluated / (words.length || 1)) * 100)}% complete`}
                    />
                    <StatCard
                        title="Learning"
                        value={learning}
                        icon={
                            <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        }
                        color="bg-amber-50"
                        textColor="text-amber-600"
                        trend="Needs practice"
                    />
                    <StatCard
                        title="Mastered"
                        value={mastered}
                        icon={
                            <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                            </svg>
                        }
                        color="bg-emerald-50"
                        textColor="text-emerald-600"
                        trend="Keep it up!"
                    />
                </div>

                {/* Features Section */}
                <div className="grid md:grid-cols-2 gap-8 mb-16">
                    <FeatureCard
                        title="Smart Evaluation"
                        description="Our system learns from your responses to suggest words you need to practice most."
                        icon="🧠"
                        color="from-indigo-500 to-purple-500"
                        onClick={onStartEvaluation}
                        actionText="Start Evaluation"
                    />
                    <FeatureCard
                        title="Quick Study"
                        description="Short, focused study sessions designed to fit into your busy schedule."
                        icon="⚡"
                        color="from-pink-500 to-rose-500"
                        onClick={onStartStudy}
                        actionText="Quick Session"
                    />
                </div>
            </div>
        </div>
    );
};

interface StatCardProps {
    title: string;
    value: number;
    icon: React.ReactNode;
    color: string;
    textColor: string;
    trend: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, textColor, trend }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-300">
        <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-xl ${color}`}>
                {icon}
            </div>
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${color} ${textColor}`}>
                {trend}
            </span>
        </div>
        <h3 className="text-slate-500 text-sm font-medium mb-1">{title}</h3>
        <p className="text-3xl font-bold text-slate-800">{value}</p>
    </div>
);

interface FeatureCardProps {
    title: string;
    description: string;
    icon: string;
    color: string;
    onClick: () => void;
    actionText: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ title, description, icon, color, onClick, actionText }) => (
    <div className="group relative overflow-hidden rounded-3xl bg-white p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100">
        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${color} opacity-10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110`}></div>

        <div className="relative z-10">
            <div className="text-4xl mb-6">{icon}</div>
            <h3 className="text-2xl font-bold text-slate-800 mb-3">{title}</h3>
            <p className="text-slate-600 mb-8 leading-relaxed max-w-sm">
                {description}
            </p>

            <button
                onClick={onClick}
                className="flex items-center space-x-2 text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors"
            >
                <span>{actionText}</span>
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
            </button>
        </div>
    </div>
);

export default Home;
