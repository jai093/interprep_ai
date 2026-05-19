import React, { useState } from 'react';
// FIX: Use named imports for react-router-dom v6.
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { PlusCircle, Clipboard, Users, Copy, Award, FileText, Send, Trash2 } from 'lucide-react';

const RecruiterDashboardPage: React.FC = () => {
    const { user, assessments, assessmentResults, deleteAssessment, updateAssessmentResultStatus } = useAppContext();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'shortlisted' | 'submissions' | 'assessments'>('shortlisted');
    const [linkCopied, setLinkCopied] = useState<string | null>(null);

    // Rejection Modal State
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');

    const recruiterAssessments = assessments.filter(a => a.createdBy === user?.email || a.createdBy === 'recruiter@test.com');
    const recruiterSubmissions = assessmentResults.filter(result =>
        recruiterAssessments.some(a => a.id === result.assessmentId)
    );

    const SHORTLIST_THRESHOLD = 85;
    // Shortlist tab now includes those explicitly shortlisted OR high scorers who are pending
    const shortlistedCandidates = recruiterSubmissions.filter(
        result => result.status === 'Shortlisted' || (result.status !== 'Rejected' && result.session.averageScore >= SHORTLIST_THRESHOLD)
    );

    const getAssessmentTitle = (assessmentId: string) => {
        return assessments.find(a => a.id === assessmentId)?.jobRole || 'Unknown Assessment';
    }

    const generateAssessmentLink = (assessmentId: string): string => {
        const baseUrl = import.meta.env.VITE_FRONTEND_URL || window.location.origin.replace(/^blob:/, '');
        const assessment = assessments.find(a => a.id === assessmentId);
        if (assessment) {
            try {
                const payload = {
                    id: assessment.id,
                    jobRole: assessment.jobRole,
                    questions: assessment.questions,
                    config: assessment.config
                };
                const qJson = JSON.stringify(payload);
                const qBase64 = btoa(unescape(encodeURIComponent(qJson)));
                return `${baseUrl}/#/assessment/${assessmentId}?q=${encodeURIComponent(qBase64)}`;
            } catch (e) {
                console.error("Failed to encode assessment questions in link:", e);
            }
        }
        return `${baseUrl}/#/assessment/${assessmentId}`;
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
        const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.open(gmailUrl, '_blank');
    };

    const handleDeleteAssessment = (assessmentId: string) => {
        if (window.confirm('Are you sure you want to delete this assessment? This will also remove all candidate submissions for it.')) {
            deleteAssessment(assessmentId);
        }
    };

    const handleShortlist = (id: string, name: string) => {
        updateAssessmentResultStatus(id, 'Shortlisted');
        alert(`Candidate ${name} has been Shortlisted. Email sent.`);
    };

    const handleHold = (id: string) => {
        updateAssessmentResultStatus(id, 'Hold');
        alert('Candidate put on Hold.');
    };

    const openRejectModal = (id: string) => {
        setSelectedCandidateId(id);
        setIsRejectModalOpen(true);
        setRejectionReason('');
    };

    const confirmReject = () => {
        if (selectedCandidateId) {
            updateAssessmentResultStatus(selectedCandidateId, 'Rejected', rejectionReason);
            alert('Candidate Rejected. Email sent with rejection reason.');
            setIsRejectModalOpen(false);
            setSelectedCandidateId(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">HR Dashboard</h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">Manage interview assessments and candidates.</p>
                </div>
                <button
                    onClick={() => navigate('/recruiter/assessments/new')}
                    className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition flex items-center justify-center shadow-sm">
                    <PlusCircle size={18} className="mr-2" />
                    Create New Assessment
                </button>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="border-b border-slate-200 dark:border-slate-700 mb-4">
                    <nav className="-mb-px flex space-x-2 sm:space-x-6 overflow-x-auto">
                        <button onClick={() => setActiveTab('shortlisted')} className={`py-2 px-1 border-b-2 font-semibold text-sm flex items-center whitespace-nowrap ${activeTab === 'shortlisted' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>
                            <Award size={16} className="mr-2" /> Shortlisted
                        </button>
                        <button onClick={() => setActiveTab('submissions')} className={`py-2 px-1 border-b-2 font-semibold text-sm flex items-center whitespace-nowrap ${activeTab === 'submissions' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>
                            <Users size={16} className="mr-2" /> All Submissions
                        </button>
                        <button onClick={() => setActiveTab('assessments')} className={`py-2 px-1 border-b-2 font-semibold text-sm flex items-center whitespace-nowrap ${activeTab === 'assessments' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>
                            <Clipboard size={16} className="mr-2" /> My Assessments
                        </button>
                    </nav>
                </div>

                {activeTab === 'shortlisted' && (
                    <div className="overflow-x-auto">
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{shortlistedCandidates.length} candidate(s) found</p>
                        <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
                            <thead className="text-xs text-slate-700 dark:text-slate-200 uppercase bg-slate-50 dark:bg-slate-900/50">
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
                                        <tr key={result.id} className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                            <th scope="row" className="px-6 py-4 font-medium text-slate-900 dark:text-white whitespace-nowrap">{result.candidateName}</th>
                                            <td className="px-6 py-4">{result.candidateEmail}</td>
                                            <td className="px-6 py-4 font-semibold text-green-600 dark:text-green-400">{result.session.averageScore}%</td>
                                            <td className="px-6 py-4">
                                                <button onClick={() => navigate(`/recruiter/report/${result.id}`)} className="flex items-center text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
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
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{recruiterSubmissions.length} submission(s) found</p>
                        <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
                            <thead className="text-xs text-slate-700 dark:text-slate-200 uppercase bg-slate-50 dark:bg-slate-900/50">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Candidate Name</th>
                                    <th scope="col" className="px-6 py-3">Assessment</th>
                                    <th scope="col" className="px-6 py-3">Score</th>
                                    <th scope="col" className="px-6 py-3">Status</th>
                                    <th scope="col" className="px-6 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recruiterSubmissions.length > 0 ? (
                                    recruiterSubmissions.map(result => (
                                        <tr key={result.id} className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                            <th scope="row" className="px-6 py-4 font-medium text-slate-900 dark:text-white whitespace-nowrap">{result.candidateName}</th>
                                            <td className="px-6 py-4">{getAssessmentTitle(result.assessmentId)}</td>
                                            <td className="px-6 py-4 font-semibold text-indigo-600 dark:text-indigo-400">{result.session.averageScore}%</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded text-xs font-semibold 
                                                ${result.status === 'Shortlisted' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                                                        result.status === 'Rejected' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' :
                                                            result.status === 'Hold' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' :
                                                                'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-300'}`}>
                                                    {result.status || 'Pending'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 flex flex-wrap gap-2 items-center">
                                                <button onClick={() => navigate(`/recruiter/report/${result.id}`)} className="text-indigo-600 dark:text-indigo-400 hover:underline text-sm font-medium border-r border-slate-300 dark:border-slate-700 pr-2">View</button>
                                                <button onClick={() => handleShortlist(result.id, result.candidateName)} className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 text-sm font-medium border-r border-slate-300 dark:border-slate-700 pr-2">Shortlist</button>
                                                <button onClick={() => handleHold(result.id)} className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-300 text-sm font-medium border-r border-slate-300 dark:border-slate-700 pr-2">Hold</button>
                                                <button onClick={() => openRejectModal(result.id)} className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm font-medium">Reject</button>
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
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{recruiterAssessments.length} assessment(s) found</p>
                        <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
                            <thead className="text-xs text-slate-700 dark:text-slate-200 uppercase bg-slate-50 dark:bg-slate-900/50">
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
                                        <tr key={assessment.id} className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                            <th scope="row" className="px-6 py-4 font-medium text-slate-900 dark:text-white">{assessment.jobRole}</th>
                                            <td className="px-6 py-4">{new Date(assessment.createdAt).toLocaleDateString()}</td>
                                            <td className="px-6 py-4">{assessment.questions.length}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                                                    <button onClick={() => copyLink(assessment.id)} className="flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-semibold text-xs">
                                                        <Copy size={12} className="mr-1" />
                                                        {linkCopied === assessment.id ? 'Copied!' : 'Copy Link'}
                                                    </button>
                                                    <button onClick={() => sendInvite(assessment.id, assessment.jobRole)} className="flex items-center text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-semibold text-xs">
                                                        <Send size={12} className="mr-1" />
                                                        Send Invite
                                                    </button>
                                                    <button onClick={() => handleDeleteAssessment(assessment.id)} className="flex items-center text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-semibold text-xs">
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

            {/* Rejection Modal */}
            {isRejectModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md p-6 border border-transparent dark:border-slate-700 animate-fade-in text-left">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Reject Candidate</h3>
                        <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">Please provide a reason for rejection. This will be sent to the candidate via email.</p>

                        <textarea
                            className="w-full p-3 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none min-h-[100px] placeholder-slate-400 dark:placeholder-slate-500"
                            placeholder="Enter rejection reason..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                        />

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setIsRejectModalOpen(false)}
                                className="px-4 py-2 text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmReject}
                                disabled={!rejectionReason.trim()}
                                className="px-4 py-2 bg-red-600 text-white font-medium rounded-md hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Confirm Rejection
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RecruiterDashboardPage;