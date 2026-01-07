import React, { useState, useEffect, useCallback, useRef } from 'react';
// FIX: Replaced `useHistory` with `useNavigate` for react-router-dom v6 compatibility.
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { generateNextQuestion, getInterviewFeedback, generateInterviewSummary } from '../services/geminiService';
import { assessmentService } from '../services/assessmentService';
import Spinner, { PageSpinner } from '../components/Spinner';
// FIX: Imported XCircle icon from lucide-react.
import { AlertTriangle, Lightbulb, Mic, Timer, CheckCircle, Bot, Star, FileText, BarChart, ChevronRight, Video, VideoOff, Settings, BookCopy, BarChart2, XCircle, Smile, User } from 'lucide-react';
// FIX: Import SpeechRecognition type to resolve reference error.
import type { InterviewQuestion, InterviewFeedback, InterviewSession, InterviewSummary, InterviewConfig, TranscriptEntry, Badge, SpeechRecognition, ResumeData } from '../types';
import InterviewReport from '../components/InterviewReport';

// Speech Recognition Types
// FIX: Removed local Speech Recognition type definitions to use centralized ones from types.ts. The type is now imported.
type PageStage = 'setup' | 'readiness_check' | 'interview' | 'summary';
type InterviewSubStage = 'generating_questions' | 'asking' | 'listening' | 're_asking' | 'analyzing' | 'transitioning' | 'generating_summary' | 'finished';

const TOTAL_QUESTIONS = 5;

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

const InterviewSetup: React.FC<{ onStart: (config: InterviewConfig) => void, jobRole: string }> = ({ onStart, jobRole }) => {
    const [config, setConfig] = useState<InterviewConfig>({ type: 'Behavioral', difficulty: 'Medium', persona: 'Neutral', role: jobRole });
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
        <div className="w-full max-w-5xl mx-auto space-y-8 animate-fade-in">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Practice Interview</h1>
                <p className="text-slate-600 mt-1">Configure your interview session to get started.</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                    {/* Interview Type */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <h2 className="text-xl font-semibold mb-4">Select Interview Type</h2>
                        <div className="flex flex-col sm:flex-row gap-2">
                            {(Object.keys(interviewTypeDetails) as Array<keyof typeof interviewTypeDetails>).map(type => (
                                <button key={type} onClick={() => setConfig(c => ({ ...c, type }))} className={`px-4 py-2 rounded-lg font-semibold transition w-full ${config.type === type ? 'bg-indigo-600 text-white' : 'bg-slate-100 hover:bg-slate-200'}`}>{type}</button>
                            ))}
                        </div>
                        <div className="mt-4 bg-slate-50 p-4 rounded-lg text-sm">
                            <p className="text-slate-700">{interviewTypeDetails[config.type].description}</p>
                            <div className="mt-2 text-slate-500">
                                <p className="font-semibold text-xs">Example Questions:</p>
                                <ul className="list-disc list-inside text-xs">
                                    {interviewTypeDetails[config.type].examples.map((ex, i) => <li key={i}>{ex}</li>)}
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Customization */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <h2 className="text-xl font-semibold mb-4">Interview Customization</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Difficulty Level</label>
                                <select value={config.difficulty} onChange={e => setConfig(c => ({ ...c, difficulty: e.target.value as any }))} className="w-full p-2 border border-slate-300 rounded-md">
                                    <option>Easy</option><option>Medium</option><option>Hard</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Interviewer Persona</label>
                                <select value={config.persona} onChange={e => setConfig(c => ({ ...c, persona: e.target.value as any }))} className="w-full p-2 border border-slate-300 rounded-md">
                                    <option>Neutral</option><option>Friendly</option><option>Strict</option>
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Job Role / Industry</label>
                                <input type="text" value={config.role} onChange={e => setConfig(c => ({ ...c, role: e.target.value }))} className="w-full p-2 border border-slate-300 rounded-md" />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="space-y-6">
                     {/* Device Setup */}
                     <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <h2 className="text-xl font-semibold mb-4">Device Setup</h2>
                        {deviceError && (
                            <div className="bg-red-50 border border-red-200 text-red-800 text-sm p-3 rounded-md mb-4 flex items-start">
                                <AlertTriangle size={18} className="mr-2 flex-shrink-0 mt-0.5" />
                                <span>{deviceError}</span>
                            </div>
                        )}
                        <div className="space-y-4">
                             <div className="p-3 bg-slate-50 rounded-lg">
                                <p className="font-semibold text-sm flex items-center">{devices.cameras.length > 0 ? <CheckCircle size={16} className="text-green-500 mr-2"/> : <AlertTriangle size={16} className="text-red-500 mr-2"/>} Camera</p>
                                <p className="text-xs text-slate-500 pl-6">{devices.cameras.length > 0 ? devices.cameras[0].label : 'Camera not connected'}</p>
                            </div>
                             <div className="p-3 bg-slate-50 rounded-lg">
                                <p className="font-semibold text-sm flex items-center">{devices.mics.length > 0 ? <CheckCircle size={16} className="text-green-500 mr-2"/> : <AlertTriangle size={16} className="text-red-500 mr-2"/>} Microphone</p>
                                <p className="text-xs text-slate-500 pl-6">{devices.mics.length > 0 ? devices.mics[0].label : 'Microphone not connected'}</p>
                            </div>
                            <div className="aspect-video bg-slate-800 rounded-lg overflow-hidden">
                                <video ref={videoRef} autoPlay muted className="w-full h-full object-cover"></video>
                            </div>
                        </div>
                    </div>
                    <button onClick={() => onStart(config)} disabled={!!deviceError} className="w-full px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition shadow-lg text-lg disabled:bg-indigo-300 disabled:cursor-not-allowed">Start Interview</button>
                </div>
            </div>
        </div>
    );
};

const ReadinessCheck: React.FC<{ config: InterviewConfig, onContinue: () => void }> = ({ config, onContinue }) => (
    <div className="w-full max-w-2xl mx-auto text-center space-y-6 animate-fade-in p-4">
        <h1 className="text-3xl font-bold text-slate-900">Interview Setup</h1>
        <div className="bg-white p-8 rounded-xl shadow-xl border border-slate-200 space-y-4">
            <p className="text-slate-600">Ensure your camera and background are ready before you begin. You will enter the interview after pressing the button below.</p>
            <div className="text-left bg-slate-50 p-4 rounded-lg space-y-2">
                <p><strong>Position:</strong> {config.role}</p>
                <p><strong>Type:</strong> {config.type}</p>
                <p><strong>Difficulty:</strong> {config.difficulty}</p>
            </div>
             <button onClick={onContinue} className="w-full px-8 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition shadow-lg text-lg">Enter Interview</button>
        </div>
    </div>
);

const CandidateInterviewPage: React.FC = () => {
    const { resumeData, careerRoadmap, addInterviewSession, userProfile } = useAppContext();
    // FIX: Replaced `useHistory` with `useNavigate` for react-router-dom v6 compatibility.
    const navigate = useNavigate();
    
    // Overall Page State
    const [pageStage, setPageStage] = useState<PageStage>('setup');
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

    // Voice Synthesis State & Logic
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    useEffect(() => {
        const loadVoices = () => {
            setVoices(speechSynthesis.getVoices());
        };
        // The 'voiceschanged' event is the correct way to wait for voices to load.
        speechSynthesis.onvoiceschanged = loadVoices;
        loadVoices(); // Also call it once for browsers that load voices instantly.
        return () => {
            speechSynthesis.onvoiceschanged = null;
        };
    }, []);
    
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

    const speak = useCallback((text: string, onEndCallback?: () => void) => {
        speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        
        // --- Voice Selection Logic ---
        // Attempt to use the "Zephyr" voice if available, as requested from the Gemini API examples.
        // This voice is typically not available in browsers, so we have fallbacks.
        let alexisVoice: SpeechSynthesisVoice | undefined;
        
        const idealVoice = voices.find(voice => voice.name === 'Zephyr');
        
        if (idealVoice) {
            alexisVoice = idealVoice;
        } else {
            // If "Zephyr" is not found, fallback to high-quality voices.
            const preferredVoices = [
                'Google US English', 
                'Google UK English Female',
                'Microsoft Zira - English (United States)',
                'Microsoft Hazel - English (United Kingdom)',
                'Samantha',
            ];
            
            alexisVoice = voices.find(voice => preferredVoices.includes(voice.name));

            // Generic fallback to any English female voice
            if (!alexisVoice) {
                alexisVoice = voices.find(voice => voice.lang.startsWith('en-') && voice.name.toLowerCase().includes('female'));
            }
        }
        
        if (alexisVoice) {
            utterance.voice = alexisVoice;
            utterance.pitch = 1.05;
            utterance.rate = 1;
        }

        utterance.onend = onEndCallback;
        speechSynthesis.speak(utterance);
    }, [voices]); // Depend on the loaded voices
    
    // ---- Page Stage Transitions ----
    const handleStartSetup = (config: InterviewConfig) => {
        setInterviewConfig(config);
        setPageStage('readiness_check');
    };

    const handleStartInterview = async () => {
        setPageStage('interview');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            userStreamRef.current = stream;
            if (userVideoRef.current) userVideoRef.current.srcObject = stream;
            // The first question will be fetched by the 'generating_questions' useEffect
            setInterviewStage('generating_questions');
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
        setInterviewStage('generating_summary');

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
                }
            };
            setFinalSession(dummySession);
            setPageStage('summary');
            return;
        }

        try {
            const earnedBadges = evaluateBadges(sessionTranscript);
            const summaryData = await generateInterviewSummary(sessionTranscript.map(t => t.feedback));
            summaryData.badgesEarned = earnedBadges;
            
            const averageScore = sessionTranscript.reduce((acc, t) => acc + t.feedback.score, 0) / sessionTranscript.length;
            
            const sessionData: InterviewSession = {
                date: new Date().toISOString(),
                type: `${interviewConfig!.type} - ${interviewConfig!.role}`,
                duration: Math.round(sessionDuration / 60),
                averageScore: Math.round(averageScore),
                config: interviewConfig!,
                transcript: sessionTranscript,
                summary: summaryData
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

            setFinalSession(sessionData);
            setPageStage('summary');
        } catch (err) {
            setError("Could not generate interview summary.");
             setInterviewStage('finished');
        }
    }, [sessionTranscript, interviewConfig, sessionDuration]);

    const handleNextQuestion = useCallback(() => {
        setTranscript('');
        setNotes('');
        if (questions.length < TOTAL_QUESTIONS) {
            setInterviewStage('generating_questions');
        } else {
            handleFinishInterview();
        }
    }, [questions.length, handleFinishInterview]);

    // ---- Effects for State Machine ----
    useEffect(() => {
        const fetchNextQuestion = async () => {
            if (!resumeData || !interviewConfig) {
                setError("Missing resume data or configuration to generate question.");
                return;
            };
            try {
                const nextQText = await generateNextQuestion(interviewConfig, sessionTranscript, resumeData as ResumeData, questions.length + 1);
                const newQuestion: InterviewQuestion = { id: questions.length, question: nextQText };
                setQuestions(prev => [...prev, newQuestion]);
                setInterviewStage('asking');
            } catch (err) {
                setError("Failed to generate the next question from the AI. Please try ending and restarting the interview.");
                console.error(err);
            }
        };

        if (interviewStage === 'generating_questions') {
            fetchNextQuestion();
        }
    }, [interviewStage, questions.length, interviewConfig, resumeData, sessionTranscript]);

    useEffect(() => {
        if (interviewStage === 'asking' && questions.length > 0) {
            const currentQuestion = questions[questions.length - 1];
            speak(currentQuestion.question, () => setInterviewStage('listening'));
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
            let finalTranscript = '';
            let isFinal = false;
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                finalTranscript += event.results[i][0].transcript;
                if(event.results[i].isFinal) isFinal = true;
            }
            setTranscript(finalTranscript);

            if (isFinal) {
                 silenceTimeoutRef.current = setTimeout(() => {
                     recognitionRef.current?.stop();
                 }, 5000) as unknown as number;
            }
        };
        
        return () => {
            speechSynthesis.cancel();
            if(recognitionRef.current) {
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
    if (pageStage === 'setup') {
        return <div className="p-4 sm:p-6 md:p-8"><InterviewSetup onStart={handleStartSetup} jobRole={careerRoadmap?.targetRole || 'Software Engineer'}/></div>;
    }
    
    if (pageStage === 'readiness_check' && interviewConfig) {
        return <div className="flex items-center justify-center min-h-full"><ReadinessCheck config={interviewConfig} onContinue={handleStartInterview}/></div>;
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
        if (!resumeData) return <PageSpinner message="Please analyze your resume on the dashboard first." />;
        return <PageSpinner message="Loading interview..."/>;
    }
    
    const currentQuestion = questions[questions.length - 1]?.question;
    const interviewInProgress = !['generating_summary', 'finished'].includes(interviewStage);

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="flex-shrink-0 bg-white p-4 border-b border-slate-200 flex flex-wrap justify-between items-center gap-2">
                <div>
                    <h2 className="font-bold text-md sm:text-lg">{interviewConfig.role} Interview</h2>
                    <p className="text-sm text-slate-500">{interviewStage === 'generating_questions' ? 'Preparing next question...' : `Question ${questions.length} of ${TOTAL_QUESTIONS}`}</p>
                </div>
                <div className="flex items-center gap-2 sm:gap-4">
                    <div className="flex items-center gap-2 font-mono text-slate-600 bg-slate-100 px-3 py-1.5 rounded-md text-sm">
                        <Timer size={16} />
                        <span>{formatTime(timer)}</span>
                    </div>
                    <button onClick={handleFinishInterview} disabled={!interviewInProgress} className="px-4 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition text-sm disabled:bg-red-300 disabled:cursor-not-allowed">End</button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 grid grid-cols-12 gap-4 sm:gap-6 p-4 sm:p-6 bg-slate-100 overflow-y-auto">
                {/* Left Panel: AI & Question */}
                <div className="col-span-12 lg:col-span-8 space-y-4">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 relative">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-stretch">
                            {/* Question Area */}
                            <div className="md:col-span-3 flex flex-col justify-center relative min-h-[200px] md:min-h-0">
                                <div className="absolute top-0 left-0 flex items-center gap-2 text-sm font-semibold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full z-10">
                                    <Bot size={16}/> Alexis is asking...
                                </div>
                                
                                <div className="flex items-center justify-center h-full">
                                    {interviewStage === 'generating_questions' && !error && <Spinner />}

                                    {interviewStage !== 'generating_questions' && (
                                            <p className="text-xl sm:text-2xl font-semibold text-slate-800 text-center px-4 pt-8 md:pt-0">{currentQuestion}</p>
                                    )}
                                </div>
                            </div>
                            {/* Notes Area */}
                            <div className="md:col-span-2 flex flex-col bg-slate-50 p-3 rounded-lg border border-slate-200">
                                <h3 className="font-semibold text-sm flex items-center mb-2 text-slate-700">
                                    <BookCopy size={16} className="mr-2"/> Your Notes
                                </h3>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Jot down key points here..."
                                    className="w-full flex-1 p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-sm resize-none"
                                    disabled={!['listening', 'asking'].includes(interviewStage)}
                                />
                            </div>
                        </div>
                        
                        {error && (
                            <div className="absolute bottom-4 left-4 right-4 text-sm text-red-600 bg-red-50 p-3 rounded-md flex items-center z-10">
                                <AlertTriangle size={16} className="mr-2" />
                                {error}
                            </div>
                        )}
                        
                        {['analyzing', 'transitioning', 'generating_summary', 're_asking'].includes(interviewStage) && (
                            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center space-y-2 animate-fade-in-fast rounded-xl z-20">
                                {interviewStage === 'analyzing' ? <><Spinner /><p className="font-semibold text-slate-600">Analyzing your answer...</p></> : null}
                                {interviewStage === 'transitioning' ? <><CheckCircle size={32} className="text-green-500"/><p className="font-semibold text-slate-600">Answer saved. Next question coming up...</p></> : null}
                                {interviewStage === 'generating_summary' ? <><Spinner /><p className="font-semibold text-slate-600">Generating your interview report...</p></> : null}
                                {interviewStage === 're_asking' ? <><Mic size={32} className="text-indigo-500" /><p className="font-semibold text-slate-600">I didn't hear you. Let's try again.</p></> : null}
                            </div>
                        )}
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <h3 className="font-semibold flex items-center mb-2"><FileText size={18} className="mr-2"/> Your Live Transcript</h3>
                        <p className="text-slate-600 italic min-h-[4em]">{transcript || "Your answer will appear here as you speak..."}</p>
                    </div>
                </div>
                {/* Right Panel: Video & Controls */}
                <div className="col-span-12 lg:col-span-4 space-y-4">
                    <div className="aspect-video bg-slate-800 rounded-xl overflow-hidden relative shadow-lg">
                        <video ref={userVideoRef} autoPlay muted className="w-full h-full object-cover"></video>
                        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/50 to-transparent flex justify-center gap-2">
                             <button className="p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30"><VideoOff size={18}/></button>
                             <button className="p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30"><Settings size={18}/></button>
                        </div>
                    </div>
                    
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 text-center">
                         <div className="flex items-center justify-center gap-2 text-sm font-semibold text-green-700">
                            <Smile size={16}/> Live Facial Analysis: Active
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Simulated feedback on expression and engagement.</p>
                    </div>

                    <div className={`p-4 rounded-xl text-center transition-all duration-300 ${interviewStage === 'listening' ? 'bg-red-500 text-white shadow-red-300 shadow-lg' : 'bg-white'}`}>
                        {interviewStage === 'listening' 
                            ? <p className="font-bold text-lg animate-pulse">RECORDING</p>
                            : <p className="font-semibold text-slate-500">{interviewStage === 'asking' ? 'Prepare to speak...' : 'Not recording'}</p>
                        }
                    </div>

                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                        <h3 className="font-semibold text-sm flex items-center mb-2"><BookCopy size={16} className="mr-2 text-indigo-500"/> STAR Method Tip</h3>
                        <p className="text-xs text-slate-500">For behavioral questions, structure your answer using STAR: <br/><strong>S</strong>ituation, <strong>T</strong>ask, <strong>A</strong>ction, <strong>R</strong>esult.</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                        <h3 className="font-semibold text-sm flex items-center mb-2"><BarChart2 size={16} className="mr-2 text-indigo-500"/> Interview Progress</h3>
                         <div className="flex justify-between text-sm font-medium mb-1"><span className="text-slate-700">Questions Answered</span><span className="text-slate-500">{questions.length > 0 ? questions.length - 1 : 0} / {TOTAL_QUESTIONS}</span></div>
                         <div className="w-full bg-slate-200 rounded-full h-2.5">
                            <div className="bg-indigo-600 h-2.5 rounded-full" style={{width: `${((questions.length > 0 ? questions.length -1 : 0) / TOTAL_QUESTIONS) * 100}%`}}></div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default CandidateInterviewPage;