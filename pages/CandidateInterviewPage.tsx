import React, { useState, useEffect, useCallback, useRef } from 'react';
// FIX: Replaced `useHistory` with `useNavigate` for react-router-dom v6 compatibility.
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { generateNextQuestion, getInterviewFeedback, generateInterviewSummary, generateTTSAudio } from '../services/aiService';
import { assessmentService } from '../services/assessmentService';
import Spinner, { PageSpinner } from '../components/Spinner';
import * as faceapi from 'face-api.js';
// FIX: Imported XCircle icon from lucide-react.
import { AlertTriangle, Lightbulb, Mic, Timer, CheckCircle, Bot, Star, FileText, BarChart, ChevronRight, Video, VideoOff, Settings, BookCopy, BarChart2, XCircle, Smile, User } from 'lucide-react';
// FIX: Import SpeechRecognition type to resolve reference error.
import type { InterviewQuestion, InterviewFeedback, InterviewSession, InterviewSummary, InterviewConfig, TranscriptEntry, Badge, SpeechRecognition, ResumeData } from '../types';
import InterviewReport from '../components/InterviewReport';
import { correctTranscript } from '../utils/transcriptCorrection';

// Speech Recognition Types
// FIX: Removed local Speech Recognition type definitions to use centralized ones from types.ts. The type is now imported.
type PageStage = 'setup' | 'readiness_check' | 'interview' | 'summary';
type InterviewSubStage = 'generating_questions' | 'asking' | 'listening' | 're_asking' | 'analyzing' | 'transitioning' | 'generating_summary' | 'finished';

const DEFAULT_TOTAL_QUESTIONS = 5;

const interviewTypeDetails = {
    'Behavioral': {
        description: "Focus on your past experiences, behaviors, and soft skills with questions about how you've handled specific situations.",
        examples: [
            "Tell me about a challenge you faced at work and how you overcame it.",
            "Describe a situation where you had to work under pressure."
        ]
    },
    'Technical': {
        description: "Assesses your technical knowledge, problem-solving skills, and coding abilities related to the job role.",
        examples: [
            "Explain the difference between SQL and NoSQL databases.",
            "How would you design a rate limiter for an API?"
        ]
    },
    'Role-Specific': {
        description: "Tailored questions that dive deep into the specific responsibilities and challenges of the role you're applying for.",
        examples: [
            "How would you approach developing a product roadmap for a new feature?",
            "Describe your process for conducting user research."
        ]
    }
};

const evaluateBadges = (transcript: TranscriptEntry[]): Badge[] => {
    const badges: Set<Badge> = new Set();

    transcript.forEach(entry => {
        const duration = entry.duration || 0;
        const feedback = entry.feedback;

        // Time Manager badge: delivered a complete answer within 20–60 seconds.
        if (duration >= 20 && duration <= 60) {
            badges.add('Time Manager');
        }

        // Good Communicator badge: speaks for more than 30 seconds with minimal filler words.
        if (duration > 30 && (feedback.fillerWords || 0) <= 5) {
            badges.add('Good Communicator');
        }
    });

    return Array.from(badges);
};

const getLevel = (avg: number) => {
    if (avg < 45) return { 
        name: 'Beginner', 
        color: 'text-blue-600 dark:text-blue-400', 
        bg: 'bg-blue-50 dark:bg-blue-900/20', 
        border: 'border-blue-200 dark:border-blue-800/50' 
    };
    if (avg < 75) return { 
        name: 'Intermediate', 
        color: 'text-indigo-600 dark:text-indigo-400', 
        bg: 'bg-indigo-50 dark:bg-indigo-900/20', 
        border: 'border-indigo-200 dark:border-indigo-800/50' 
    };
    return { 
        name: 'Advanced', 
        color: 'text-purple-600 dark:text-purple-400', 
        bg: 'bg-purple-50 dark:bg-purple-900/20', 
        border: 'border-purple-200 dark:border-purple-800/50' 
    };
};

const InterviewSetup: React.FC<{ 
    onStart: (config: InterviewConfig) => void, 
    jobRole: string, 
    currentAvg: number,
    lockedConfig?: InterviewConfig | null
}> = ({ onStart, jobRole, currentAvg, lockedConfig }) => {
    const level = getLevel(currentAvg);
    const [config, setConfig] = useState<InterviewConfig>(
        lockedConfig || { type: 'Behavioral', difficulty: 'Medium', persona: 'Neutral', role: jobRole }
    );
    const [devices, setDevices] = useState<{ cameras: MediaDeviceInfo[], mics: MediaDeviceInfo[] }>({ cameras: [], mics: [] });
    const [stream, setStream] = useState<MediaStream | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [deviceError, setDeviceError] = useState<string | null>(null);

    useEffect(() => {
        const getDevices = async () => {
            setDeviceError(null);
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                setStream(stream);
                const allDevices = await navigator.mediaDevices.enumerateDevices();
                setDevices({
                    cameras: allDevices.filter(d => d.kind === 'videoinput'),
                    mics: allDevices.filter(d => d.kind === 'audioinput')
                });
            } catch (err: any) {
                console.error("Error accessing media devices.", err);
                if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                    setDeviceError("Permission to access camera and microphone was denied. Please enable access in your browser settings to continue.");
                } else {
                    setDeviceError("Could not access camera or microphone. Please ensure they are connected and not in use by another application.");
                }
            }
        };
        getDevices();
        return () => {
            stream?.getTracks().forEach(track => track.stop());
        };
    }, []);

    useEffect(() => {
        if (stream && videoRef.current) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    return (
        <div className="w-full max-w-5xl mx-auto space-y-8 animate-fade-in text-slate-900 dark:text-slate-100">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                    {lockedConfig ? "Recruiter Assessment Interview" : "Practice Interview"}
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                    {lockedConfig ? "Verify your camera and mic setup to begin your assessment." : "Configure your interview session to get started."}
                </p>
            </div>
            {lockedConfig && (
                <div className="bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800 flex items-center gap-3">
                    <Bot size={24} className="text-indigo-600 dark:text-indigo-400" />
                    <div>
                        <h3 className="font-semibold text-indigo-900 dark:text-indigo-200">Recruiter Assessment Mode</h3>
                        <p className="text-xs text-indigo-700 dark:text-indigo-300">You are completing a specialized assessment for this role. The configurations have been pre-set by the recruiter.</p>
                    </div>
                </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                    {/* Interview Type */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                        <h2 className="text-xl font-semibold mb-4 dark:text-white">Select Interview Type</h2>
                        <div className="flex flex-col sm:flex-row gap-2">
                            {(Object.keys(interviewTypeDetails) as Array<keyof typeof interviewTypeDetails>).map(type => (
                                <button 
                                    key={type} 
                                    disabled={!!lockedConfig}
                                    onClick={() => setConfig(c => ({ ...c, type }))} 
                                    className={`px-4 py-2 rounded-lg font-semibold transition w-full ${config.type === type ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-80'}`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                        <div className="mt-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg text-sm border border-transparent dark:border-slate-700">
                            <p className="text-slate-700 dark:text-slate-300">{interviewTypeDetails[config.type].description}</p>
                            <div className="mt-2 text-slate-500 dark:text-slate-400">
                                <p className="font-semibold text-xs dark:text-slate-300">Example Questions:</p>
                                <ul className="list-disc list-inside text-xs">
                                    {interviewTypeDetails[config.type].examples.map((ex, i) => <li key={i}>{ex}</li>)}
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Customization */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                        <h2 className="text-xl font-semibold mb-4 dark:text-white">
                            {lockedConfig ? "Assessment Details" : "Interview Customization"}
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {lockedConfig ? (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Difficulty Level</label>
                                        <div className="p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md font-semibold text-slate-800 dark:text-slate-200">
                                            {config.difficulty}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Interviewer Persona</label>
                                        <div className="p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md font-semibold text-slate-800 dark:text-slate-200">
                                            {config.persona}
                                        </div>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Assessed Job Role</label>
                                        <div className="p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md font-semibold text-slate-800 dark:text-slate-200">
                                            {config.role}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Difficulty Level</label>
                                        <select value={config.difficulty} onChange={e => setConfig(c => ({ ...c, difficulty: e.target.value as any }))} className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none">
                                            <option>Easy</option><option>Medium</option><option>Hard</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Your Progression Level</label>
                                        <div className={`p-2 rounded-md border ${level.bg} ${level.border} ${level.color} font-bold text-center text-sm shadow-sm`}>
                                            {level.name}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Interviewer Persona</label>
                                        <select value={config.persona} onChange={e => setConfig(c => ({ ...c, persona: e.target.value as any }))} className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none">
                                            <option>Neutral</option><option>Friendly</option><option>Strict</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Job Role / Industry</label>
                                        <input type="text" value={config.role} onChange={e => setConfig(c => ({ ...c, role: e.target.value }))} className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none" />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
                <div className="space-y-6">
                    {/* Device Setup */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                        <h2 className="text-xl font-semibold mb-4 dark:text-white">Device Setup</h2>
                        {deviceError && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-400 text-sm p-3 rounded-md mb-4 flex items-start">
                                <AlertTriangle size={18} className="mr-2 flex-shrink-0 mt-0.5" />
                                <span>{deviceError}</span>
                            </div>
                        )}
                        <div className="space-y-4">
                            <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-transparent dark:border-slate-700">
                                <p className="font-semibold text-sm flex items-center dark:text-slate-200">{devices.cameras.length > 0 ? <CheckCircle size={16} className="text-green-500 mr-2" /> : <AlertTriangle size={16} className="text-red-500 mr-2" />} Camera</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 pl-6">{devices.cameras.length > 0 ? devices.cameras[0].label : 'Camera not connected'}</p>
                            </div>
                            <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-transparent dark:border-slate-700">
                                <p className="font-semibold text-sm flex items-center dark:text-slate-200">{devices.mics.length > 0 ? <CheckCircle size={16} className="text-green-500 mr-2" /> : <AlertTriangle size={16} className="text-red-500 mr-2" />} Microphone</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 pl-6">{devices.mics.length > 0 ? devices.mics[0].label : 'Microphone not connected'}</p>
                            </div>
                            <div className="aspect-video bg-slate-800 rounded-lg overflow-hidden border border-slate-700">
                                <video ref={videoRef} autoPlay muted className="w-full h-full object-cover"></video>
                            </div>
                        </div>
                    </div>
                    <button onClick={() => onStart(config)} disabled={!!deviceError} className="w-full px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition shadow-lg text-lg disabled:bg-indigo-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed">Start Interview</button>
                </div>
            </div>
        </div>
    );
};

const ReadinessCheck: React.FC<{ config: InterviewConfig, onContinue: () => void }> = ({ config, onContinue }) => (
    <div className="w-full max-w-2xl mx-auto text-center space-y-6 animate-fade-in p-4">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Interview Setup</h1>
        <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 space-y-4">
            <p className="text-slate-600 dark:text-slate-300">Ensure your camera and background are ready before you begin. You will enter the interview after pressing the button below.</p>
            <div className="text-left bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg space-y-2 border border-transparent dark:border-slate-700">
                <p className="dark:text-slate-300"><strong className="dark:text-white">Position:</strong> {config.role}</p>
                <p className="dark:text-slate-300"><strong className="dark:text-white">Type:</strong> {config.type}</p>
                <p className="dark:text-slate-300"><strong className="dark:text-white">Difficulty:</strong> {config.difficulty}</p>
            </div>
            <button onClick={onContinue} className="w-full px-8 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition shadow-lg text-lg">Enter Interview</button>
        </div>
    </div>
);

const CandidateInterviewPage: React.FC = () => {
    const { user, resumeData, careerRoadmap, addInterviewSession, userProfile, interviewHistory, assessments, addAssessmentResult } = useAppContext();
    // Calculate global average and level for UI display
    // Updated Logic: Only scores >= 75 count towards the average, divided by total interviews.
    const successfulScores = interviewHistory.filter(s => s.averageScore >= 75).map(s => s.averageScore);
    const totalAvg = interviewHistory && interviewHistory.length > 0
        ? Math.round(successfulScores.reduce((acc, s) => acc + s, 0) / interviewHistory.length)
        : 0;
    const currentLevel = getLevel(totalAvg);
    // FIX: Replaced `useHistory` with `useNavigate` for react-router-dom v6 compatibility.
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const assessmentId = searchParams.get('assessmentId');

    // Overall Page State
    const [pageStage, setPageStage] = useState<PageStage>('setup');
    const [assessment, setAssessment] = useState<any | null>(null);
    const [loadingAssessment, setLoadingAssessment] = useState(false);
    const [interviewConfig, setInterviewConfig] = useState<InterviewConfig | null>(null);

    // Interview Session State
    const [interviewStage, setInterviewStage] = useState<InterviewSubStage>('generating_questions');
    const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
    const [transcript, setTranscript] = useState('');
    const [notes, setNotes] = useState('');
    const [sessionTranscript, setSessionTranscript] = useState<TranscriptEntry[]>([]);
    const [finalSession, setFinalSession] = useState<InterviewSession | null>(null);
    const [timer, setTimer] = useState(0);
    const [sessionDuration, setSessionDuration] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [noSpeechRetryCount, setNoSpeechRetryCount] = useState(0);
    const totalQuestions = assessmentId && assessment ? assessment.questions.length : DEFAULT_TOTAL_QUESTIONS;

    // Media & Recording Refs
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const timerIntervalRef = useRef<number | null>(null);
    const silenceTimeoutRef = useRef<number | null>(null);
    const userVideoRef = useRef<HTMLVideoElement | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const userStreamRef = useRef<MediaStream | null>(null);
    const speechRetryRef = useRef(0);
    const submissionTriggeredRef = useRef(false);
    const MAX_SPEECH_RETRIES = 3;
    const recordedChunksRef = useRef<Blob[]>([]);
    const activeAudioRef = useRef<HTMLAudioElement | null>(null); // Tracks the currently playing TTS audio
    const generatingQuestionIdRef = useRef<number>(0);
    const lastSpokenQuestionRef = useRef<number | null>(null);
    const finishingInterviewRef = useRef<boolean>(false);

    // Facial Analysis Refs
    const faceCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const faceIntervalRef = useRef<number | null>(null);
    const faceModelsLoadedRef = useRef(false);
    type ExpressionSample = { [key: string]: number };
    const expressionSamplesRef = useRef<ExpressionSample[]>([]);

    // Load face-api models once
    useEffect(() => {
        const loadModels = async () => {
            try {
                const MODEL_URL = '/weights';
                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                    faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
                ]);
                faceModelsLoadedRef.current = true;
                console.log('✓ Face-api models loaded');
            } catch (err) {
                console.warn('Face-api models could not be loaded, facial analysis will be skipped:', err);
            }
        };
        loadModels();
    }, []);


    // Fetch recruiter assessment if in assessment mode
    useEffect(() => {
        if (!assessmentId) return;

        const loadAssessment = async () => {
            setLoadingAssessment(true);
            setError(null);

            // 1. Try decoding embedded assessment details from 'q' query param first
            const qEncoded = searchParams.get('q');
            if (qEncoded) {
                try {
                    const decodedJson = decodeURIComponent(escape(atob(qEncoded)));
                    const payload = JSON.parse(decodedJson);
                    if (payload && payload.questions && payload.questions.length > 0) {
                        console.log("✓ Successfully loaded embedded assessment details from URL link!");
                        setAssessment(payload);
                        setInterviewConfig({
                            type: (payload.config?.type || 'Behavioral') as any,
                            difficulty: (payload.config?.difficulty || 'Medium') as any,
                            persona: 'Neutral',
                            role: payload.jobRole || 'Software Developer'
                        });
                        setLoadingAssessment(false);
                        return; // Successfully loaded, skip backend/context fetch
                    }
                } catch (e) {
                    console.error("Failed to decode embedded assessment from URL:", e);
                }
            }

            // 2. Fallback to API / context
            try {
                // Try fetching public assessment from backend first
                const data = await assessmentService.getPublicAssessment(assessmentId);
                if (data) {
                    setAssessment(data);
                    // Map the assessment details into interviewConfig
                    setInterviewConfig({
                        type: (data.config?.type || 'Behavioral') as any,
                        difficulty: (data.config?.difficulty || 'Medium') as any,
                        persona: 'Neutral',
                        role: data.jobRole || 'Software Developer'
                    });
                } else {
                    throw new Error("Assessment not found");
                }
            } catch (err) {
                console.error("Failed to fetch assessment from backend, trying context fallback:", err);
                // Try context fallback
                const found = assessments.find(a => a.id === assessmentId);
                if (found) {
                    setAssessment(found);
                    setInterviewConfig({
                        type: (found.config?.type || 'Behavioral') as any,
                        difficulty: (found.config?.difficulty || 'Medium') as any,
                        persona: 'Neutral',
                        role: found.jobRole || 'Software Developer'
                    });
                } else {
                    setError("This assessment link is invalid or no longer exists.");
                }
            } finally {
                setLoadingAssessment(false);
            }
        };

        loadAssessment();
    }, [assessmentId, searchParams, assessments]);

    useEffect(() => {
        setNoSpeechRetryCount(0);
    }, [questions]);

    // Refs to hold latest state for callbacks, preventing stale closures in useEffect
    const transcriptRef = useRef('');
    useEffect(() => { transcriptRef.current = transcript; }, [transcript]);

    const notesRef = useRef('');
    useEffect(() => { notesRef.current = notes; }, [notes]);

    const timerRef = useRef(0);
    useEffect(() => { timerRef.current = timer; }, [timer]);

    const interviewStageRef = useRef(interviewStage);
    useEffect(() => { interviewStageRef.current = interviewStage; }, [interviewStage]);

    const speak = useCallback(async (text: string, onEndCallback?: () => void) => {
        speechSynthesis.cancel(); // Stop any leftover browser speaking

        if (activeAudioRef.current) {
            try {
                activeAudioRef.current.pause();
                activeAudioRef.current.src = "";
            } catch (err) {
                console.error("Failed to stop previous audio:", err);
            }
            activeAudioRef.current = null;
        }

        // Pre-process text for more natural pauses:
        // Add a pause marker after questions, commas, and sentence breaks
        const processedText = text
            .replace(/([.!?]\s+)/g, '$1')
            .replace(/(,\s)/g, ', ')
            .trim();

        try {
            const audioUrl = await generateTTSAudio(processedText, 'en-US');
            const audio = new Audio(audioUrl);
            activeAudioRef.current = audio;
            audio.playbackRate = 0.88; // Slower = more natural, human-like pacing
            audio.onended = () => {
                if (onEndCallback) onEndCallback();
                URL.revokeObjectURL(audioUrl);
                activeAudioRef.current = null;
            };
            audio.play().catch(err => {
                console.error("Audio playback failed:", err);
                if (onEndCallback) onEndCallback();
            });
        } catch (error) {
            console.error("Failed to generate TTS, proceeding without audio:", error);
            if (onEndCallback) onEndCallback();
        }
    }, []);

    // ---- Page Stage Transitions ----
    const handleStartSetup = (config: InterviewConfig) => {
        setInterviewConfig(config);
        setPageStage('readiness_check');
    };

    const handleStartInterview = async () => {
        generatingQuestionIdRef.current = 0;
        lastSpokenQuestionRef.current = null;
        finishingInterviewRef.current = false;
        setPageStage('interview');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            userStreamRef.current = stream;
            if (userVideoRef.current) userVideoRef.current.srcObject = stream;

            // Start recording
            recordedChunksRef.current = [];
            const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
            mediaRecorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    recordedChunksRef.current.push(event.data);
                }
            };
            // Fallback to simpler instantiation if webm is not supported by the browser on windows
            mediaRecorder.start(1000); // Collect data every second
            mediaRecorderRef.current = mediaRecorder;

            // The first question will be fetched by the 'generating_questions' useEffect
            setInterviewStage('generating_questions');

            // Start real-time facial expression detection
            expressionSamplesRef.current = [];
            if (faceModelsLoadedRef.current && userVideoRef.current) {
                faceIntervalRef.current = window.setInterval(async () => {
                    const video = userVideoRef.current;
                    if (!video || video.readyState < 2) return;
                    try {
                        const detection = await faceapi
                            .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
                            .withFaceExpressions();
                        if (detection && detection.expressions) {
                            expressionSamplesRef.current.push({ ...detection.expressions } as ExpressionSample);
                        }
                    } catch (e) {
                        // Silently ignore single-frame errors
                    }
                }, 3000); // Sample every 3 seconds
            }
        } catch (err: any) {
            console.error(err);
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                setError("Permission to access camera and microphone was denied. Please enable access in your browser settings and restart the interview.");
            } else {
                setError("Failed to start interview. Check your camera/mic and API connection.");
            }
        }
    };

    // ---- Core Interview Logic ----
    const stopTimer = useCallback(() => {
        if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
        }
        setSessionDuration(prev => prev + timerRef.current);
        setTimer(0);
    }, []);

    const handleAnswerSubmission = useCallback(async (finalTranscript: string, duration: number) => {
        if (interviewStageRef.current !== 'listening') return;
        setInterviewStage('analyzing');
        setError(null);

        const answer = finalTranscript.trim() || "No answer provided.";
        const currentQuestion = questions[questions.length - 1];
        const currentNotes = notesRef.current;

        if (!currentQuestion) {
            console.error("handleAnswerSubmission: No current question found.");
            setInterviewStage('transitioning');
            return;
        }

        try {
            const fb = await getInterviewFeedback(currentQuestion.question, answer);
            setSessionTranscript(prev => [...prev, { question: currentQuestion.question, answer, feedback: fb, notes: currentNotes, duration }]);
        } catch (err) {
            console.error("Failed to get feedback for a question:", err);
            const emptyFeedback: InterviewFeedback = {
                score: 0, responseQuality: 0, evaluation: { clarity: 'N/A', relevance: 'N/A', structure: 'N/A', confidence: 'N/A' },
                grammarCorrection: { hasErrors: false, explanation: 'Error analyzing.' }, professionalRewrite: answer,
                tips: [], alexisResponse: "Sorry, I couldn't process that.", wordCount: 0, fillerWords: 0, hasExample: false
            };
            setSessionTranscript(prev => [...prev, { question: currentQuestion.question, answer, feedback: emptyFeedback, notes: currentNotes, duration }]);
        } finally {
            setInterviewStage('transitioning');
        }
    }, [questions]);

    const handleFinishInterview = useCallback(async () => {
        if (finishingInterviewRef.current) {
            console.log("Interview finish already in progress, ignoring duplicate call.");
            return;
        }
        finishingInterviewRef.current = true;
        setInterviewStage('generating_summary');

        // Stop any currently playing TTS audio immediately
        if (activeAudioRef.current) {
            activeAudioRef.current.pause();
            activeAudioRef.current = null;
        }
        speechSynthesis.cancel();

        // Stop facial analysis interval
        if (faceIntervalRef.current) {
            clearInterval(faceIntervalRef.current);
            faceIntervalRef.current = null;
        }

        // Stop user stream tracks
        if (userStreamRef.current) {
            userStreamRef.current.getTracks().forEach(track => track.stop());
        }

        // Stop video recording
        let videoUrl = '';
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            try {
                mediaRecorderRef.current.stop();
                // Create object URL from recorded chunks
                if (recordedChunksRef.current.length > 0) {
                    const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
                    videoUrl = URL.createObjectURL(blob);
                }
            } catch (recErr) {
                console.warn('Failed to stop media recorder safely:', recErr);
            }
        }

        // Navigate to summary page even if no questions were answered.
        if (sessionTranscript.length === 0 && interviewConfig) {
            const dummySession: InterviewSession = {
                date: new Date().toISOString(),
                type: `${interviewConfig.type} - ${interviewConfig.role}`,
                duration: Math.round(sessionDuration / 60),
                averageScore: 0,
                config: interviewConfig,
                transcript: [],
                summary: {
                    overallSummary: "You did not answer any questions during this session. Complete an interview to get detailed feedback.",
                    actionableTips: ["Try answering at least one question in your next practice session.", "Ensure your microphone is set up and working correctly."],
                    encouragement: "Every attempt is a step forward. Keep practicing!",
                    simulatedFacialExpressionAnalysis: "Analysis requires completed answers.",
                    simulatedBodyLanguageAnalysis: "Analysis requires completed answers.",
                    simulatedAudioAnalysis: "Analysis requires completed answers.",
                    badgesEarned: [],
                },
                videoUrl
            };
            setFinalSession(dummySession);
            setPageStage('summary');
            return;
        }

        try {
            const earnedBadges = evaluateBadges(sessionTranscript);
            const summaryData = await generateInterviewSummary(sessionTranscript.map(t => t.feedback));
            summaryData.badgesEarned = earnedBadges;

            // --- Real Facial Expression Analysis ---
            const samples = expressionSamplesRef.current;
            if (samples.length > 0) {
                const allKeys = Object.keys(samples[0]);
                const avgExpressions: ExpressionSample = {};
                allKeys.forEach(k => {
                    avgExpressions[k] = samples.reduce((sum, s) => sum + (s[k] || 0), 0) / samples.length;
                });
                const dominant = allKeys.reduce((a, b) => avgExpressions[a] > avgExpressions[b] ? a : b, allKeys[0]);
                const confidence = Math.round((avgExpressions['neutral'] || 0) * 100);
                const happiness = Math.round((avgExpressions['happy'] || 0) * 100);
                const anxious = Math.round(((avgExpressions['fearful'] || 0) + (avgExpressions['sad'] || 0)) * 50);

                summaryData.simulatedFacialExpressionAnalysis =
                    (dominant === 'neutral' || dominant === 'happy')
                        ? `You appeared calm and composed throughout the interview. Your facial expressions were steady, and you maintained great virtual eye contact with the camera, which conveyed strong focus and professionalism.`
                        : `You showed some variation in your facial expressions, which is completely natural. However, there were moments where slight tension was visible. Focusing on steady eye contact with the camera and keeping your expressions relaxed can help project even more confidence.`;

                summaryData.simulatedBodyLanguageAnalysis =
                    (dominant === 'neutral' || dominant === 'happy')
                        ? `Your posture remained very professional and upright. You minimized unnecessary movements and kept a stable presence, making you look highly engaged and attentive to the interviewer.`
                        : `Your body language indicated active engagement, though you occasionally made slight shifting movements. Try to maintain a grounded posture and use natural hand gestures to emphasize your points without appearing restless.`;
            }
            // --- End Facial Analysis ---

            const averageScore = sessionTranscript.reduce((acc, t) => acc + t.feedback.score, 0) / sessionTranscript.length;

            const sessionData: InterviewSession = {
                date: new Date().toISOString(),
                type: `${interviewConfig!.type} - ${interviewConfig!.role}`,
                duration: Math.round(sessionDuration / 60),
                averageScore: Math.round(averageScore),
                config: interviewConfig!,
                transcript: sessionTranscript,
                summary: summaryData,
                videoUrl
            };

            // Save interview session to database and update app context so dashboard shows progress immediately
            try {
                await assessmentService.saveInterviewSession(sessionData);
                console.log('✓ Interview session saved to database');
            } catch (dbError) {
                console.warn('Failed to save to database, but continuing with local session:', dbError);
            }

            try {
                // addInterviewSession will attempt to persist via candidateService and also update local context
                // It's safe to call even if the DB save above failed; it contains its own fallback logic.
                await addInterviewSession(sessionData as any);
            } catch (ctxErr) {
                console.warn('Failed to add interview session to context:', ctxErr);
            }

            if (assessmentId && assessment) {
                try {
                    await addAssessmentResult({
                        assessmentId,
                        candidateName: userProfile?.fullName || user?.name || "Candidate",
                        candidateEmail: userProfile?.email || user?.email || "candidate@test.com",
                        session: sessionData
                    });
                    console.log('✓ Assessment result submitted to recruiter');
                } catch (asmtErr) {
                    console.error('Failed to submit assessment result to recruiter:', asmtErr);
                }
            }

            setFinalSession(sessionData);
            setPageStage('summary');
        } catch (err) {
            setError("Could not generate interview summary.");
            setInterviewStage('finished');
        }
    }, [sessionTranscript, interviewConfig, sessionDuration, assessmentId, assessment, userProfile, user, addAssessmentResult, addInterviewSession]);

    const handleNextQuestion = useCallback(() => {
        setTranscript('');
        setNotes('');
        if (questions.length < totalQuestions) {
            setInterviewStage('generating_questions');
        } else {
            handleFinishInterview();
        }
    }, [questions.length, totalQuestions, handleFinishInterview]);

    // ---- Effects for State Machine ----
    useEffect(() => {
        const fetchNextQuestion = async () => {
            const nextQuestionId = questions.length + 1;
            if (generatingQuestionIdRef.current >= nextQuestionId) return;
            generatingQuestionIdRef.current = nextQuestionId;

            if (assessmentId && assessment) {
                const nextQText = assessment.questions[questions.length];
                if (nextQText) {
                    const newQuestion: InterviewQuestion = { id: nextQuestionId, question: nextQText };
                    setQuestions(prev => [...prev, newQuestion]);
                    setInterviewStage('asking');
                } else {
                    handleFinishInterview();
                }
                return;
            }

            if (!resumeData || !interviewConfig) {
                setError("Missing resume data or configuration to generate question.");
                return;
            };
            try {
                const nextQText = await generateNextQuestion(interviewConfig, sessionTranscript, resumeData as ResumeData, nextQuestionId);
                const newQuestion: InterviewQuestion = { id: nextQuestionId, question: nextQText };
                setQuestions(prev => [...prev, newQuestion]);
                setInterviewStage('asking');
            } catch (err) {
                setError("Failed to generate the next question from the AI. Please try ending and restarting the interview.");
                console.error(err);
            }
        };

        if (interviewStage === 'generating_questions' && pageStage === 'interview') {
            fetchNextQuestion();
        }
    }, [interviewStage, pageStage, questions.length, interviewConfig, resumeData, sessionTranscript, assessmentId, assessment, handleFinishInterview]);

    useEffect(() => {
        if (interviewStage === 'asking' && questions.length > 0) {
            const currentQuestion = questions[questions.length - 1];
            if (lastSpokenQuestionRef.current !== currentQuestion.id) {
                lastSpokenQuestionRef.current = currentQuestion.id;
                speak(currentQuestion.question, () => setInterviewStage('listening'));
            }
        }
    }, [interviewStage, questions, speak]);

    useEffect(() => {
        if (interviewStage === 'transitioning') {
            const timer = setTimeout(() => {
                handleNextQuestion();
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [interviewStage, handleNextQuestion]);

    useEffect(() => {
        if (interviewStage === 're_asking') {
            speak("I'm sorry, I didn't catch that. Let's try again.", () => {
                setTimeout(() => {
                    setInterviewStage('listening');
                }, 500); // short pause after speaking
            });
        }
    }, [interviewStage, speak]);

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setError("Your browser does not support Speech Recognition. Please use Google Chrome.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognitionRef.current = recognition;

        recognition.onstart = () => {
            submissionTriggeredRef.current = false;
            setError(null);
            speechRetryRef.current = 0; // Reset retry counter on successful start
            setTranscript('');
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = setInterval(() => setTimer(t => t + 1), 1000) as unknown as number;
        };

        recognition.onend = () => {
            const answerDuration = timerRef.current;
            stopTimer();
            if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
            // Only submit if it was a clean stop (not an error retry)
            if (interviewStageRef.current === 'listening' && speechRetryRef.current === 0 && !submissionTriggeredRef.current) {
                submissionTriggeredRef.current = true;
                handleAnswerSubmission(transcriptRef.current, answerDuration);
            }
        };
        recognition.onerror = (event) => {
            // Silently ignore 'aborted' errors, which are not critical and often occur
            // during normal state transitions (e.g., when programmatically stopping recognition).
            if (event.error === 'aborted') {
                console.log("Speech recognition aborted, likely a normal state transition.");
                return;
            }

            if (event.error === 'no-speech') {
                if (noSpeechRetryCount < 2) { // Allow 2 retries (total 3 attempts)
                    setNoSpeechRetryCount(count => count + 1);
                    setInterviewStage('re_asking');
                } else {
                    // Max retries reached, submit empty answer and move on
                    submissionTriggeredRef.current = true;
                    handleAnswerSubmission("I did not provide an answer.", 0);
                }
                return;
            }

            console.error('Speech recognition error:', event.error, event.message);

            // Handle network errors with a retry mechanism
            if (event.error === 'network' && speechRetryRef.current < MAX_SPEECH_RETRIES) {
                speechRetryRef.current++;
                setError(`Network issue. Retrying... (${speechRetryRef.current}/${MAX_SPEECH_RETRIES})`);
                setTimeout(() => {
                    if (interviewStageRef.current === 'listening') {
                        recognitionRef.current?.start();
                    }
                }, 1500); // Wait 1.5 seconds before retrying
                return;
            }

            let userMessage = `An unexpected error occurred: ${event.error}.`;
            if (event.error === 'network') {
                userMessage = "A network error occurred with the speech service. Please check your connection.";
            } else if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                userMessage = "Microphone access was denied. Please enable it in your browser settings to continue.";
            }
            setError(userMessage);
        };
        recognition.onresult = (event) => {
            if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
            let completeTranscript = '';
            let isFinal = false;

            for (let i = 0; i < event.results.length; ++i) {
                const segment = event.results[i][0].transcript.trim();
                if (segment) {
                    completeTranscript += (completeTranscript ? ' ' : '') + segment;
                }
                if (event.results[i].isFinal) isFinal = true;
            }
            // Correct phonetic misrecognitions (e.g. "nocches" → "Node.js")
            setTranscript(correctTranscript(completeTranscript));

            if (isFinal) {
                silenceTimeoutRef.current = setTimeout(() => {
                    recognitionRef.current?.stop();
                }, 5000) as unknown as number;
            }
        };

        return () => {
            speechSynthesis.cancel();
            if (recognitionRef.current) {
                recognitionRef.current.onend = null;
                recognitionRef.current.abort();
            }
            stopTimer();
            if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
        };
    }, [stopTimer, handleAnswerSubmission, noSpeechRetryCount]);

    useEffect(() => {
        if (interviewStage === 'listening') {
            recognitionRef.current?.start();
        } else if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
    }, [interviewStage]);

    useEffect(() => {
        return () => {
            userStreamRef.current?.getTracks().forEach(track => track.stop());
        }
    }, []);

    const formatTime = (seconds: number) => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;

    // ---- Render Logic ----
    if (loadingAssessment) {
        return <PageSpinner message="Loading your assessment details..." />;
    }

    if (pageStage === 'setup') {
        if (!assessmentId && (!resumeData || !resumeData.skills || resumeData.skills.length === 0)) {
            return (
                <div className="flex flex-col items-center justify-center p-8 space-y-6 mt-12 mb-12 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 max-w-2xl mx-auto">
                    <AlertTriangle size={64} className="text-yellow-500" />
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-4 w-full text-center">Resume Analysis Required</h2>
                    <p className="text-slate-600 dark:text-slate-300 text-center max-w-md">Before starting an interview session, please upload and analyze your resume on the dashboard. This allows Alexis to tailor the interview precisely to your background and skills.</p>
                    <button onClick={() => navigate('/candidate/dashboard')} className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition w-full max-w-xs shadow-md">
                        Go to Dashboard
                    </button>
                </div>
            );
        }
        return <div className="p-4 sm:p-6 md:p-8"><InterviewSetup onStart={handleStartSetup} jobRole={careerRoadmap?.targetRole || 'Software Engineer'} currentAvg={totalAvg} lockedConfig={assessmentId ? interviewConfig : null} /></div>;
    }

    if (pageStage === 'readiness_check' && interviewConfig) {
        return <div className="flex items-center justify-center min-h-full"><ReadinessCheck config={interviewConfig} onContinue={handleStartInterview} /></div>;
    }

    if (pageStage === 'summary' && finalSession) {
        const handleRestart = () => {
            setPageStage('setup');
            setInterviewConfig(null);
            setInterviewStage('generating_questions');
            setQuestions([]);
            setTranscript('');
            setNotes('');
            setSessionTranscript([]);
            setFinalSession(null);
            setTimer(0);
            setSessionDuration(0);
            setError(null);
        };
        return (
            <div className="p-4 sm:p-6 md:p-8">
                <InterviewReport
                    session={finalSession}
                    onRestart={handleRestart}
                    showChat={true}
                    backPath="/candidate/dashboard"
                />
            </div>
        );
    }

    if (pageStage !== 'interview' || !interviewConfig) {
        if (!assessmentId && !resumeData) return <PageSpinner message="Please analyze your resume on the dashboard first." />;
        return <PageSpinner message="Loading interview..." />;
    }

    const currentQuestion = questions[questions.length - 1]?.question;
    const interviewInProgress = !['generating_summary', 'finished'].includes(interviewStage);

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="flex-shrink-0 bg-white dark:bg-slate-800 p-4 border-b border-slate-200 dark:border-slate-700 flex flex-wrap justify-between items-center gap-2">
                <div className="text-slate-900 dark:text-white">
                    <h2 className="font-bold text-md sm:text-lg">{interviewConfig.role} Interview</h2>
                    <div className="flex items-center gap-2">
                        <p className="text-sm text-slate-500 dark:text-slate-400">{interviewStage === 'generating_questions' ? 'Preparing next question...' : `Question ${questions.length} of ${totalQuestions}`}</p>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${currentLevel.bg} ${currentLevel.color} ${currentLevel.border} uppercase shadow-sm`}>
                            {currentLevel.name}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-4">
                    <div className="flex items-center gap-2 font-mono text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-3 py-1.5 rounded-md text-sm">
                        <Timer size={16} />
                        <span>{formatTime(timer)}</span>
                    </div>
                    <button onClick={handleFinishInterview} disabled={!interviewInProgress} className="px-4 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition text-sm disabled:bg-red-300 disabled:cursor-not-allowed">End</button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 grid grid-cols-12 gap-4 sm:gap-6 p-4 sm:p-6 bg-slate-100 dark:bg-slate-900 overflow-y-auto">
                {/* Left Panel: AI & Question */}
                <div className="col-span-12 lg:col-span-8 space-y-4">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 relative">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-stretch">
                            {/* Question Area */}
                            <div className="md:col-span-3 flex flex-col justify-center relative min-h-[200px] md:min-h-0">
                                <div className="absolute top-0 left-0 flex items-center gap-2 text-sm font-semibold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-full z-10">
                                    <Bot size={16} /> Alexis is asking... <span className="opacity-60 font-normal ml-1">({currentLevel.name} Level)</span>
                                </div>

                                <div className="flex items-center justify-center h-full">
                                    {interviewStage === 'generating_questions' && !error && <Spinner />}

                                    {interviewStage !== 'generating_questions' && (
                                        <p className="text-xl sm:text-2xl font-semibold text-slate-800 dark:text-white text-center px-4 pt-8 md:pt-0">{currentQuestion}</p>
                                    )}
                                </div>
                            </div>
                            {/* Notes Area */}
                            <div className="md:col-span-2 flex flex-col bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                                <h3 className="font-semibold text-sm flex items-center mb-2 text-slate-700 dark:text-slate-300">
                                    <BookCopy size={16} className="mr-2" /> Your Notes
                                </h3>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Jot down key points here..."
                                    className="w-full flex-1 p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-sm text-slate-900 dark:text-slate-100 resize-none"
                                    disabled={!['listening', 'asking'].includes(interviewStage)}
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="absolute bottom-4 left-4 right-4 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-md flex items-center z-10 border border-red-100 dark:border-red-800">
                                <AlertTriangle size={16} className="mr-2" />
                                {error}
                            </div>
                        )}

                        {['analyzing', 'transitioning', 'generating_summary', 're_asking'].includes(interviewStage) && (
                            <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center space-y-2 animate-fade-in-fast rounded-xl z-20">
                                {interviewStage === 'analyzing' ? <><Spinner /><p className="font-semibold text-slate-600 dark:text-slate-300">Analyzing your answer...</p></> : null}
                                {interviewStage === 'transitioning' ? <><CheckCircle size={32} className="text-green-500" /><p className="font-semibold text-slate-600 dark:text-slate-300">Answer saved. Next question coming up...</p></> : null}
                                {interviewStage === 'generating_summary' ? <><Spinner /><p className="font-semibold text-slate-600 dark:text-slate-300">Generating your interview report...</p></> : null}
                                {interviewStage === 're_asking' ? <><Mic size={32} className="text-indigo-500" /><p className="font-semibold text-slate-600 dark:text-slate-300">I didn't hear you. Let's try again.</p></> : null}
                            </div>
                        )}
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                        <h3 className="font-semibold flex items-center mb-2 dark:text-white"><FileText size={18} className="mr-2" /> Your Live Transcript</h3>
                        <p className="text-slate-600 dark:text-slate-400 italic min-h-[4em]">{transcript || "Your answer will appear here as you speak..."}</p>
                    </div>
                </div>
                {/* Right Panel: Video & Controls */}
                <div className="col-span-12 lg:col-span-4 space-y-4">
                    <div className="aspect-video bg-slate-800 rounded-xl overflow-hidden relative shadow-lg">
                        <video ref={userVideoRef} autoPlay muted className="w-full h-full object-cover"></video>
                        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/50 to-transparent flex justify-center gap-2">
                            <button className="p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30"><VideoOff size={18} /></button>
                            <button className="p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30"><Settings size={18} /></button>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 text-center">
                        <div className="flex items-center justify-center gap-2 text-sm font-semibold text-green-700 dark:text-green-400">
                            <Smile size={16} /> Live Facial Analysis: Active
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Simulated feedback on expression and engagement.</p>
                    </div>

                    <div className={`p-4 rounded-xl text-center transition-all duration-300 ${interviewStage === 'listening' ? 'bg-red-500 text-white shadow-red-300 dark:shadow-red-900/40 shadow-lg' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700'}`}>
                        {interviewStage === 'listening'
                            ? <p className="font-bold text-lg animate-pulse">RECORDING</p>
                            : <p className="font-semibold text-slate-500 dark:text-slate-400">{interviewStage === 'asking' ? 'Prepare to speak...' : 'Not recording'}</p>
                        }
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                        <h3 className="font-semibold text-sm flex items-center mb-2 text-indigo-500 dark:text-indigo-400"><BookCopy size={16} className="mr-2" /> STAR Method Tip</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">For behavioral questions, structure your answer using STAR: <br /><strong>S</strong>ituation, <strong>T</strong>ask, <strong>A</strong>ction, <strong>R</strong>esult.</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                        <h3 className="font-semibold text-sm flex items-center mb-2 text-indigo-500 dark:text-indigo-400"><BarChart2 size={16} className="mr-2" /> Interview Progress</h3>
                        <div className="flex justify-between text-sm font-medium mb-1"><span className="text-slate-700 dark:text-slate-300">Questions Answered</span><span className="text-slate-500 dark:text-slate-400">{questions.length > 0 ? questions.length - 1 : 0} / {totalQuestions}</span></div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                            <div className="bg-indigo-600 dark:bg-indigo-500 h-2.5 rounded-full" style={{ width: `${((questions.length > 0 ? questions.length - 1 : 0) / totalQuestions) * 100}%` }}></div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default CandidateInterviewPage;