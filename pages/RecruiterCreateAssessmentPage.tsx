


import React, { useState } from 'react';
// FIX: Use named import for react-router-dom v6.
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { ClipboardList, AlertTriangle, Sparkles, CheckCircle, Send, Copy, ArrowRight } from 'lucide-react';
import type { InterviewConfig, Assessment } from '../types';
import { generateAssessmentQuestions } from '../services/geminiService';
import Spinner from '../components/Spinner';

const RecruiterCreateAssessmentPage: React.FC = () => {
    const { createAssessment, user } = useAppContext();
    const navigate = useNavigate();

    const [jobRole, setJobRole] = useState('');
    const [interviewType, setInterviewType] = useState<InterviewConfig['type']>('Behavioral');
    const [difficulty, setDifficulty] = useState<InterviewConfig['difficulty']>('Medium');
    const [questions, setQuestions] = useState('');
    const [error, setError] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    // Success Invite Flow State
    const [createdAssessment, setCreatedAssessment] = useState<Assessment | null>(null);
    const [linkCopied, setLinkCopied] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const questionList = questions.split('\n').map(q => q.trim()).filter(Boolean);

        if (!jobRole.trim()) {
            setError('Job Role is required.');
            return;
        }
        if (questionList.length < 1) {
            setError('Please provide at least one interview question.');
            return;
        }

        try {
            const newAssessment = await createAssessment({
                jobRole,
                config: {
                    type: interviewType,
                    difficulty,
                    persona: 'Neutral' // Default persona
                },
                questions: questionList
            });
            setCreatedAssessment(newAssessment);
        } catch (err: any) {
            setError(err.message || 'An error occurred.');
        }
    };

    const handleGenerateQuestions = async () => {
        if (!jobRole.trim()) {
            setError('Please enter a Job Role before generating questions.');
            return;
        }
        setError('');
        setIsGenerating(true);
        try {
            const generatedQuestions = await generateAssessmentQuestions(jobRole, interviewType, difficulty);
            setQuestions(generatedQuestions.join('\n'));
        } catch (err) {
            setError('Failed to generate questions. The AI model might be busy. Please try again.');
            console.error(err);
        } finally {
            setIsGenerating(false);
        }
    };

    const generateAssessmentLink = (assessmentId: string): string => {
        const cleanOrigin = window.location.origin.replace(/^blob:/, '');
        return `${cleanOrigin}/#/assessment/${assessmentId}`;
    };

    const handleCopyLink = () => {
        if (!createdAssessment) return;
        const link = generateAssessmentLink(createdAssessment.id);
        navigator.clipboard.writeText(link);
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
    };

    const handleSendInvite = () => {
        if (!createdAssessment) return;
        const link = generateAssessmentLink(createdAssessment.id);
        const subject = `Invitation to Interview Assessment for ${createdAssessment.jobRole}`;
        const body = `Hello,\n\nPlease complete the AI-powered interview assessment for the ${createdAssessment.jobRole} position by clicking the link below:\n\n${link}\n\nBest regards,\n${user?.name || 'The Hiring Team'}`;
        window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    };

    const handleOpenGmail = () => {
        if (!createdAssessment) return;
        const link = generateAssessmentLink(createdAssessment.id);
        const subject = `Invitation to Interview Assessment for ${createdAssessment.jobRole}`;
        const body = `Hello,\n\nPlease complete the AI-powered interview assessment for the ${createdAssessment.jobRole} position by clicking the link below:\n\n${link}\n\nBest regards,\n${user?.name || 'The Hiring Team'}`;
        const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.open(gmailUrl, '_blank');
    };

    if (createdAssessment) {
        return (
            <div className="max-w-2xl mx-auto mt-10">
                <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle size={32} className="text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Assessment Created Successfully!</h2>
                    <p className="text-slate-600 mb-8">
                        Your assessment for <span className="font-semibold text-indigo-700">{createdAssessment.jobRole}</span> is ready.
                        Invite candidates now to start the process.
                    </p>

                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-8 max-w-lg mx-auto">
                        <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-2">Assessment Link</p>
                        <div className="flex items-center gap-2">
                            <code className="flex-1 bg-white p-2 rounded border border-slate-300 text-sm text-slate-600 truncate text-left">
                                {generateAssessmentLink(createdAssessment.id)}
                            </code>
                            <button
                                onClick={handleCopyLink}
                                className="p-2 bg-white border border-slate-300 rounded hover:bg-slate-50 transition text-slate-600"
                                title="Copy Link"
                            >
                                {linkCopied ? <CheckCircle size={18} className="text-green-600" /> : <Copy size={18} />}
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 justify-center max-w-sm mx-auto">
                        <button
                            onClick={handleSendInvite}
                            className="w-full px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition flex items-center justify-center shadow-md"
                        >
                            <Send size={18} className="mr-2" />
                            Open Default Email App
                        </button>
                        <button
                            onClick={handleOpenGmail}
                            className="w-full px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition flex items-center justify-center shadow-md"
                        >
                            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" />
                            </svg>
                            Open in Gmail
                        </button>
                        <button
                            onClick={() => navigate('/recruiter/dashboard')}
                            className="w-full px-6 py-3 bg-white text-slate-700 font-semibold rounded-lg border border-slate-300 hover:bg-slate-50 transition flex items-center justify-center"
                        >
                            Go to Dashboard <ArrowRight size={18} className="ml-2" />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-slate-900">Create New Assessment</h1>
                <p className="text-slate-600 mt-1">Design a tailored interview assessment for your candidates.</p>
            </div>
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 space-y-6">
                <div>
                    <label htmlFor="jobRole" className="block text-sm font-medium text-slate-700 mb-1">Job Role</label>
                    <input
                        id="jobRole"
                        type="text"
                        value={jobRole}
                        onChange={(e) => setJobRole(e.target.value)}
                        placeholder="e.g., Senior Software Engineer"
                        className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        required
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="interviewType" className="block text-sm font-medium text-slate-700 mb-1">Interview Type</label>
                        <select
                            id="interviewType"
                            value={interviewType}
                            onChange={e => setInterviewType(e.target.value as any)}
                            className="w-full p-2 border border-slate-300 rounded-md"
                        >
                            <option>Behavioral</option>
                            <option>Technical</option>
                            <option>Role-Specific</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="difficulty" className="block text-sm font-medium text-slate-700 mb-1">Difficulty Level</label>
                        <select
                            id="difficulty"
                            value={difficulty}
                            onChange={e => setDifficulty(e.target.value as any)}
                            className="w-full p-2 border border-slate-300 rounded-md"
                        >
                            <option>Easy</option>
                            <option>Medium</option>
                            <option>Hard</option>
                        </select>
                    </div>
                </div>

                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label htmlFor="questions" className="block text-sm font-medium text-slate-700">Interview Questions</label>
                        <button
                            type="button"
                            onClick={handleGenerateQuestions}
                            disabled={isGenerating || !jobRole.trim()}
                            className="px-3 py-1 bg-indigo-100 text-indigo-700 font-semibold rounded-md hover:bg-indigo-200 disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed transition text-sm flex items-center"
                        >
                            {isGenerating ? (
                                <>
                                    <Spinner size="h-4 w-4" />
                                    <span className="ml-2">Generating...</span>
                                </>
                            ) : (
                                <>
                                    <Sparkles size={14} className="mr-2" /> Generate with AI
                                </>
                            )}
                        </button>
                    </div>
                    <textarea
                        id="questions"
                        value={questions}
                        onChange={(e) => setQuestions(e.target.value)}
                        placeholder="Enter one question per line, or generate them with AI after entering a job role."
                        className="w-full h-48 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                        required
                    />
                    <p className="text-xs text-slate-500 mt-1">Each line will be treated as a separate question. You can edit the generated questions.</p>
                </div>


                {error && (
                    <div className="flex items-center text-sm text-red-600 bg-red-50 p-3 rounded-md">
                        <AlertTriangle size={16} className="mr-2" />
                        {error}
                    </div>
                )}

                <div className="flex justify-end pt-4 border-t border-slate-200">
                    <button
                        type="submit"
                        className="px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition flex items-center shadow-sm"
                    >
                        <ClipboardList size={18} className="mr-2" />
                        Create Assessment
                    </button>
                </div>

            </form>
        </div>
    );
};


export default RecruiterCreateAssessmentPage;