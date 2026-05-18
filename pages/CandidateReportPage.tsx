
import React from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import InterviewReport from '../components/InterviewReport';
import { ChevronLeft } from 'lucide-react';

const CandidateReportPage: React.FC = () => {
    const { index } = useParams();
    const { interviewHistory } = useAppContext();

    const sessionIndex = index ? parseInt(index, 10) : -1;
    const session = interviewHistory[sessionIndex];

    if (!session) {
        return <Navigate to="/candidate/dashboard" replace />;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center">
                <Link to="/candidate/dashboard" className="mr-4 p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition">
                    <ChevronLeft size={24} />
                </Link>
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Interview Report</h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">{session.type} - {new Date(session.date).toLocaleDateString()}</p>
                </div>
            </div>

            <InterviewReport
                session={session}
                showChat={true}
                backPath="/candidate/dashboard"
            />
        </div>
    );
};

export default CandidateReportPage;
