
import React from 'react';
import { CheckCircle } from 'lucide-react';

const AssessmentCompletePage: React.FC = () => {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-gray-900 flex flex-col justify-center items-center p-4 text-center">
            <div className="w-full max-w-lg bg-white dark:bg-gray-800 p-10 rounded-xl shadow-lg border border-slate-200 dark:border-gray-700 space-y-4">
                <CheckCircle size={64} className="mx-auto text-green-500 dark:text-green-400" />
                <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Assessment Complete</h1>
                <p className="text-slate-600 dark:text-slate-300">
                    Thank you for taking the time to complete the assessment. Your responses have been submitted successfully.
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 pt-4">You may now close this window.</p>
            </div>
        </div>
    );
};

export default AssessmentCompletePage;