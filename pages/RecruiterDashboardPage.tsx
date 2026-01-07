import React, { useState } from 'react';
// FIX: Use named imports for react-router-dom v6.
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { PlusCircle, Clipboard, Users, Copy, Award, FileText, Send, Trash2 } from 'lucide-react';

const RecruiterDashboardPage: React.FC = () => {
    const { user, assessments, assessmentResults, deleteAssessment } = useAppContext();
    // FIX: Use named import for useNavigate.
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'shortlisted' | 'submissions' | 'assessments'>('shortlisted');
    const [linkCopied, setLinkCopied] = useState<string | null>(null);

    const recruiterAssessments = assessments.filter(a => a.createdBy === user?.email);
    const recruiterSubmissions = assessmentResults.filter(result => 
        recruiterAssessments.some(a => a.id === result.assessmentId)
    );
    
    const SHORTLIST_THRESHOLD = 85;
    const shortlistedCandidates = recruiterSubmissions.filter(
        result => result.session.averageScore >= SHORTLIST_THRESHOLD
    );

    const getAssessmentTitle = (assessmentId: string) => {
        return assessments.find(a => a.id === assessmentId)?.jobRole || 'Unknown Assessment';
    }
    
    const generateAssessmentLink = (assessmentId: string): string => {
        // This logic handles potential 'blob:' URLs in sandboxed environments.
        // It constructs a clean, shareable link by using the origin and removing
        // the 'blob:' protocol prefix if it exists.
        const cleanOrigin = window.location.origin.replace(/^blob:/, '');

        // Since the app uses HashRouter, the path is appended after a '#/'.
        // We construct the full URL manually to ensure it's correct.
        return `${cleanOrigin}/#/assessment/${assessmentId}`;
    };

    const copyLink = (assessmentId: string) => {
        const link = generateAssessmentLink(assessmentId);
        navigator.clipboard.writeText(link);
        setLinkCopied(assessmentId);
        setTimeout(() => setLinkCopied(null), 2000);
    };

    const sendInvite = (assessmentId: string, jobRole: string) => {
        const link = generateAssessmentLink(assessmentId);
        const subject = `Invitation to Interview Assessment for ${jobRole}`;
        const body = `Hello,\n\nPlease complete the AI-powered interview assessment for the ${jobRole} position by clicking the link below:\n\n${link}\n\nBest regards,\n${user?.name || 'The Hiring Team'}`;
        window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    };

    const handleDeleteAssessment = (assessmentId: string) => {
        if (window.confirm('Are you sure you want to delete this assessment? This will also remove all candidate submissions for it.')) {
            deleteAssessment(assessmentId);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">HR Dashboard</h1>
                    <p className="text-slate-600 mt-1">Manage interview assessments and candidates.</p>
                </div>
                <button 
                    onClick={() => navigate('/recruiter/assessments/new')}
                    className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition flex items-center justify-center shadow-sm">
                    <PlusCircle size={18} className="mr-2" />
                    Create New Assessment
                </button>
            </div>
            
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="border-b border-slate-200 mb-4">
                    <nav className="-mb-px flex space-x-2 sm:space-x-6 overflow-x-auto">
                         <button onClick={() => setActiveTab('shortlisted')} className={`py-2 px-1 border-b-2 font-semibold text-sm flex items-center whitespace-nowrap ${activeTab === 'shortlisted' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                           <Award size={16} className="mr-2" /> Shortlisted
                        </button>
                        <button onClick={() => setActiveTab('submissions')} className={`py-2 px-1 border-b-2 font-semibold text-sm flex items-center whitespace-nowrap ${activeTab === 'submissions' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                           <Users size={16} className="mr-2" /> All Submissions
                        </button>
                        <button onClick={() => setActiveTab('assessments')} className={`py-2 px-1 border-b-2 font-semibold text-sm flex items-center whitespace-nowrap ${activeTab === 'assessments' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                           <Clipboard size={16} className="mr-2" /> My Assessments
                        </button>
                    </nav>
                </div>

                {activeTab === 'shortlisted' && (
                     <div className="overflow-x-auto">
                        <p className="text-sm text-slate-500 mb-4">{shortlistedCandidates.length} candidate(s) found</p>
                        <table className="w-full text-sm text-left text-slate-500">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Name</th>
                                    <th scope="col" className="px-6 py-3">Email</th>
                                    <th scope="col" className="px-6 py-3">Score</th>
                                    <th scope="col" className="px-6 py-3">Report</th>
                                </tr>
                            </thead>
                            <tbody>
                                {shortlistedCandidates.length > 0 ? (
                                    shortlistedCandidates.map(result => (
                                        <tr key={result.id} className="bg-white border-b hover:bg-slate-50">
                                            <th scope="row" className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">{result.candidateName}</th>
                                            <td className="px-6 py-4">{result.candidateEmail}</td>
                                            <td className="px-6 py-4 font-semibold text-green-600">{result.session.averageScore}%</td>
                                            <td className="px-6 py-4">
                                                <button onClick={() => navigate(`/recruiter/report/${result.id}`)} className="flex items-center text-sm font-medium text-indigo-600 hover:underline">
                                                    <FileText size={14} className="mr-1" /> View Report
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-slate-500">No candidates have met the shortlisting criteria yet.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'submissions' && (
                     <div className="overflow-x-auto">
                        <p className="text-sm text-slate-500 mb-4">{recruiterSubmissions.length} submission(s) found</p>
                        <table className="w-full text-sm text-left text-slate-500">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Candidate Name</th>
                                    <th scope="col" className="px-6 py-3">Assessment</th>
                                    <th scope="col" className="px-6 py-3">Score</th>
                                    <th scope="col" className="px-6 py-3">Date Completed</th>
                                    <th scope="col" className="px-6 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recruiterSubmissions.length > 0 ? (
                                    recruiterSubmissions.map(result => (
                                        <tr key={result.id} className="bg-white border-b hover:bg-slate-50">
                                            <th scope="row" className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">{result.candidateName}</th>
                                            <td className="px-6 py-4">{getAssessmentTitle(result.assessmentId)}</td>
                                            <td className="px-6 py-4 font-semibold text-indigo-600">{result.session.averageScore}%</td>
                                            <td className="px-6 py-4">{new Date(result.completedAt).toLocaleDateString()}</td>
                                            <td className="px-6 py-4">
                                                <button onClick={() => navigate(`/recruiter/report/${result.id}`)} className="font-medium text-indigo-600 hover:underline">View Report</button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-slate-500">No candidates have completed an assessment yet.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
                
                 {activeTab === 'assessments' && (
                    <div className="overflow-x-auto">
                        <p className="text-sm text-slate-500 mb-4">{recruiterAssessments.length} assessment(s) found</p>
                        <table className="w-full text-sm text-left text-slate-500">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Job Role</th>
                                    <th scope="col" className="px-6 py-3">Date Created</th>
                                    <th scope="col" className="px-6 py-3">Questions</th>
                                    <th scope="col" className="px-6 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recruiterAssessments.length > 0 ? (
                                    recruiterAssessments.map(assessment => (
                                        <tr key={assessment.id} className="bg-white border-b hover:bg-slate-50">
                                            <th scope="row" className="px-6 py-4 font-medium text-slate-900">{assessment.jobRole}</th>
                                            <td className="px-6 py-4">{new Date(assessment.createdAt).toLocaleDateString()}</td>
                                            <td className="px-6 py-4">{assessment.questions.length}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                                                    <button onClick={() => copyLink(assessment.id)} className="flex items-center text-indigo-600 hover:text-indigo-800 font-semibold text-xs">
                                                        <Copy size={12} className="mr-1" />
                                                        {linkCopied === assessment.id ? 'Copied!' : 'Copy Link'}
                                                    </button>
                                                    <button onClick={() => sendInvite(assessment.id, assessment.jobRole)} className="flex items-center text-slate-600 hover:text-slate-800 font-semibold text-xs">
                                                        <Send size={12} className="mr-1" />
                                                        Send Invite
                                                    </button>
                                                    <button onClick={() => handleDeleteAssessment(assessment.id)} className="flex items-center text-red-600 hover:text-red-800 font-semibold text-xs">
                                                        <Trash2 size={12} className="mr-1" />
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-slate-500">You haven't created any assessments yet.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RecruiterDashboardPage;