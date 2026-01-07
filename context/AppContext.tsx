
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import type { User, ResumeData, CareerRoadmap, InterviewSession, UserProfile, RecruiterProfile, RecruiterSettings, Assessment, AssessmentResult } from '../types';
import { MOCK_USERS, MOCK_ASSESSMENTS, MOCK_ASSESSMENT_RESULTS, MOCK_CANDIDATE_DATA } from '../utils/mockData';
import { authService } from '../services/authService';
import { candidateService } from '../services/candidateService';
import { recruiterService } from '../services/recruiterService';

type Theme = 'light' | 'dark';

interface AppContextType {
  user: User | null;
  resumeData: ResumeData | null;
  careerRoadmap: CareerRoadmap | null;
  interviewHistory: InterviewSession[];
  userProfile: UserProfile | null;
  recruiterProfile: RecruiterProfile | null;
  recruiterSettings: RecruiterSettings | null;
  assessments: Assessment[];
  assessmentResults: AssessmentResult[];
  isLoading: boolean;
  error: string | null;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  signup: (userData: Omit<User, 'role' | 'password'> & { password: string; company?: string }, role: 'candidate' | 'recruiter') => Promise<void>;
  login: (credentials: Pick<User, 'email' | 'password'>) => Promise<void>;
  logout: () => void;
  deleteCurrentUserAccount: () => void;
  setResumeData: (data: ResumeData | null) => void;
  setCareerRoadmap: (roadmap: CareerRoadmap | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addInterviewSession: (session: InterviewSession) => void;
  updateUserProfile: (profile: UserProfile) => void;
  updateRecruiterProfile: (profile: RecruiterProfile) => void;
  updateRecruiterSettings: (settings: RecruiterSettings) => void;
  createAssessment: (assessmentData: Omit<Assessment, 'id' | 'createdAt' | 'createdBy'>) => void;
  addAssessmentResult: (resultData: Omit<AssessmentResult, 'id' | 'completedAt'>) => void;
  deleteAssessment: (assessmentId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// --- LocalStorage Persistence Layer (Fallback) ---

const loadFromStorage = <T,>(key: string, defaultValue: T): T => {
    try {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error(`Error reading from localStorage key "${key}":`, error);
        return defaultValue;
    }
};

const saveToStorage = (key: string, value: any) => {
    try {
        window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error(`Error writing to localStorage key "${key}":`, error);
    }
};

const mapToJson = (map: Map<any, any>) => Array.from(map.entries());
const jsonToMap = (jsonArr: [any, any][]) => new Map(jsonArr);

// Initialize DBs from localStorage or mock data (Fallback)
let usersDB = loadFromStorage<User[]>('usersDB', MOCK_USERS);
let assessmentsDB = loadFromStorage<Assessment[]>('assessmentsDB', MOCK_ASSESSMENTS);
let assessmentResultsDB = loadFromStorage<AssessmentResult[]>('assessmentResultsDB', MOCK_ASSESSMENT_RESULTS);
let candidateDataDB = jsonToMap(loadFromStorage('candidateDataDB', mapToJson(MOCK_CANDIDATE_DATA)));
let recruiterDataDB = jsonToMap(loadFromStorage('recruiterDataDB', []));

// Save initial state to localStorage if it wasn't there
if (!window.localStorage.getItem('usersDB')) {
    saveToStorage('usersDB', usersDB);
    saveToStorage('assessmentsDB', assessmentsDB);
    saveToStorage('assessmentResultsDB', assessmentResultsDB);
    saveToStorage('candidateDataDB', mapToJson(candidateDataDB));
    saveToStorage('recruiterDataDB', mapToJson(recruiterDataDB));
}

// --- AppProvider Component ---

const defaultRecruiterSettings: RecruiterSettings = {
    emailNotifications: true,
    assessmentReminders: true,
    weeklyReports: false,
    autoReject: false,
    passingScore: 70,
    timeLimit: 60,
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [careerRoadmap, setCareerRoadmap] = useState<CareerRoadmap | null>(null);
  const [interviewHistory, setInterviewHistory] = useState<InterviewSession[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [recruiterProfile, setRecruiterProfile] = useState<RecruiterProfile | null>(null);
  const [recruiterSettings, setRecruiterSettings] = useState<RecruiterSettings | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [assessmentResults, setAssessmentResults] = useState<AssessmentResult[]>([]);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [theme, setThemeState] = useState<Theme>(() => {
    const storedTheme = localStorage.getItem('theme') as Theme | null;
    if (storedTheme) return storedTheme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  useEffect(() => {
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Load saved auth token on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('accessToken');
    if (savedToken) {
      authService.setAccessToken(savedToken);
    }
  }, []);

  const clearState = () => {
    setUser(null);
    setResumeData(null);
    setCareerRoadmap(null);
    setInterviewHistory([]);
    setUserProfile(null);
    setRecruiterProfile(null);
    setRecruiterSettings(null);
    setAssessments([]);
    setAssessmentResults([]);
    setError(null);
  };

  const signup = async (userData: Omit<User, 'role' | 'password'> & {password: string, company?: string}, role: 'candidate' | 'recruiter') => {
    setLoading(true);
    setError(null);
    try {
      const response = await authService.signup(userData, role);
      const userWithRole: User = { ...response.user, role: role as any };
      setUser(userWithRole);
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
      
      // Load user profile data from backend
      if (role === 'candidate') {
        try {
          const profile = await candidateService.getProfile();
          setUserProfile(profile);
        } catch (err) {
          console.error('Failed to load candidate profile:', err);
        }
      } else if (role === 'recruiter') {
        try {
          const profile = await recruiterService.getProfile();
          const settings = await recruiterService.getSettings();
          setRecruiterProfile(profile);
          setRecruiterSettings(settings);
        } catch (err) {
          console.error('Failed to load recruiter profile:', err);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Signup failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials: Pick<User, 'email' | 'password'>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authService.login(credentials.email, credentials.password);
      const userWithRole: User = { ...response.user, role: response.user.role as any };
      setUser(userWithRole);
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
      
      // Load user profile data from backend
      setAssessments(assessmentsDB);
      setAssessmentResults(assessmentResultsDB);

      if (userWithRole.role === 'candidate') {
        try {
          const profile = await candidateService.getProfile();
          const roadmap = await candidateService.getCareerRoadmap().catch(() => null);
          const interviews = await candidateService.getInterviewHistory().catch(() => []);
          
          setUserProfile(profile);
          if (roadmap) setCareerRoadmap(roadmap);
          setInterviewHistory(interviews);
        } catch (err) {
          console.error('Failed to load candidate data:', err);
          // Fallback to localStorage if backend fails
          const data = candidateDataDB.get(credentials.email) || {
            resumeData: null, careerRoadmap: null, interviewHistory: [], 
            userProfile: { 
              fullName: userWithRole.name, email: userWithRole.email, linkedinUrl: '', skills: [], languages: [], 
              profilePhotoUrl: `https://api.dicebear.com/8.x/initials/svg?seed=${userWithRole.name}`, resumeText: ''
            }
          };
          setResumeData(data.resumeData);
          setCareerRoadmap(data.careerRoadmap);
          setInterviewHistory(data.interviewHistory);
          setUserProfile(data.userProfile);
        }
      } else if (userWithRole.role === 'recruiter') {
        try {
          const profile = await recruiterService.getProfile();
          const settings = await recruiterService.getSettings();
          const assessmentsList = await recruiterService.getAssessments();
          
          setRecruiterProfile(profile);
          setRecruiterSettings(settings);
          setAssessments(assessmentsList);
        } catch (err) {
          console.error('Failed to load recruiter data:', err);
          // Fallback to mock data if backend fails
          const data = recruiterDataDB.get(credentials.email);
          if (data) {
            setRecruiterProfile(data.recruiterProfile);
            setRecruiterSettings(data.recruiterSettings);
          } else {
            setRecruiterProfile({ fullName: userWithRole.name, email: userWithRole.email, company: 'AI Corp' });
            setRecruiterSettings(defaultRecruiterSettings);
          }
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.error('Logout error:', err);
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    clearState();
  };

  const deleteCurrentUserAccount = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await authService.deleteAccount();
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      clearState();
    } catch (err) {
      console.error('Account deletion error:', err);
      setError(err instanceof Error ? err.message : 'Account deletion failed');
    } finally {
      setLoading(false);
    }
  };
  
  const addInterviewSession = async (session: InterviewSession) => {
    if (!user || user.role !== 'candidate') return;
    setLoading(true);
    try {
      const sessionData = {
        ...session,
        date: session.date || new Date().toISOString(),
      };
      await candidateService.addInterviewSession(sessionData as any);
      setInterviewHistory(prev => [session, ...prev]);
    } catch (err) {
      console.error('Failed to add interview session:', err);
      // Fallback to local state
      setInterviewHistory(prev => [session, ...prev]);
      const currentUserData = candidateDataDB.get(user.email);
      if (currentUserData) {
        const updatedHistory = [session, ...currentUserData.interviewHistory];
        candidateDataDB.set(user.email, { ...currentUserData, interviewHistory: updatedHistory });
        saveToStorage('candidateDataDB', mapToJson(candidateDataDB));
      }
    } finally {
      setLoading(false);
    }
  };

  const updateUserProfile = async (profile: UserProfile) => {
    if (!user || user.role !== 'candidate') return;
    setLoading(true);
    try {
      await candidateService.updateProfile(profile);
      setUserProfile(profile);
    } catch (err) {
      console.error('Failed to update profile:', err);
      // Fallback to local state
      setUserProfile(profile);
      const currentUserData = candidateDataDB.get(user.email);
      if (currentUserData) {
        candidateDataDB.set(user.email, { ...currentUserData, userProfile: profile });
        saveToStorage('candidateDataDB', mapToJson(candidateDataDB));
      }
    } finally {
      setLoading(false);
    }
  };
  
  const updateRecruiterProfile = async (profile: RecruiterProfile) => {
    if (!user || user.role !== 'recruiter') return;
    setLoading(true);
    try {
      await recruiterService.updateProfile(profile);
      setRecruiterProfile(profile);
    } catch (err) {
      console.error('Failed to update recruiter profile:', err);
      // Fallback to local state
      setRecruiterProfile(profile);
      const currentData = recruiterDataDB.get(user.email);
      if (currentData) {
        recruiterDataDB.set(user.email, { ...currentData, recruiterProfile: profile });
        saveToStorage('recruiterDataDB', mapToJson(recruiterDataDB));
      }
    } finally {
      setLoading(false);
    }
  };
  
  const updateRecruiterSettings = async (settings: RecruiterSettings) => {
    if (!user || user.role !== 'recruiter') return;
    setLoading(true);
    try {
      await recruiterService.updateSettings(settings);
      setRecruiterSettings(settings);
    } catch (err) {
      console.error('Failed to update recruiter settings:', err);
      // Fallback to local state
      setRecruiterSettings(settings);
      const currentData = recruiterDataDB.get(user.email);
      if (currentData) {
        recruiterDataDB.set(user.email, { ...currentData, recruiterSettings: settings });
        saveToStorage('recruiterDataDB', mapToJson(recruiterDataDB));
      }
    } finally {
      setLoading(false);
    }
  };

  const updateResumeData = (data: ResumeData | null) => {
    setResumeData(data);
    if (user) {
        const currentUserData = candidateDataDB.get(user.email);
        if (currentUserData) {
            candidateDataDB.set(user.email, { ...currentUserData, resumeData: data });
            saveToStorage('candidateDataDB', mapToJson(candidateDataDB));
        }
    }
  };

  const updateCareerRoadmap = async (roadmap: CareerRoadmap | null) => {
    if (!user || user.role !== 'candidate') return;
    setLoading(true);
    try {
      if (roadmap) {
        await candidateService.updateCareerRoadmap(roadmap);
      }
      setCareerRoadmap(roadmap);
    } catch (err) {
      console.error('Failed to update career roadmap:', err);
      // Fallback to local state
      setCareerRoadmap(roadmap);
      const currentUserData = candidateDataDB.get(user.email);
      if (currentUserData) {
        candidateDataDB.set(user.email, { ...currentUserData, careerRoadmap: roadmap });
        saveToStorage('candidateDataDB', mapToJson(candidateDataDB));
      }
    } finally {
      setLoading(false);
    }
  };

  const createAssessment = async (assessmentData: Omit<Assessment, 'id' | 'createdAt' | 'createdBy'>) => {
    if (!user || user.role !== 'recruiter') throw new Error("Only recruiters can create assessments.");
    setLoading(true);
    try {
      const response = await recruiterService.createAssessment(assessmentData);
      const updatedAssessments = [...assessments, response.assessment];
      assessmentsDB = updatedAssessments;
      saveToStorage('assessmentsDB', assessmentsDB);
      setAssessments(updatedAssessments);
    } catch (err) {
      console.error('Failed to create assessment:', err);
      // Fallback to local state
      const newAssessment: Assessment = {
        ...assessmentData,
        id: `asmt_${Date.now()}`,
        createdAt: new Date().toISOString(),
        createdBy: user.email,
      };
      const updatedAssessments = [...assessments, newAssessment];
      assessmentsDB = updatedAssessments;
      saveToStorage('assessmentsDB', assessmentsDB);
      setAssessments(updatedAssessments);
    } finally {
      setLoading(false);
    }
  };
  
  const addAssessmentResult = async (resultData: Omit<AssessmentResult, 'id' | 'completedAt'>) => {
    setLoading(true);
    try {
      const newResult: AssessmentResult = {
        ...resultData,
        id: `res_${Date.now()}`,
        completedAt: new Date().toISOString(),
      };
      assessmentResultsDB.push(newResult);
      saveToStorage('assessmentResultsDB', assessmentResultsDB);
      setAssessmentResults(prev => [...prev, newResult]);
    } catch (err) {
      console.error('Failed to add assessment result:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteAssessment = async (assessmentId: string) => {
    if (!user || user.role !== 'recruiter') return;
    setLoading(true);
    try {
      await recruiterService.deleteAssessment(assessmentId);
      assessmentsDB = assessmentsDB.filter(a => a.id !== assessmentId);
      saveToStorage('assessmentsDB', assessmentsDB);
      assessmentResultsDB = assessmentResultsDB.filter(r => r.assessmentId !== assessmentId);
      saveToStorage('assessmentResultsDB', assessmentResultsDB);
      
      setAssessments(prev => prev.filter(a => a.id !== assessmentId));
      setAssessmentResults(prev => prev.filter(r => r.assessmentId !== assessmentId));
    } catch (err) {
      console.error('Failed to delete assessment:', err);
      // Fallback to local state
      assessmentsDB = assessmentsDB.filter(a => a.id !== assessmentId);
      saveToStorage('assessmentsDB', assessmentsDB);
      assessmentResultsDB = assessmentResultsDB.filter(r => r.assessmentId !== assessmentId);
      saveToStorage('assessmentResultsDB', assessmentResultsDB);
      
      setAssessments(prev => prev.filter(a => a.id !== assessmentId));
      setAssessmentResults(prev => prev.filter(r => r.assessmentId !== assessmentId));
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    resumeData,
    careerRoadmap,
    interviewHistory,
    userProfile,
    recruiterProfile,
    recruiterSettings,
    assessments,
    assessmentResults,
    isLoading,
    error,
    theme,
    setTheme,
    signup,
    login,
    logout,
    deleteCurrentUserAccount,
    setResumeData: updateResumeData,
    setCareerRoadmap: updateCareerRoadmap,
    setLoading,
    setError,
    addInterviewSession,
    updateUserProfile,
    updateRecruiterProfile,
    updateRecruiterSettings,
    createAssessment,
    addAssessmentResult,
    deleteAssessment
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
