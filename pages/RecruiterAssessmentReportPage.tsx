

import React from 'react';
// FIX: Use named imports for react-router-dom v6.
import { useParams, Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { PageSpinner } from '../components/Spinner';
import InterviewReport from '../components/InterviewReport';
import { AlertTriangle } from 'lucide-react';

const RecruiterAssessmentReportPage: React.FC = () => {
    const { resultId } = useParams();
    const { assessmentResults, assessments, isLoading } = useAppContext();

    if (isLoading) {
        return <PageSpinner message="Loading report..." />;
    }

    const result = assessmentResults.find(r => r.id === resultId);
    
    if (!result) {
        return (
            <div className="text-center p-8">
                <AlertTriangle className="mx-auto h-12 w-12 text-red-400" />
                <h3 className="mt-2 text-lg font-medium text-slate-900">Report not found</h3>
                <p className="mt-1 text-sm text-slate-500">The assessment result you are looking for does not exist or could not be loaded.</p>
                <div className="mt-6">
                    <Link to="/recruiter/dashboard" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">
                        Go back to dashboard
                    </Link>
                </div>
            </div>
        );
    }

    const assessment = assessments.find(a => a.id === result.assessmentId);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Assessment Report for {result.candidateName}</h1>
                    <p className="text-slate-600 mt-1">Role: {assessment?.jobRole || 'N/A'} | Submitted: {new Date(result.completedAt).toLocaleDateString()}</p>
                </div>
            </div>
            <InterviewReport 
                session={result.session} 
                showChat={false} 
                backPath="/recruiter/dashboard"
                backButtonText="Back to Assessments"
            />
        </div>
    );
}

export default RecruiterAssessmentReportPage;