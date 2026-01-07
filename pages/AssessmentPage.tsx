import React, { useState, useEffect, useCallback, useRef } from 'react';
// FIX: Use named imports for react-router-dom v6.
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { getInterviewFeedback, generateInterviewSummary } from '../services/geminiService';
import Spinner, { PageSpinner } from '../components/Spinner';
import { AlertTriangle, Timer, CheckCircle, Bot, Smile, User, Mic, Info, PlayCircle } from 'lucide-react';
// FIX: Import SpeechRecognition type to resolve reference error.
import type { Assessment, InterviewFeedback, InterviewSession, InterviewSummary, TranscriptEntry, InterviewConfig, Badge, SpeechRecognition } from '../types';

// Speech Recognition Types
// FIX: Removed local Speech Recognition type definitions to use centralized ones from types.ts. The type is now imported.
type PageStage = 'loading' | 'instructions' | 'device_setup' | 'interview' | 'submitting' | 'error';
type InterviewSubStage = 'asking' | 'listening' | 're_asking' | 'analyzing' | 'transitioning' | 'generating_summary' | 'finished';

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

const DeviceSetup: React.FC<{
    onStreamReady: (stream: MediaStream) => void;
    onStart: () => void;
}> = ({ onStreamReady, onStart }) => {
    const [devices, setDevices] = useState<{ cameras: MediaDeviceInfo[], mics: MediaDeviceInfo[] }>({ cameras: [], mics: [] });
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const getDevices = async () => {
            try {
                const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                setStream(mediaStream);
                onStreamReady(mediaStream);
                const allDevices = await navigator.mediaDevices.enumerateDevices();
                setDevices({
                    cameras: allDevices.filter(d => d.kind === 'videoinput'),
                    mics: allDevices.filter(d => d.kind === 'audioinput')
                });
            } catch (err: any) {
                console.error("Error accessing media devices.", err);
                if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                    setError("Permission to access camera and microphone was denied. Please enable access in your browser settings to continue.");
                } else {
                    setError("Could not access camera or microphone. Please ensure they are connected and not in use by another application.");
                }
            }
        };
        getDevices();
        return () => {
            // The stream is passed up, so the parent component is responsible for stopping it.
        };
    }, [onStreamReady]);

    useEffect(() => {
        if (stream && videoRef.current) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    const canStart = devices.cameras.length > 0 && devices.mics.length > 0;

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-2xl bg-white p-6 sm:p-10 rounded-xl shadow-lg border border-slate-200 space-y-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 text-center">Interview Setup</h1>
                <p className="text-center text-slate-600">Let's check your camera and microphone before you begin.</p>
                
                <div className="aspect-video bg-slate-800 rounded-lg overflow-hidden">
                    <video ref={videoRef} autoPlay muted className="w-full h-full object-cover"></video>
                </div>

                <div className="space-y-3">
                    <div className="p-3 bg-slate-50 rounded-lg flex items-center justify-between">
                        <p className="font-semibold text-sm flex items-center">
                            {devices.cameras.length > 0 ? <CheckCircle size={16} className="text-green-500 mr-2"/> : <AlertTriangle size={16} className="text-red-500 mr-2"/>}
                            Camera
                        </p>
                        <p className="text-xs text-slate-500">{devices.cameras.length > 0 ? devices.cameras[0].label : 'Not detected'}</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg flex items-center justify-between">
                        <p className="font-semibold text-sm flex items-center">
                             {devices.mics.length > 0 ? <CheckCircle size={16} className="text-green-500 mr-2"/> : <AlertTriangle size={16} className="text-red-500 mr-2"/>}
                             Microphone
                        </p>
                         <p className="text-xs text-slate-500">{devices.mics.length > 0 ? devices.mics[0].label : 'Not detected'}</p>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-800 text-sm p-3 rounded-md flex items-start">
                        <AlertTriangle size={18} className="mr-2 flex-shrink-0 mt-0.5" />
                        <span>{error}</span>
                    </div>
                )}


                <button 
                    onClick={onStart} 
                    disabled={!canStart || !!error}
                    className="w-full py-3 px-4 rounded-md shadow-sm text-xl font-semibold text-white bg-green-600 hover:bg-green-700 disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center justify-center"
                >
                   <PlayCircle size={22} className="mr-2"/> Start Interview
                </button>
            </div>
        </div>
    );
};


const InterviewUI: React.FC<{
    assessment: Assessment;
    userStream: MediaStream | null;
    onComplete: (session: InterviewSession) => void;
}> = ({ assessment, userStream, onComplete }) => {
    
    const [interviewStage, setInterviewStage] = useState<InterviewSubStage>('asking');
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [transcript, setTranscript] = useState('');
    const [sessionTranscript, setSessionTranscript] = useState<TranscriptEntry[]>([]);
    const [timer, setTimer] = useState(0);
    const [sessionDuration, setSessionDuration] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [noSpeechRetryCount, setNoSpeechRetryCount] = useState(0);

    // Voice Synthesis State & Logic
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    useEffect(() => {
        const loadVoices = () => {
            setVoices(speechSynthesis.getVoices());
        };
        speechSynthesis.onvoiceschanged = loadVoices;
        loadVoices();
        return () => {
            speechSynthesis.onvoiceschanged = null;
        };
    }, []);
    
    useEffect(() => {
        setNoSpeechRetryCount(0);
    }, [currentQuestionIndex]);

    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const timerIntervalRef = useRef<number | null>(null);
    const silenceTimeoutRef = useRef<number | null>(null);
    const userVideoRef = useRef<HTMLVideoElement>(null);
    const speechRetryRef = useRef(0);
    const submissionTriggeredRef = useRef(false);
    const MAX_SPEECH_RETRIES = 3;
    
    const transcriptRef = useRef('');
    useEffect(() => { transcriptRef.current = transcript; }, [transcript]);
    
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
    }, [voices]); // Depend on voices

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
        const currentQuestion = assessment.questions[currentQuestionIndex];
        try {
            const fb = await getInterviewFeedback(currentQuestion, answer);
            setSessionTranscript(prev => [...prev, { question: currentQuestion, answer, feedback: fb, duration }]);
        } catch (err) {
            console.error("Failed to get feedback:", err);
            const emptyFeedback: InterviewFeedback = {
                score: 0, responseQuality: 0, evaluation: { clarity: 'N/A', relevance: 'N/A', structure: 'N/A', confidence: 'N/A' },
                grammarCorrection: { hasErrors: false, explanation: 'Error analyzing.' }, professionalRewrite: answer,
                tips: [], alexisResponse: "Sorry, I couldn't process that.", wordCount: 0, fillerWords: 0, hasExample: false
            };
            setSessionTranscript(prev => [...prev, { question: currentQuestion, answer, feedback: emptyFeedback, duration }]);
        } finally {
            setInterviewStage('transitioning');
        }
    }, [assessment.questions, currentQuestionIndex]);
    
    const handleFinishInterview = useCallback(async () => {
        setInterviewStage('generating_summary');
        if (sessionTranscript.length === 0) {
            // Handle case where user ends interview without answering
            const dummySession: InterviewSession = {
                date: new Date().toISOString(), type: assessment.config.type, duration: 0, averageScore: 0,
                config: { ...assessment.config, role: assessment.jobRole }, transcript: [],
                summary: { overallSummary: 'Interview not completed.', actionableTips: [], encouragement: '', simulatedFacialExpressionAnalysis: 'N/A', simulatedBodyLanguageAnalysis: 'N/A', simulatedAudioAnalysis: 'N/A', badgesEarned: [] }
            };
            onComplete(dummySession);
            return;
        }
        try {
            const earnedBadges = evaluateBadges(sessionTranscript);
            const summaryData = await generateInterviewSummary(sessionTranscript.map(t => t.feedback));
            summaryData.badgesEarned = earnedBadges;

            const averageScore = sessionTranscript.reduce((acc, t) => acc + t.feedback.score, 0) / sessionTranscript.length;
            const sessionData: InterviewSession = {
                date: new Date().toISOString(),
                type: `${assessment.config.type} - ${assessment.jobRole}`,
                duration: Math.round(sessionDuration / 60),
                averageScore: Math.round(averageScore),
                config: { ...assessment.config, role: assessment.jobRole },
                transcript: sessionTranscript,
                summary: summaryData
            };
            onComplete(sessionData);
        } catch (err) {
            setError("Could not generate interview summary.");
            setInterviewStage('finished');
        }
    }, [sessionTranscript, assessment, sessionDuration, onComplete]);

    const handleNextQuestion = useCallback(() => {
        setTranscript('');
        if (currentQuestionIndex < assessment.questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            setInterviewStage('asking');
        } else {
            handleFinishInterview();
        }
    }, [currentQuestionIndex, assessment.questions.length, handleFinishInterview]);

    // Effects and media logic...
    useEffect(() => {
        if (interviewStage === 'asking' && assessment.questions.length > 0) {
            speak(assessment.questions[currentQuestionIndex], () => setInterviewStage('listening'));
        }
    }, [interviewStage, assessment.questions, currentQuestionIndex, speak]);

    useEffect(() => {
        if (interviewStage === 'transitioning') {
            const timer = setTimeout(() => handleNextQuestion(), 1500);
            return () => clearTimeout(timer);
        }
    }, [interviewStage, handleNextQuestion]);

    useEffect(() => {
        if (interviewStage === 're_asking') {
            speak("I'm sorry, I didn't catch that. Let's try that question again.", () => {
                setTimeout(() => {
                    setInterviewStage('listening');
                }, 500);
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
            speechRetryRef.current = 0; // Reset on successful start
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
                if (noSpeechRetryCount < 2) {
                    setNoSpeechRetryCount(count => count + 1);
                    setInterviewStage('re_asking');
                } else {
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
                userMessage = "A network error occurred. Please check your connection.";
            } else if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                userMessage = "Microphone access was denied. Please enable it in your browser settings.";
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
                 silenceTimeoutRef.current = setTimeout(() => { recognitionRef.current?.stop(); }, 5000) as unknown as number;
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
        if (userStream && userVideoRef.current) {
            userVideoRef.current.srcObject = userStream;
        }
    }, [userStream]);

    const formatTime = (seconds: number) => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-slate-50">
             <div className="flex-shrink-0 bg-white p-4 border-b border-slate-200 flex flex-wrap justify-between items-center gap-2">
                <div>
                    <h2 className="font-bold text-md sm:text-lg">{assessment.jobRole} Assessment</h2>
                    <p className="text-sm text-slate-500">Question {currentQuestionIndex + 1} of {assessment.questions.length}</p>
                </div>
                <div className="flex items-center gap-2 sm:gap-4">
                    <div className="flex items-center gap-2 font-mono text-slate-600 bg-slate-100 px-3 py-1.5 rounded-md text-sm">
                        <Timer size={16} />
                        <span>{formatTime(timer)}</span>
                    </div>
                    <button onClick={handleFinishInterview} className="px-4 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition text-sm">End</button>
                </div>
            </div>
            <div className="flex-1 grid grid-cols-12 gap-4 sm:gap-6 p-4 sm:p-6 overflow-y-auto">
                <div className="col-span-12 lg:col-span-8 space-y-4">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 relative min-h-[200px] flex flex-col items-center justify-center">
                        <div className="absolute top-4 left-4 flex items-center gap-2 text-sm font-semibold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full">
                            <Bot size={16}/> Alexis is asking...
                        </div>
                        <p className="text-xl sm:text-2xl font-semibold text-slate-800 text-center px-4 sm:px-8">{assessment.questions[currentQuestionIndex]}</p>
                        {error && <div className="absolute bottom-4 left-4 right-4 text-sm text-red-600 bg-red-50 p-3 rounded-md flex items-center"><AlertTriangle size={16} className="mr-2" />{error}</div>}
                        {['analyzing', 'transitioning', 'generating_summary', 're_asking'].includes(interviewStage) && (
                            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center space-y-2 animate-fade-in-fast">
                                {interviewStage === 'analyzing' && <><Spinner /><p className="font-semibold text-slate-600">Analyzing...</p></>}
                                {interviewStage === 'transitioning' && <><CheckCircle size={32} className="text-green-500"/><p className="font-semibold text-slate-600">Next question...</p></>}
                                {interviewStage === 'generating_summary' && <><Spinner /><p className="font-semibold text-slate-600">Generating report...</p></>}
                                {interviewStage === 're_asking' && <><Mic size={32} className="text-indigo-500" /><p className="font-semibold text-slate-600">I couldn't hear you. Let's try again.</p></>}
                            </div>
                        )}
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <p className="text-slate-600 italic min-h-[4em]">{transcript || "Your answer will appear here..."}</p>
                    </div>
                </div>
                <div className="col-span-12 lg:col-span-4 space-y-4">
                    <div className="aspect-video bg-slate-800 rounded-xl overflow-hidden relative shadow-lg">
                        <video ref={userVideoRef} autoPlay muted className="w-full h-full object-cover"></video>
                    </div>
                    <div className={`p-4 rounded-xl text-center transition-all duration-300 ${interviewStage === 'listening' ? 'bg-red-500 text-white shadow-red-300 shadow-lg' : 'bg-white'}`}>
                        {interviewStage === 'listening' ? <p className="font-bold text-lg animate-pulse">RECORDING</p> : <p className="font-semibold text-slate-500">Not recording</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}

const AssessmentPage: React.FC = () => {
    const { user, isLoading, assessments, addAssessmentResult } = useAppContext();
    const { assessmentId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const [assessment, setAssessment] = useState<Assessment | null>(null);
    const [pageStage, setPageStage] = useState<PageStage>('loading');
    const [candidateName, setCandidateName] = useState('');
    const [candidateEmail, setCandidateEmail] = useState('');
    const [error, setError] = useState('');
    const [userStream, setUserStream] = useState<MediaStream | null>(null);

    useEffect(() => {
        if (!isLoading) {
            if (!user) {
                // Not logged in, redirect to login page, preserving the destination
                navigate('/login', { state: { from: location }, replace: true });
                return;
            }

            if (user.role !== 'candidate') {
                // Logged-in user is not a candidate, send them to their dashboard
                navigate('/recruiter/dashboard', { replace: true });
                return;
            }

            // User is a logged-in candidate, proceed with assessment setup
            setCandidateName(user.name);
            setCandidateEmail(user.email);
            const foundAssessment = assessments.find(a => a.id === assessmentId);
            if (foundAssessment) {
                setAssessment(foundAssessment);
                setPageStage('instructions'); // Skip info_collect and go to instructions
            } else {
                setError("Assessment not found or invalid link.");
                setPageStage('error');
            }
        }
    }, [isLoading, user, navigate, location, assessments, assessmentId]);

    useEffect(() => {
        // Cleanup stream when component unmounts
        return () => {
            userStream?.getTracks().forEach(track => track.stop());
        }
    }, [userStream]);

    const handleInterviewComplete = (session: InterviewSession) => {
        if (!assessment) return;
        setPageStage('submitting');
        addAssessmentResult({
            assessmentId: assessment.id,
            candidateName,
            candidateEmail,
            session
        });
        navigate('/assessment/complete');
    };

    if (pageStage === 'loading') {
        return <PageSpinner message="Authenticating..." />;
    }

    if (pageStage === 'error') {
         return <div className="flex items-center justify-center h-screen"><p className="text-red-500">{error}</p></div>;
    }
    
    if (!assessment) {
        return <PageSpinner message="Loading assessment..." />;
    }
    
    if (pageStage === 'instructions') {
        return (
             <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 text-center">
                 <div className="w-full max-w-2xl bg-white p-6 sm:p-10 rounded-xl shadow-lg border border-slate-200 space-y-6">
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Assessment Instructions</h1>
                    <div className="text-left bg-slate-50 p-4 rounded-lg space-y-2">
                        <p><strong>Position:</strong> {assessment.jobRole}</p>
                        <p><strong>Type:</strong> {assessment.config.type}</p>
                        <p><strong>Number of Questions:</strong> {assessment.questions.length}</p>
                    </div>
                    <div className="text-left space-y-2 text-slate-600">
                        <p className="flex items-start"><Info size={18} className="mr-2 text-indigo-500 mt-1 flex-shrink-0" /><span>This is an AI-powered interview. Please ensure you are in a quiet environment with a stable internet connection.</span></p>
                        <p className="flex items-start"><Mic size={18} className="mr-2 text-indigo-500 mt-1 flex-shrink-0" /><span>You will be asked a series of questions. Your answers will be recorded and analyzed.</span></p>
                        <p className="flex items-start"><User size={18} className="mr-2 text-indigo-500 mt-1 flex-shrink-0" /><span>Please enable your camera and microphone when prompted by the browser.</span></p>
                    </div>
                    <button onClick={() => setPageStage('device_setup')} className="w-full py-3 px-4 rounded-md shadow-sm text-xl font-semibold text-white bg-green-600 hover:bg-green-700 flex items-center justify-center">
                       <PlayCircle size={22} className="mr-2"/> Proceed to Setup
                    </button>
                 </div>
             </div>
        )
    }

    if (pageStage === 'device_setup') {
        return <DeviceSetup onStreamReady={setUserStream} onStart={() => setPageStage('interview')} />;
    }

    if (pageStage === 'interview') {
        return <InterviewUI assessment={assessment} userStream={userStream} onComplete={handleInterviewComplete} />;
    }
    
    if (pageStage === 'submitting') {
      return <PageSpinner message="Submitting your assessment..." />;
    }

    return null; // Should not be reached
};

export default AssessmentPage;
