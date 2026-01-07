

import React, { useState, useCallback, useEffect } from 'react';
// FIX: Replaced `useHistory` with `useNavigate` for react-router-dom v6 compatibility.
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { parseResume } from '../services/geminiService';
import Spinner, { PageSpinner } from '../components/Spinner';
import { UploadCloud, CheckCircle, AlertTriangle, Lightbulb, TrendingUp, BarChart, History, Award, BookOpen, Mic } from 'lucide-react';
import type { InterviewSession, Badge } from '../types';

const calculateSkillProgress = (interviewHistory: InterviewSession[]) => {
    const skills = {
        communication: { scores: [] as number[] },
        technicalKnowledge: { scores: [] as number[] },
        problemSolving: { scores: [] as number[] },
        confidence: { scores: [] as number[] },
    };

    if (!interviewHistory || interviewHistory.length === 0) {
        return { communication: 0, technicalKnowledge: 0, problemSolving: 0, confidence: 0 };
    }

    interviewHistory.forEach(session => {
        session.transcript.forEach(entry => {
            const score = entry.feedback.score;
            skills.confidence.scores.push(score);

            if (session.config.type === 'Behavioral') {
                skills.communication.scores.push(score);
            }
            if (session.config.type === 'Technical') {
                skills.technicalKnowledge.scores.push(score);
            }
            if (session.config.type === 'Technical' || session.config.type === 'Role-Specific') {
                skills.problemSolving.scores.push(score);
            }
        });
    });

    const calculateAverage = (skillScores: number[]) => {
        if (skillScores.length === 0) return 0;
        const sum = skillScores.reduce((acc, s) => acc + s, 0);
        return Math.round(sum / skillScores.length);
    };

    return {
        communication: calculateAverage(skills.communication.scores),
        technicalKnowledge: calculateAverage(skills.technicalKnowledge.scores),
        problemSolving: calculateAverage(skills.problemSolving.scores),
        confidence: calculateAverage(skills.confidence.scores),
    };
};

const BADGE_DETAILS: Record<Badge, { icon: string; description: string; name: string; }> = {
    'Good Communicator': {
        name: 'Good Communicator',
        icon: 'https://drive.google.com/uc?export=view&id=1pxQEhiRJV6aLZrcsfd8NPeLVXmnjMAHS',
        description: 'Awarded for speaking clearly and confidently for over 30 seconds with minimal filler words.'
    },
    'Time Manager': {
        name: 'Time Manager',
        icon: 'https://drive.google.com/uc?export=view&id=1ByesZgi0NGmXRc57fLvnJ7bTyYMaVTCF',
        description: 'Awarded for delivering well-structured answers within the optimal 20-60 second time frame.'
    }
};

const ScoreTrendChart: React.FC<{ data: InterviewSession[] }> = ({ data }) => {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    if (!data || data.length < 2) {
        return <div className="flex items-center justify-center h-48 text-slate-500">Not enough data to display trend.</div>;
    }

    const chartData = [...data].reverse(); // oldest to newest
    const width = 500;
    const height = 150;
    const padding = { top: 10, bottom: 20, left: 30, right: 10 };

    const maxScore = 100;
    const minScore = 0;

    const getX = (index: number) => padding.left + (index / (chartData.length - 1)) * (width - padding.left - padding.right);
    const getY = (score: number) => height - padding.bottom - ((score - minScore) / (maxScore - minScore)) * (height - padding.top - padding.bottom);

    const points = chartData.map((session, i) => `${getX(i)},${getY(session.averageScore)}`).join(' ');
    const areaPath = `M${getX(0)},${height - padding.bottom} L${points} L${getX(chartData.length - 1)},${height - padding.bottom} Z`;
    
    return (
        <div className="relative">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
                 <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                </defs>

                {/* Grid lines */}
                {[0, 25, 50, 75, 100].map(y => (
                    <g key={y}>
                        <line x1={padding.left} x2={width - padding.right} y1={getY(y)} y2={getY(y)} stroke="#e2e8f0" strokeWidth="1" />
                        <text x={padding.left - 5} y={getY(y) + 4} textAnchor="end" className="text-xs fill-slate-400">{y}</text>
                    </g>
                ))}
                
                {/* Area path */}
                <path d={areaPath} fill="url(#areaGradient)" />

                {/* Chart line */}
                <polyline points={points} fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                
                {/* Data points */}
                {chartData.map((session, i) => (
                    <circle 
                        key={i} 
                        cx={getX(i)} 
                        cy={getY(session.averageScore)} 
                        r={hoveredIndex === i ? 6 : 4} 
                        fill="#fff"
                        stroke="#4f46e5"
                        strokeWidth="2"
                        className="transition-all duration-150 cursor-pointer"
                        onMouseEnter={() => setHoveredIndex(i)}
                        onMouseLeave={() => setHoveredIndex(null)}
                    />
                ))}

                 {/* X-axis labels */}
                <text x={getX(0)} y={height - 5} textAnchor="start" className="text-xs fill-slate-400">{new Date(chartData[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</text>
                <text x={getX(chartData.length - 1)} y={height - 5} textAnchor="end" className="text-xs fill-slate-400">{new Date(chartData[chartData.length - 1].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</text>
            
                 {/* Tooltip */}
                {hoveredIndex !== null && (
                    <g transform={`translate(${getX(hoveredIndex)}, ${getY(chartData[hoveredIndex].averageScore) - 10})`}>
                         <path d={`M -10 -8 L 0 0 L 10 -8`} fill="rgba(15, 23, 42, 0.9)" transform={`translate(0, 31)`}/>
                        <rect x="-48" y="-22" width="96" height="24" rx="4" fill="rgba(15, 23, 42, 0.9)" />
                        <text x="0" y="-8" textAnchor="middle" fill="white" className="text-xs font-semibold tracking-wide">
                           {chartData[hoveredIndex].averageScore}% on {new Date(chartData[hoveredIndex].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </text>
                    </g>
                )}
            </svg>
        </div>
    );
};


const ProgressDashboard: React.FC = () => {
    const { interviewHistory } = useAppContext();
    // FIX: Replaced `useHistory` with `useNavigate` for react-router-dom v6 compatibility.
    const navigate = useNavigate();

    const skillProgress = calculateSkillProgress(interviewHistory);
    const skillsToDisplay = [
        { name: 'Communication', score: skillProgress.communication },
        { name: 'Technical Knowledge', score: skillProgress.technicalKnowledge },
        { name: 'Problem Solving', score: skillProgress.problemSolving },
        { name: 'Confidence', score: skillProgress.confidence },
    ];

    const totalInterviews = interviewHistory.length;
    const averageScore = totalInterviews > 0 ? Math.round(interviewHistory.reduce((acc, s) => acc + s.averageScore, 0) / totalInterviews) : 0;
    const lastInterview = totalInterviews > 0 ? new Date(interviewHistory[0].date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }) : 'N/A';
    
    const allBadges = new Set<Badge>();
    interviewHistory.forEach(session => {
        session.summary.badgesEarned?.forEach(badge => allBadges.add(badge));
    });
    const uniqueBadges = Array.from(allBadges);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Your Progress</h1>
                    <p className="text-slate-600 mt-1">Track your interview skills and performance over time.</p>
                </div>
                <button 
                    onClick={() => navigate('/candidate/interview')}
                    className="px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition flex items-center shadow-sm w-full sm:w-auto justify-center">
                    <Mic size={16} className="mr-2" />
                    Start New Interview
                </button>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-6">
                     {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                            <h3 className="font-semibold text-slate-500">Total Interviews</h3>
                            <p className="text-3xl sm:text-4xl font-bold text-indigo-600 mt-2">{totalInterviews}</p>
                        </div>
                        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                            <h3 className="font-semibold text-slate-500">Average Score</h3>
                            <p className="text-3xl sm:text-4xl font-bold text-indigo-600 mt-2">{averageScore}%</p>
                        </div>
                        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                            <h3 className="font-semibold text-slate-500">Last Interview</h3>
                            <p className="text-3xl sm:text-4xl font-bold text-indigo-600 mt-2">{lastInterview}</p>
                        </div>
                    </div>

                    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-200">
                        <h3 className="text-lg font-semibold flex items-center mb-2"><TrendingUp size={20} className="mr-2 text-indigo-500"/>Score Trend</h3>
                        <ScoreTrendChart data={interviewHistory} />
                    </div>

                    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-200">
                        <h3 className="text-lg font-semibold flex items-center mb-4"><History size={20} className="mr-2 text-indigo-500"/>Recent Interviews</h3>
                        <div className="space-y-3">
                            {interviewHistory.slice(0, 3).map((session, index) => (
                                <div key={index} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                                    <div>
                                        <p className="font-semibold text-slate-800">{session.type}</p>
                                        <p className="text-sm text-slate-500">{new Date(session.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} · {session.duration} min</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-lg text-indigo-600">{session.averageScore}%</p>
                                        <button className="text-sm text-indigo-600 hover:underline">View Report</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                
                {/* Right Column */}
                <div className="space-y-6">
                    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-200">
                        <h3 className="text-lg font-semibold flex items-center mb-4"><Award size={20} className="mr-2 text-indigo-500"/>Your Badges</h3>
                        {uniqueBadges.length > 0 ? (
                            <div className="flex flex-wrap gap-6 justify-center">
                                {uniqueBadges.map(badge => (
                                    <div key={badge} className="group relative flex flex-col items-center">
                                        <img src={BADGE_DETAILS[badge].icon} alt={BADGE_DETAILS[badge].name} className="w-24 h-24 object-contain" />
                                        <p className="mt-2 text-sm font-semibold text-slate-700">{BADGE_DETAILS[badge].name}</p>
                                        <div className="absolute bottom-full mb-2 w-max max-w-xs p-2 text-xs text-white bg-slate-800 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                            {BADGE_DETAILS[badge].description}
                                            <svg className="absolute text-slate-800 h-2 w-full left-0 top-full" x="0px" y="0px" viewBox="0 0 255 255" xmlSpace="preserve">
                                                <polygon className="fill-current" points="0,0 127.5,127.5 255,0"/>
                                            </svg>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-slate-500 text-center py-4">Complete interviews and earn badges for your achievements!</p>
                        )}
                    </div>
                    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-200">
                        <h3 className="text-lg font-semibold flex items-center mb-4"><BarChart size={20} className="mr-2 text-indigo-500"/>Skill Progress</h3>
                        <div className="space-y-3">
                           {skillsToDisplay.map(skill => (
                                <div key={skill.name}>
                                    <div className="flex justify-between text-sm font-medium mb-1">
                                        <span className="text-slate-700">{skill.name}</span>
                                        <span className="text-slate-500">{skill.score > 0 ? `${skill.score}%` : 'N/A'}</span>
                                    </div>
                                    <div className="w-full bg-slate-200 rounded-full h-2">
                                        <div className="bg-green-500 h-2 rounded-full" style={{width: `${skill.score}%`}}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-200">
                        <h3 className="text-lg font-semibold flex items-center mb-4"><BookOpen size={20} className="mr-2 text-indigo-500"/>Practice Recommendations</h3>
                        <div className="space-y-2">
                            <button className="w-full text-left p-3 bg-indigo-50 hover:bg-indigo-100 rounded-lg text-indigo-800 font-semibold transition">Technical Interview Practice</button>
                            <button className="w-full text-left p-3 bg-indigo-50 hover:bg-indigo-100 rounded-lg text-indigo-800 font-semibold transition">Behavioral Question Practice</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const CandidateDashboardPage: React.FC = () => {
    const { 
        resumeData, setResumeData, isLoading, setLoading, setError, error, 
        userProfile, updateUserProfile, interviewHistory 
    } = useAppContext();
    const [resumeTextInput, setResumeTextInput] = useState('');
    // FIX: Replaced `useHistory` with `useNavigate` for react-router-dom v6 compatibility.
    const navigate = useNavigate();

    const analyzeResume = useCallback(async (text: string) => {
        if (!text.trim()) {
            setError('Resume text is empty.');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const data = await parseResume(text);
            setResumeData(data);
            if (userProfile && userProfile.resumeText !== text) {
                updateUserProfile({ ...userProfile, resumeText: text, skills: data.skills });
            } else if (userProfile) {
                updateUserProfile({ ...userProfile, skills: data.skills });
            }
        } catch (err) {
            setError('Failed to parse resume. The AI model might be unavailable. Please try again.');
            console.error(err);
            if (userProfile) {
                updateUserProfile({ ...userProfile, resumeText: '' });
            }
        } finally {
            setLoading(false);
        }
    }, [setLoading, setError, setResumeData, userProfile, updateUserProfile]);


    useEffect(() => {
        if (userProfile?.resumeText && !resumeData && !isLoading) {
            analyzeResume(userProfile.resumeText);
        }
    }, [userProfile, resumeData, isLoading, analyzeResume]);

    const handleManualAnalyze = () => {
        analyzeResume(resumeTextInput);
    };

    const handleGenerateRoadmap = useCallback(() => {
        navigate('/candidate/roadmap');
    }, [navigate]);

    // Render logic based on user state
    if (interviewHistory.length > 0) {
        return <ProgressDashboard />;
    }

    if (isLoading) {
        const message = userProfile?.resumeText && !resumeData ? "Analyzing resume from your profile..." : "Loading...";
        return <PageSpinner message={message} />;
    }

    if (resumeData) {
        // State: Resume analyzed, show next step
        return (
             <div className="space-y-8">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Dashboard</h1>
                    <p className="text-slate-600 mt-1">Your resume has been analyzed. Ready for the next step?</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 animate-fade-in max-w-lg mx-auto">
                    <h2 className="text-xl font-semibold mb-4 flex items-center"><CheckCircle className="mr-2 text-green-500" /> Analysis Complete</h2>
                    <div className="space-y-4">
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                             <h3 className="font-semibold text-slate-800 mb-2">Top Skills Identified</h3>
                             {resumeData.skills && resumeData.skills.length > 0 ? (
                                <ul className="list-disc list-inside text-slate-600 text-sm space-y-1">
                                    {resumeData.skills.slice(0,5).map((item, index) => <li key={index}>{item}</li>)}
                                </ul>
                            ) : (
                                <p className="text-slate-500 text-sm">No specific skills were identified. You might want to update your resume text in the profile page.</p>
                            )}
                        </div>
                        <button
                            onClick={handleGenerateRoadmap}
                            className="w-full mt-2 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition"
                        >
                            Generate Career Roadmap
                        </button>
                    </div>
                </div>
            </div>
        );
    }
    
    // State: No resume, prompt user to provide one
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Candidate Dashboard</h1>
                <p className="text-slate-600 mt-1">Welcome! Let's analyze your resume to unlock your personalized career path.</p>
            </div>
            <div className="max-w-2xl mx-auto">
                <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-slate-200">
                    <h2 className="text-xl font-semibold mb-4 flex items-center"><UploadCloud className="mr-2 text-indigo-500" /> Analyze Your Resume</h2>
                    <p className="text-sm text-slate-500 mb-4">
                        You can upload your resume file in your <a href="#/candidate/profile" className="text-indigo-600 hover:underline">profile settings</a>, or paste the text here to get started immediately.
                    </p>
                    <textarea
                        value={resumeTextInput}
                        onChange={(e) => setResumeTextInput(e.target.value)}
                        placeholder="Paste your resume here..."
                        className="w-full h-64 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                        disabled={isLoading}
                    />
                    <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <button
                        onClick={handleManualAnalyze}
                        disabled={isLoading || !resumeTextInput.trim()}
                        className="w-full sm:w-auto px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed transition flex items-center justify-center"
                        >
                        {isLoading ? <><Spinner size="h-5 w-5" /> <span className="ml-2">Analyzing...</span></> : 'Analyze Resume'}
                        </button>
                        {error && <p className="text-red-500 text-sm flex items-center"><AlertTriangle size={16} className="mr-1" />{error}</p>}
                    </div>
                    {!process.env.VITE_GEMINI_API_KEY && (
                        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm flex items-start">
                        <Lightbulb size={18} className="mr-2 flex-shrink-0 mt-0.5" />
                        <span>
                            <strong>Warning:</strong> Gemini API key not configured. Resume analysis and interview features require it. Set VITE_GEMINI_API_KEY in .env.local.
                        </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CandidateDashboardPage;