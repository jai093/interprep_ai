
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Save, Bell, Sliders, Info, Download, Trash2, User } from 'lucide-react';
import { PageSpinner } from '../components/Spinner';
import type { RecruiterProfile, RecruiterSettings } from '../types';


const SettingsCard: React.FC<{ title: string, icon: React.ReactNode, children: React.ReactNode, footer?: React.ReactNode }> = ({ title, icon, children, footer }) => (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-lg sm:text-xl font-semibold flex items-center text-slate-900 dark:text-white">
                {icon}
                <span className="ml-3">{title}</span>
            </h2>
        </div>
        <div className="p-4 sm:p-6 space-y-4 text-slate-700 dark:text-slate-300">
            {children}
        </div>
        {footer && (
             <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 flex justify-end items-center">
                {footer}
            </div>
        )}
    </div>
);

const ToggleSwitch: React.FC<{ checked: boolean, onChange: (checked: boolean) => void }> = ({ checked, onChange }) => {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            className={`${checked ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'} relative inline-flex items-center h-6 rounded-full w-11 transition-colors flex-shrink-0`}
        >
            <span className={`${checked ? 'translate-x-6' : 'translate-x-1'} inline-block w-4 h-4 transform bg-white dark:bg-slate-200 rounded-full transition-transform`} />
        </button>
    );
};


const RecruiterSettingsPage: React.FC = () => {
    const { 
        user,
        recruiterProfile, 
        updateRecruiterProfile, 
        recruiterSettings, 
        updateRecruiterSettings, 
        deleteCurrentUserAccount,
        assessments,
        assessmentResults
    } = useAppContext();

    const [profile, setProfile] = useState<RecruiterProfile | null>(null);
    const [settings, setSettings] = useState<RecruiterSettings | null>(null);
    
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [isSavingNotifications, setIsSavingNotifications] = useState(false);
    const [isSavingAssessment, setIsSavingAssessment] = useState(false);
    
    const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);
    const [notificationSaveSuccess, setNotificationSaveSuccess] = useState(false);
    const [assessmentSaveSuccess, setAssessmentSaveSuccess] = useState(false);


    useEffect(() => {
        setProfile(recruiterProfile);
        setSettings(recruiterSettings);
    }, [recruiterProfile, recruiterSettings]);

    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setProfile(prev => prev ? { ...prev, [name]: value } : null);
    };

    const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setSettings(prev => prev ? { ...prev, [name]: type === 'number' ? parseInt(value) : value } : null);
    };

     const handleToggleChange = (field: keyof RecruiterSettings) => {
        setSettings(prev => prev ? { ...prev, [field]: !prev[field] } : null);
    };

    const handleSaveProfile = (e: React.FormEvent) => {
        e.preventDefault();
        if (profile) {
            setIsSavingProfile(true);
            setTimeout(() => {
                updateRecruiterProfile(profile);
                setIsSavingProfile(false);
                setProfileSaveSuccess(true);
                setTimeout(() => setProfileSaveSuccess(false), 2000);
            }, 1000);
        }
    };
    
    const handleSaveNotifications = (e: React.FormEvent) => {
        e.preventDefault();
        if(settings) {
            setIsSavingNotifications(true);
            setTimeout(() => {
                updateRecruiterSettings(settings);
                setIsSavingNotifications(false);
                setNotificationSaveSuccess(true);
                setTimeout(() => setNotificationSaveSuccess(false), 2000);
            }, 1000);
        }
    }
    
    const handleSaveAssessment = (e: React.FormEvent) => {
        e.preventDefault();
        if(settings) {
            setIsSavingAssessment(true);
            setTimeout(() => {
                updateRecruiterSettings(settings);
                setIsSavingAssessment(false);
                setAssessmentSaveSuccess(true);
                setTimeout(() => setAssessmentSaveSuccess(false), 2000);
            }, 1000);
        }
    }

    const handleExportData = () => {
        // Calculate recruiter-specific submissions to provide accurate data for export.
        const recruiterAssessments = assessments.filter(a => a.createdBy === user?.email);
        const recruiterSubmissions = assessmentResults.filter(result => 
            recruiterAssessments.some(a => a.id === result.assessmentId)
        );

        const dataToExport = {
            profile: recruiterProfile,
            settings: recruiterSettings,
            assessmentSubmissions: recruiterSubmissions
        };
        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
            JSON.stringify(dataToExport, null, 2)
        )}`;
        const link = document.createElement("a");
        link.href = jsonString;
        link.download = "InterPrepAI_Recruiter_Data.json";
        link.click();
    };

    const handleDeleteAccount = () => {
        if (window.confirm("Are you sure you want to delete your account? This action is irreversible and will remove all your data.")) {
            deleteCurrentUserAccount();
        }
    };
    
    if (!profile || !settings) {
        return <PageSpinner message="Loading settings..." />;
    }

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
             <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Settings</h1>
                <p className="text-slate-600 dark:text-slate-400 mt-1">Manage your HR profile and platform preferences.</p>
            </div>

            <form onSubmit={handleSaveProfile}>
                <SettingsCard 
                    title="Profile Information"
                    icon={<User size={20} className="text-indigo-500" />}
                    footer={
                         <div className="flex items-center gap-4">
                            {profileSaveSuccess && <p className="text-green-600 dark:text-green-400 text-sm">Saved!</p>}
                            <button type="submit" disabled={isSavingProfile} className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300 dark:disabled:bg-slate-700 transition text-sm flex items-center">
                                <Save size={14} className="mr-2"/>{isSavingProfile ? 'Saving...' : 'Save Profile'}
                            </button>
                        </div>
                    }
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                         <div>
                            <label htmlFor="fullName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                            <input type="text" id="fullName" name="fullName" value={profile.fullName} onChange={handleProfileChange} className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-200 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Enter your full name" />
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                            <input type="email" id="email" name="email" value={profile.email} disabled className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 rounded-md" />
                        </div>
                    </div>
                    <div className="text-left">
                        <label htmlFor="company" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Company</label>
                        <input type="text" id="company" name="company" value={profile.company} onChange={handleProfileChange} className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-200 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Enter your company name" />
                    </div>
                </SettingsCard>
            </form>
            
            <form onSubmit={handleSaveNotifications}>
                 <SettingsCard 
                    title="Notification Preferences"
                    icon={<Bell size={20} className="text-indigo-500" />}
                    footer={
                        <div className="flex items-center gap-4">
                            {notificationSaveSuccess && <p className="text-green-600 dark:text-green-400 text-sm">Saved!</p>}
                            <button type="submit" disabled={isSavingNotifications} className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300 dark:disabled:bg-slate-700 transition text-sm flex items-center">
                                <Save size={14} className="mr-2"/>{isSavingNotifications ? 'Saving...' : 'Save Preferences'}
                            </button>
                        </div>
                    }
                 >
                    <div className="flex justify-between items-center gap-4">
                        <div className='flex-1 text-left'>
                            <p className="font-medium text-slate-800 dark:text-slate-200">Email Notifications</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Receive notifications via email.</p>
                        </div>
                        <ToggleSwitch checked={settings.emailNotifications} onChange={() => handleToggleChange('emailNotifications')} />
                    </div>
                    <div className="flex justify-between items-center gap-4">
                        <div className='flex-1 text-left'>
                            <p className="font-medium text-slate-800 dark:text-slate-200">Assessment Reminders</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Get reminders for pending assessments.</p>
                        </div>
                         <ToggleSwitch checked={settings.assessmentReminders} onChange={() => handleToggleChange('assessmentReminders')} />
                    </div>
                    <div className="flex justify-between items-center gap-4">
                        <div className='flex-1 text-left'>
                            <p className="font-medium text-slate-800 dark:text-slate-200">Weekly Reports</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Receive weekly hiring analytics.</p>
                        </div>
                         <ToggleSwitch checked={settings.weeklyReports} onChange={() => handleToggleChange('weeklyReports')} />
                    </div>
                </SettingsCard>
            </form>

            <form onSubmit={handleSaveAssessment}>
                 <SettingsCard 
                    title="Assessment Settings"
                    icon={<Sliders size={20} className="text-indigo-500" />}
                    footer={
                        <div className="flex items-center gap-4">
                            {assessmentSaveSuccess && <p className="text-green-600 dark:text-green-400 text-sm">Saved!</p>}
                            <button type="submit" disabled={isSavingAssessment} className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300 dark:disabled:bg-slate-700 transition text-sm flex items-center">
                                <Save size={14} className="mr-2"/>{isSavingAssessment ? 'Saving...' : 'Save Settings'}
                            </button>
                        </div>
                    }
                 >
                     <div className="flex justify-between items-center gap-4">
                        <div className='flex-1 text-left'>
                            <p className="font-medium text-slate-800 dark:text-slate-200">Auto-reject Failed Assessments</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Automatically reject candidates who score below threshold.</p>
                        </div>
                         <ToggleSwitch checked={settings.autoReject} onChange={() => handleToggleChange('autoReject')} />
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                        <div>
                            <label htmlFor="passingScore" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Minimum Passing Score (%)</label>
                            <input type="number" id="passingScore" name="passingScore" value={settings.passingScore} onChange={handleSettingsChange} className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-200 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" min="0" max="100" />
                        </div>
                        <div>
                            <label htmlFor="timeLimit" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Default Assessment Time Limit (minutes)</label>
                            <input type="number" id="timeLimit" name="timeLimit" value={settings.timeLimit} onChange={handleSettingsChange} className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-200 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" min="1" />
                        </div>
                    </div>
                </SettingsCard>
            </form>

             <SettingsCard title="Account Information" icon={<Info size={20} className="text-indigo-500" />}>
                <div className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg space-y-2 border border-transparent dark:border-slate-700 text-left">
                    <p><strong className="text-slate-800 dark:text-slate-200">Account Created:</strong> <span>{new Date().toLocaleDateString()}</span> (Static Example)</p>
                    <p><strong className="text-slate-800 dark:text-slate-200">User ID:</strong> <span className="font-mono text-xs">{(profile?.email ? profile.email.split('@')[0] : 'unknown')}-xxxx-xxxx</span> (Static Example)</p>
                    <p><strong className="text-slate-800 dark:text-slate-200">Plan:</strong> <span className="font-semibold text-indigo-700 dark:text-indigo-400">Professional</span></p>
                </div>
                <div className="flex flex-wrap gap-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                    <button type="button" onClick={handleExportData} className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition text-sm flex items-center shadow-sm">
                        <Download size={14} className="mr-2" /> Export Data
                    </button>
                    <button type="button" onClick={handleDeleteAccount} className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 font-semibold rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition text-sm flex items-center border border-red-100 dark:border-red-900/30">
                        <Trash2 size={14} className="mr-2" /> Delete Account
                    </button>
                </div>
             </SettingsCard>

        </div>
    );
};

export default RecruiterSettingsPage;
