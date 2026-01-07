
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Save } from 'lucide-react';
import Spinner from '../components/Spinner';
import type { RecruiterProfile } from '../types';

const RecruiterProfilePage: React.FC = () => {
    const { user, recruiterProfile, updateRecruiterProfile, assessments, assessmentResults } = useAppContext();
    const [profile, setProfile] = useState<RecruiterProfile | null>(recruiterProfile);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    useEffect(() => {
        setProfile(recruiterProfile);
    }, [recruiterProfile]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setProfile(prev => prev ? { ...prev, [name]: value } : null);
    };

    const handleSaveChanges = (e: React.FormEvent) => {
        e.preventDefault();
        if (profile) {
            setIsSaving(true);
            setSaveSuccess(false);
            // Simulate API call
            setTimeout(() => {
                updateRecruiterProfile(profile);
                setIsSaving(false);
                setSaveSuccess(true);
                setTimeout(() => setSaveSuccess(false), 2000);
            }, 1000);
        }
    };
    
    if (!profile) {
        return <div className="flex justify-center items-center h-full"><Spinner/></div>
    }

    // Calculate recruiter-specific assessments and submissions to display accurate stats.
    const recruiterAssessments = assessments.filter(a => a.createdBy === user?.email);
    const recruiterSubmissions = assessmentResults.filter(result => 
        recruiterAssessments.some(a => a.id === result.assessmentId)
    );

    const SHORTLIST_THRESHOLD = 85;

    const stats = {
        totalAssessments: recruiterAssessments.length,
        activeInvites: 0, // Placeholder
        completedInterviews: recruiterSubmissions.length,
        shortlisted: recruiterSubmissions.filter(s => s.session.averageScore >= SHORTLIST_THRESHOLD).length,
    };

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">HR Profile</h1>
                <p className="text-slate-600 mt-1">Manage your professional information and view account statistics.</p>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-slate-200">
                <h2 className="text-xl font-semibold mb-6">Account Statistics</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                        <p className="text-3xl font-bold text-indigo-600">{stats.totalAssessments}</p>
                        <p className="text-sm text-slate-500">Total Assessments</p>
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-indigo-600">{stats.activeInvites}</p>
                        <p className="text-sm text-slate-500">Active Invites</p>
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-indigo-600">{stats.completedInterviews}</p>
                        <p className="text-sm text-slate-500">Completed Interviews</p>
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-indigo-600">{stats.shortlisted}</p>
                        <p className="text-sm text-slate-500">Shortlisted</p>
                    </div>
                </div>
            </div>
            
            <form onSubmit={handleSaveChanges} className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-slate-200 space-y-6">
                 <h2 className="text-xl font-semibold">Profile Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="fullName" className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                        <input type="text" id="fullName" name="fullName" value={profile.fullName} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                        <input type="email" id="email" name="email" value={profile.email} disabled className="w-full px-3 py-2 border border-slate-200 bg-slate-50 text-slate-500 rounded-md shadow-sm" />
                    </div>
                </div>
                
                 <div>
                    <label htmlFor="company" className="block text-sm font-medium text-slate-700 mb-1">Company</label>
                    <input type="text" id="company" name="company" value={profile.company} onChange={handleChange} placeholder="Your Company Name" className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                </div>

                <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-200">
                    {saveSuccess && <p className="text-green-600 text-sm animate-fade-in">Profile saved successfully!</p>}
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300 transition flex items-center"
                    >
                        {isSaving ? <><Spinner size="h-5 w-5" /> <span className="ml-2">Saving...</span></> : <><Save size={16} className="mr-2"/> Save Changes</>}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default RecruiterProfilePage;
