
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { User, Save, Upload, AlertCircle } from 'lucide-react';
import Spinner from '../components/Spinner';
import type { UserProfile } from '../types';
import { parseResume } from '../services/geminiService';
import { candidateService } from '../services/candidateService';


const CandidateProfilePage: React.FC = () => {
    const { userProfile, updateUserProfile, setResumeData, isLoading: contextIsLoading } = useAppContext();
    const [profile, setProfile] = useState<UserProfile | null>(userProfile);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [saveError, setSaveError] = useState('');
    const [photoFileName, setPhotoFileName] = useState('');
    const [resumeFileName, setResumeFileName] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisError, setAnalysisError] = useState('');

    useEffect(() => {
        setProfile(userProfile);
    }, [userProfile]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setProfile(prev => prev ? { ...prev, [name]: value } : null);
    };
    
    const handleTagChange = (field: 'skills' | 'languages', value: string) => {
        const tags = value.split(',').map(tag => tag.trim()).filter(Boolean);
        setProfile(prev => prev ? { ...prev, [field]: tags } : null);
    }
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fileType: 'photo' | 'resume') => {
        const file = e.target.files?.[0];
        if (file) {
            if (fileType === 'photo') {
                setPhotoFileName(file.name);
                // In a real app, you would handle the file upload here.
                // For this simulation, we are just showing the file name.
            }
            if (fileType === 'resume') {
                setResumeFileName(file.name);
                const reader = new FileReader();
                reader.onload = async (event) => {
                    const text = event.target?.result as string;
                    if (!text) {
                        setAnalysisError("Could not read text from the resume file.");
                        return;
                    }
                    
                    setIsAnalyzing(true);
                    setAnalysisError('');
                    try {
                        const parsedData = await parseResume(text);
                        setProfile(prev => prev ? { 
                            ...prev, 
                            resumeText: text, 
                            skills: parsedData.skills 
                        } : null);
                        // Update the global resume data so other pages reflect the change
                        setResumeData(parsedData);
                    } catch (err) {
                        console.error("Resume analysis failed:", err);
                        setAnalysisError('AI analysis failed. You can still save the resume text manually.');
                        // Still set the resume text so user can save it without skills
                        setProfile(prev => prev ? { ...prev, resumeText: text } : null);
                    } finally {
                        setIsAnalyzing(false);
                    }
                };
                reader.readAsText(file);
            }
        }
    }

    const handleSaveChanges = async (e: React.FormEvent) => {
        e.preventDefault();
        if (profile) {
            setIsSaving(true);
            setSaveSuccess(false);
            setSaveError('');
            try {
                // Call backend API to save profile
                await candidateService.updateProfile(profile);
                updateUserProfile(profile);
                setSaveSuccess(true);
                setTimeout(() => setSaveSuccess(false), 3000);
            } catch (err) {
                console.error("Error saving profile:", err);
                setSaveError('Failed to save profile. Please try again.');
                setTimeout(() => setSaveError(''), 3000);
            } finally {
                setIsSaving(false);
            }
        }
    };
    
    if (contextIsLoading || !profile) {
        return <div className="flex justify-center items-center h-full"><Spinner/></div>
    }

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Profile Settings</h1>
                <p className="text-slate-600 mt-1">Manage your personal and professional information.</p>
            </div>
            
            <form onSubmit={handleSaveChanges} className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-slate-200 space-y-8">
                <div className="flex items-center gap-6">
                    <img src={profile.profilePhotoUrl} alt="Profile" className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-slate-200 object-cover" />
                    <div>
                        <label htmlFor="profile-photo-upload" className="cursor-pointer px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 transition text-sm flex items-center gap-2">
                            <Upload size={16} />
                            Change Photo
                        </label>
                        <input id="profile-photo-upload" type="file" className="hidden" onChange={e => handleFileChange(e, 'photo')} accept="image/*" />
                        {photoFileName && <p className="text-xs text-slate-500 mt-2">Selected: {photoFileName}</p>}
                    </div>
                </div>

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
                    <label htmlFor="linkedinUrl" className="block text-sm font-medium text-slate-700 mb-1">LinkedIn Profile</label>
                    <input type="url" id="linkedinUrl" name="linkedinUrl" value={profile.linkedinUrl} onChange={handleChange} placeholder="https://linkedin.com/in/yourprofile" className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
                
                <div>
                    <label htmlFor="resume-upload" className="block text-sm font-medium text-slate-700 mb-1">Resume</label>
                     {profile.resumeText && !isAnalyzing && !analysisError && <p className="text-sm text-green-600 bg-green-50 p-3 rounded-md mb-2">A resume has been uploaded and analyzed. The extracted skills have been added below. Remember to save your changes.</p>}
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-md">
                        <div className="space-y-1 text-center">
                            <Upload size={32} className="mx-auto text-slate-400" />
                            <div className="flex text-sm text-slate-600">
                                <label htmlFor="resume-file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                                    <span>{profile.resumeText ? 'Upload a different file' : 'Upload a file'}</span>
                                    <input id="resume-file-upload" name="resume-file-upload" type="file" className="sr-only" onChange={e => handleFileChange(e, 'resume')} accept=".txt,.pdf,.doc,.docx" />
                                </label>
                                <p className="pl-1">or drag and drop</p>
                            </div>
                            <p className="text-xs text-slate-500">TXT, PDF, DOC, DOCX up to 10MB</p>
                        </div>
                    </div>
                     {isAnalyzing && (
                        <div className="mt-2 flex items-center gap-2 text-sm text-indigo-600">
                            <Spinner size="h-4 w-4" />
                            <p>Analyzing resume with AI...</p>
                        </div>
                    )}
                    {analysisError && (
                        <div className="mt-2 flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded-md">
                            <AlertCircle size={16} />
                            <p>{analysisError}</p>
                        </div>
                    )}
                     {resumeFileName && !isAnalyzing && <p className="text-sm text-slate-500 mt-2">Selected for upload: {resumeFileName}</p>}
                </div>

                <div>
                    <label htmlFor="skills" className="block text-sm font-medium text-slate-700 mb-1">Skills</label>
                    <input type="text" id="skills" value={profile.skills.join(', ')} onChange={(e) => handleTagChange('skills', e.target.value)} placeholder="React, Node.js, Project Management" className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                    <p className="text-xs text-slate-500 mt-1">Enter skills separated by commas. These will be updated automatically when you upload a resume.</p>
                </div>
                
                <div>
                    <label htmlFor="languages" className="block text-sm font-medium text-slate-700 mb-1">Languages</label>
                    <input type="text" id="languages" value={profile.languages.join(', ')} onChange={(e) => handleTagChange('languages', e.target.value)} placeholder="English, Spanish, French" className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                    <p className="text-xs text-slate-500 mt-1">Enter languages separated by commas.</p>
                </div>

                <div className="flex items-center justify-end gap-4">
                    {saveSuccess && <p className="text-green-600 text-sm animate-fade-in">✓ Profile saved successfully!</p>}
                    {saveError && <p className="text-red-600 text-sm animate-fade-in">✗ {saveError}</p>}
                    <button
                        type="submit"
                        disabled={isSaving || isAnalyzing}
                        className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300 transition flex items-center"
                    >
                        {isSaving ? <><Spinner size="h-5 w-5" /> <span className="ml-2">Saving...</span></> : <><Save size={16} className="mr-2"/> Save Changes</>}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CandidateProfilePage;
