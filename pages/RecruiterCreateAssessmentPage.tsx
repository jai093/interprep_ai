

import React, { useState } from 'react';
// FIX: Use named import for react-router-dom v6.
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { ClipboardList, AlertTriangle, Sparkles } from 'lucide-react';
import type { InterviewConfig } from '../types';
import { generateAssessmentQuestions } from '../services/geminiService';
import Spinner from '../components/Spinner';

const RecruiterCreateAssessmentPage: React.FC = () => {
    const { createAssessment } = useAppContext();
    const navigate = useNavigate();

    const [jobRole, setJobRole] = useState('');
    const [interviewType, setInterviewType] = useState<InterviewConfig['type']>('Behavioral');
    const [difficulty, setDifficulty] = useState<InterviewConfig['difficulty']>('Medium');
    const [questions, setQuestions] = useState('');
    const [error, setError] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
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
            createAssessment({
                jobRole,
                config: {
                    type: interviewType,
                    difficulty,
                    persona: 'Neutral' // Default persona
                },
                questions: questionList
            });
            navigate('/recruiter/dashboard');
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