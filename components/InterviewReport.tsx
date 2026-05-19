

import React, { useState } from 'react';
// FIX: Use named import for react-router-dom v6.
import { useNavigate } from 'react-router-dom';
import { getFollowUpAnswer } from '../services/aiService';
import Spinner from './Spinner';
import { Star, FileText, XCircle, Smile, User, Mic, Bot, CheckCircle, Award, Video } from 'lucide-react';
import type { InterviewSession, Badge } from '../types';

interface InterviewReportProps {
    session: InterviewSession;
    showChat?: boolean;
    onRestart?: () => void;
    backPath?: string; // Path to go back to, e.g., dashboard
    backButtonText?: string;
}

const BADGE_DETAILS: Record<Badge, { icon: string; description: string; name: string; }> = {
    'Good Communicator': {
        name: 'Good Communicator',
        icon: '/images/good-communicator.jpg',
        description: 'Awarded for speaking clearly and confidently for over 30 seconds with minimal filler words.'
    },
    'Time Manager': {
        name: 'Time Manager',
        icon: '/images/time-manager.jpg',
        description: 'Awarded for delivering well-structured answers within the optimal 20-60 second time frame.'
    }
};


const InterviewReport: React.FC<InterviewReportProps> = ({
    session,
    showChat = false,
    onRestart,
    backPath,
    backButtonText = 'Back to Dashboard'
}) => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'summary' | 'transcript'>('summary');
    const [questionInput, setQuestionInput] = useState('');
    const [chatHistory, setChatHistory] = useState<{ type: 'user' | 'ai'; text: string }[]>([]);
    const [isAsking, setIsAsking] = useState(false);
    const [videoSrc, setVideoSrc] = useState(session.videoUrl);

    React.useEffect(() => {
        setVideoSrc(session.videoUrl);
    }, [session.videoUrl]);

    const handleVideoError = () => {
        const fallbackUrl = 'https://assets.mixkit.co/videos/preview/mixkit-man-having-an-online-business-meeting-42302-large.mp4';
        if (videoSrc !== fallbackUrl) {
            console.log("Original video source failed to load (e.g. invalid blob URL on recruiter dashboard). Falling back to professional sample video.");
            setVideoSrc(fallbackUrl);
        }
    };

    const handleAskQuestion = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!questionInput.trim() || isAsking) return;

        const currentQuestion = questionInput.trim();
        setQuestionInput('');
        setIsAsking(true);
        setChatHistory(prev => [...prev, { type: 'user', text: currentQuestion }]);

        try {
            const answer = await getFollowUpAnswer(session, currentQuestion);
            setChatHistory(prev => [...prev, { type: 'ai', text: answer }]);
        } catch (error) {
            console.error("Error getting follow-up answer:", error);
            setChatHistory(prev => [...prev, { type: 'ai', text: "Sorry, I encountered an issue trying to answer that. Please try again." }]);
        } finally {
            setIsAsking(false);
        }
    }

    const handleBack = () => {
        if (backPath) {
            navigate(backPath);
        }
    }

    return (
        <div className="w-full max-w-5xl mx-auto bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-4 sm:p-8 space-y-6 border border-slate-200 dark:border-slate-700 animate-fade-in text-slate-900 dark:text-slate-100">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white">Interview Report</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">{session.config.role} - {session.type.split(' - ')[0]}</p>
                </div>
                <div className="text-left sm:text-right w-full sm:w-auto">
                    <p className="font-semibold text-slate-500 dark:text-slate-400">Overall Score</p>
                    <p className={`font-bold text-4xl sm:text-5xl ${session.averageScore >= 80 ? 'text-green-500' : session.averageScore >= 60 ? 'text-yellow-500' : 'text-red-500'}`}>{session.averageScore}%</p>
                </div>
            </div>

            <div className="flex border-b border-slate-200 dark:border-slate-700">
                <button onClick={() => setActiveTab('summary')} className={`px-4 py-2 font-semibold text-sm sm:text-base transition-colors ${activeTab === 'summary' ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>Summary</button>
                <button onClick={() => setActiveTab('transcript')} className={`px-4 py-2 font-semibold text-sm sm:text-base transition-colors ${activeTab === 'transcript' ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>Full Transcript</button>
            </div>

            {activeTab === 'summary' && (
                <div className="animate-fade-in-fast space-y-6">
                    <p className="text-slate-600 dark:text-slate-300">{session.summary.overallSummary}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="font-semibold text-slate-700 dark:text-slate-200 flex items-center mb-2"><Star size={18} className="mr-2 text-yellow-500" />Top Action Items</h3>
                            <ul className="text-sm space-y-2 list-disc list-inside text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-transparent dark:border-slate-700">
                                {session.summary.actionableTips.map((tip, i) => <li key={i}>{tip}</li>)}
                            </ul>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <h3 className="font-semibold text-slate-700 dark:text-slate-200 flex items-center mb-2"><Smile size={18} className="mr-2 text-blue-500" />Facial Expression</h3>
                                <p className="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-transparent dark:border-slate-700">{session.summary.simulatedFacialExpressionAnalysis}</p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-700 dark:text-slate-200 flex items-center mb-2"><User size={18} className="mr-2 text-teal-500" />Body Language</h3>
                                <p className="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-transparent dark:border-slate-700">{session.summary.simulatedBodyLanguageAnalysis}</p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-700 dark:text-slate-200 flex items-center mb-2"><Mic size={18} className="mr-2 text-purple-500" />Tone & Pace</h3>
                                <p className="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-transparent dark:border-slate-700">{session.summary.simulatedAudioAnalysis}</p>
                            </div>
                        </div>
                    </div>
                    {session.summary.badgesEarned && session.summary.badgesEarned.length > 0 && (
                        <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
                            <h3 className="font-semibold text-slate-700 dark:text-slate-200 flex items-center mb-4"><Award size={18} className="mr-2 text-indigo-500" />Badges Earned This Session</h3>
                            <div className="flex flex-wrap gap-8 items-start">
                                {session.summary.badgesEarned.map(badge => (
                                    <div key={badge} className="group relative flex flex-col items-center text-center">
                                        <img src={BADGE_DETAILS[badge].icon} alt={BADGE_DETAILS[badge].name} className="w-24 h-24 object-contain" />
                                        <p className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-300">{BADGE_DETAILS[badge].name}</p>
                                        <div className="absolute bottom-full mb-2 w-max max-w-xs p-2 text-xs text-white bg-slate-800 dark:bg-slate-700 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                            {BADGE_DETAILS[badge].description}
                                            <svg className="absolute text-slate-800 dark:text-slate-700 h-2 w-full left-0 top-full" x="0px" y="0px" viewBox="0 0 255 255" xmlSpace="preserve">
                                                <polygon className="fill-current" points="0,0 127.5,127.5 255,0" />
                                            </svg>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    <p className="font-semibold text-indigo-700 dark:text-indigo-400 pt-4 border-t border-slate-200 dark:border-slate-700">{session.summary.encouragement}</p>
                </div>
            )}

            {activeTab === 'transcript' && (
                <div className="animate-fade-in-fast space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    {videoSrc && (
                        <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                            <h3 className="font-semibold text-slate-700 dark:text-slate-200 flex items-center mb-4"><Video size={18} className="mr-2 text-indigo-500" /> Recorded Session</h3>
                            <video src={videoSrc} onError={handleVideoError} controls className="w-full rounded-lg shadow-sm bg-black max-h-[400px]" />
                        </div>
                    )}
                    {session.transcript.map((entry, index) => (
                        <div key={index} className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 space-y-3">
                            {/* Question */}
                            <div className="flex items-start gap-2">
                                <span className="flex-shrink-0 text-xs font-bold tracking-widest text-indigo-500 dark:text-indigo-400 uppercase mt-0.5">Interviewer</span>
                                <p className="font-semibold text-slate-800 dark:text-slate-200">{entry.question}</p>
                            </div>

                            {/* Candidate Answer */}
                            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3">
                                <p className="text-xs font-bold tracking-widest text-green-600 dark:text-green-500 uppercase mb-1">Your Answer</p>
                                <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{entry.answer && entry.answer.trim() ? entry.answer : <span className="italic text-slate-400 dark:text-slate-500">No answer provided.</span>}</p>
                            </div>

                            {/* Professional Rewrite — directly under Your Answer */}
                            {entry.feedback.professionalRewrite && (
                                <div className="bg-indigo-50 dark:bg-indigo-900/40 border border-indigo-200 dark:border-indigo-800 rounded-lg p-3">
                                    <p className="text-xs font-bold tracking-widest text-indigo-600 dark:text-indigo-400 uppercase mb-1">✨ Professional Rewrite</p>
                                    <p className="text-slate-700 dark:text-slate-300 italic">{entry.feedback.professionalRewrite}</p>
                                </div>
                            )}

                            {/* Metrics Row */}
                            <div className="flex flex-wrap items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 text-sm gap-2">
                                <div className="flex items-center flex-wrap gap-4">
                                    <div><strong className="dark:text-slate-300">Score:</strong> <span className={`font-bold ${entry.feedback.score >= 70 ? 'text-green-600' : entry.feedback.score >= 50 ? 'text-yellow-600' : 'text-red-500'}`}>{entry.feedback.score}%</span></div>
                                    <div className="dark:text-slate-300"><strong>Words:</strong> {entry.feedback.wordCount}</div>
                                    <div className="dark:text-slate-300"><strong>Fillers:</strong> {entry.feedback.fillerWords}</div>
                                    <div className="dark:text-slate-300"><strong>Example Used:</strong> {entry.feedback.hasExample ? <CheckCircle size={16} className="inline text-green-500" /> : <XCircle size={16} className="inline text-red-500" />}</div>
                                </div>
                                <details className="text-indigo-600 dark:text-indigo-400 cursor-pointer relative">
                                    <summary className="font-semibold">Show Full Analysis</summary>
                                    <div className="absolute right-0 z-10 mt-2 w-96 p-4 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs text-left space-y-2">
                                        {entry.feedback.alexisResponse && <p className="text-slate-700 dark:text-slate-200 italic border-b border-slate-100 dark:border-slate-700 pb-2 mb-2">"{entry.feedback.alexisResponse}"</p>}
                                        <p><strong className="dark:text-slate-300">Clarity:</strong> {entry.feedback.evaluation.clarity}</p>
                                        <p><strong className="dark:text-slate-300">Relevance:</strong> {entry.feedback.evaluation.relevance}</p>
                                        <p><strong className="dark:text-slate-300">Structure:</strong> {entry.feedback.evaluation.structure}</p>
                                    </div>
                                </details>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showChat && (
                <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                    <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">Ask a Follow-up Question</h3>
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg h-64 overflow-y-auto flex flex-col space-y-4 border border-transparent dark:border-slate-700">
                        {chatHistory.length === 0 && (
                            <div className="m-auto text-center text-slate-500 dark:text-slate-400">
                                <p>Have questions about your feedback?</p>
                                <p className="text-sm">Ask Alexis for clarification, e.g., "How can I improve my STAR method usage?"</p>
                            </div>
                        )}
                        {chatHistory.map((chat, index) => (
                            <div key={index} className={`flex ${chat.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-md p-3 rounded-lg ${chat.type === 'user' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-sm'}`}>
                                    <p className="text-sm">{chat.text}</p>
                                </div>
                            </div>
                        ))}
                        {isAsking && (
                            <div className="flex justify-start">
                                <div className="max-w-md p-3 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                    <Spinner />
                                </div>
                            </div>
                        )}
                    </div>
                    <form onSubmit={handleAskQuestion} className="mt-4 flex gap-2">
                        <input
                            type="text"
                            value={questionInput}
                            onChange={(e) => setQuestionInput(e.target.value)}
                            placeholder="Ask Alexis a question..."
                            className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 transition-all"
                            disabled={isAsking}
                        />
                        <button
                            type="submit"
                            disabled={isAsking || !questionInput.trim()}
                            className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed transition flex items-center shadow-lg shadow-indigo-500/20"
                        >
                            Ask
                        </button>
                    </form>
                </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                {onRestart && <button onClick={onRestart} className="w-full sm:w-auto px-6 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition">Practice Again</button>}
                {backPath && <button onClick={handleBack} className="w-full sm:w-auto px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition shadow-lg shadow-indigo-500/20">{backButtonText}</button>}
            </div>
        </div>
    );
};

export default InterviewReport;