import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PageSpinner } from '../components/Spinner';
import {
    generateFillBlankQuestion,
    generateFormalInformalPair,
    analyzeDictionarySentence,
    generateRepetitionSentence,
    analyzeRepetition,
    generateSpeakingTopic,
    analyzeSpeakingTask
} from '../services/geminiService';
import {
    CheckCircle, XCircle, Puzzle, BookOpenCheck, Voicemail, Timer, Mic, Play, RefreshCw, Volume2, Send, AlertTriangle, Lightbulb
} from 'lucide-react';
// FIX: Import SpeechRecognition type with an alias to avoid naming conflicts.
import type {
    FillBlankQuestion,
    FormalInformalPair,
    DictionaryModeFeedback,
    RepetitionFeedback,
    SpeakingTaskAnalysis,
    SpeechRecognition as SpeechRecognitionType
} from '../types';

// --- Speech Recognition & Synthesis Setup ---
// FIX: Removed local Speech Recognition type definitions to use centralized ones from types.ts.
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
type Difficulty = 'Easy' | 'Medium' | 'Hard';

const getNextDifficulty = (current: Difficulty, isCorrect: boolean): Difficulty => {
    if (isCorrect) {
        if (current === 'Easy') return 'Medium';
        if (current === 'Medium') return 'Hard';
    } else {
        if (current === 'Hard') return 'Medium';
        if (current === 'Medium') return 'Easy';
    }
    return current;
}


// --- Module Components ---

const FillTheBlankModule: React.FC = () => {
    const [question, setQuestion] = useState<FillBlankQuestion | null>(null);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [difficulty, setDifficulty] = useState<Difficulty>('Easy');

    const fetchQuestion = useCallback(async (currentDifficulty: Difficulty) => {
        setIsLoading(true);
        setSelectedAnswer(null);
        setError('');
        try {
            const data = await generateFillBlankQuestion(currentDifficulty);
            // Shuffle options for variety
            data.options.sort(() => Math.random() - 0.5);
            setQuestion(data);
        } catch (e) {
            setError('Could not load a new question. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchQuestion(difficulty);
    }, [fetchQuestion, difficulty]);

    const handleSelect = (option: string) => {
        if (!selectedAnswer) {
            setSelectedAnswer(option);
        }
    };

    const handleNextQuestion = () => {
        if (!question || !selectedAnswer) {
            // If no answer selected, just refetch with same difficulty (skip)
            fetchQuestion(difficulty);
            return;
        }

        const isCorrect = selectedAnswer === question.correctAnswer;
        // This will trigger the useEffect to fetch the next question with the new difficulty
        setDifficulty(d => getNextDifficulty(d, isCorrect));
    };
    
    if (isLoading) return <PageSpinner message="Loading exercise..." />;

    return (
        <div className="space-y-4">
            {error && <p className="text-red-500 text-center">{error}</p>}
            {question && (
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <p className="text-lg text-slate-600 mb-4">Complete the sentence with the most professional option:</p>
                    <p className="text-xl font-semibold text-center text-slate-800 bg-slate-50 p-4 rounded-lg">
                        "{question.sentence.replace('___', '[BLANK]')}"
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
                        {question.options.map(option => {
                            const isSelected = selectedAnswer === option;
                            const isCorrect = option === question.correctAnswer;
                            let buttonClass = 'bg-white hover:bg-slate-100 border-slate-300';
                            if (selectedAnswer) {
                                if(isCorrect) buttonClass = 'bg-green-100 border-green-400 text-green-800';
                                else if (isSelected) buttonClass = 'bg-red-100 border-red-400 text-red-800';
                                else buttonClass = 'bg-slate-50 border-slate-200 text-slate-500';
                            }
                            return (
                                <button key={option} onClick={() => handleSelect(option)} disabled={!!selectedAnswer}
                                    className={`p-4 rounded-lg border-2 font-semibold transition text-center ${buttonClass}`}>
                                    {option}
                                </button>
                            );
                        })}
                    </div>
                    {selectedAnswer && (
                        <div className={`p-4 rounded-lg animate-fade-in ${selectedAnswer === question.correctAnswer ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                            {selectedAnswer === question.correctAnswer ? 
                                <p className="font-semibold text-green-700 flex items-center"><CheckCircle size={20} className="mr-2"/> Correct!</p> :
                                <p className="font-semibold text-red-700 flex items-center"><XCircle size={20} className="mr-2"/> Not quite. The best answer is "{question.correctAnswer}".</p>
                            }
                             <p className="text-sm text-slate-700 mt-2">{question.explanation}</p>
                        </div>
                    )}
                 </div>
            )}
            <div className="text-center">
                 <button onClick={handleNextQuestion} className="px-5 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition flex items-center mx-auto">
                    <RefreshCw size={16} className="mr-2"/>Next Question
                </button>
            </div>
        </div>
    );
};

const DictionaryModeModule: React.FC = () => {
    const [pair, setPair] = useState<FormalInformalPair | null>(null);
    const [feedback, setFeedback] = useState<DictionaryModeFeedback | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [error, setError] = useState('');
    const [difficulty, setDifficulty] = useState<Difficulty>('Easy');
    const recognitionRef = useRef<SpeechRecognitionType | null>(null);

    const fetchPair = useCallback(async (currentDifficulty: Difficulty) => {
        setIsLoading(true);
        setFeedback(null);
        setTranscript('');
        setError('');
        try {
            const data = await generateFormalInformalPair(currentDifficulty);
            setPair(data);
        } catch (e) {
            setError('Could not load a new word pair. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPair(difficulty);
        
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = 'en-US';
            recognition.onresult = (event) => {
                const speechResult = event.results[0][0].transcript;
                setTranscript(speechResult);
                handleSubmit(speechResult);
            };
            recognition.onend = () => setIsRecording(false);
            recognition.onerror = (e) => {
                 // FIX: Provide a more user-friendly error message for permission denial.
                 if (e.error === 'not-allowed') {
                    setError("Microphone permission denied. Please allow microphone access in your browser settings to use this feature.");
                 } else {
                    setError(`Speech recognition error: ${e.error}. Please try again.`);
                 }
                 setIsRecording(false);
            }
            recognitionRef.current = recognition;
        }
    }, [fetchPair, difficulty]);

    const handleRecord = () => {
        if (isRecording) {
            recognitionRef.current?.stop();
        } else {
            setError('');
            setTranscript('');
            setFeedback(null);
            setIsRecording(true);
            recognitionRef.current?.start();
        }
    };
    
    const handleSubmit = async (text: string) => {
        if(!pair) return;
        setIsAnalyzing(true);
        try {
            const data = await analyzeDictionarySentence(pair.formal, text);
            setFeedback(data);
            setDifficulty(d => getNextDifficulty(d, data.isCorrect));
        } catch(e) {
            setError('Could not analyze your sentence. Please try again.');
        } finally {
            setIsAnalyzing(false);
        }
    }

    return (
        <div className="space-y-4">
             <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <p className="text-lg text-slate-600 mb-4">Use the <span className="font-bold text-indigo-600">formal word</span> in a professional sentence.</p>
                {isLoading && !pair && <PageSpinner message="Loading..." />}
                 {pair && (
                     <div className="grid grid-cols-2 gap-4 text-center">
                        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                            <p className="text-sm font-semibold text-red-700">Informal</p>
                            <p className="text-xl font-bold text-red-900">{pair.informal}</p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                            <p className="text-sm font-semibold text-green-700">Formal</p>
                            <p className="text-xl font-bold text-green-900">{pair.formal}</p>
                        </div>
                     </div>
                 )}
                 <div className="text-center mt-6">
                    <button onClick={handleRecord} disabled={!SpeechRecognition || isRecording || isAnalyzing} className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center w-60 mx-auto ${ isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-slate-400'}`}>
                        <Mic size={20} className="mr-2"/>
                        {isRecording ? 'Recording...' : 'Speak Your Sentence'}
                    </button>
                    {!SpeechRecognition && <p className="text-xs text-red-500 mt-2">Speech recognition is not supported in your browser.</p>}
                 </div>

                 {transcript && (
                     <div className="mt-4">
                        <p className="font-semibold text-slate-700">You said:</p>
                        <p className="p-3 bg-slate-100 border rounded-lg text-slate-800 italic">"{transcript}"</p>
                    </div>
                 )}
                 
                 {isAnalyzing && <div className="mt-4"><PageSpinner message="Analyzing..." /></div>}

                 {feedback && (
                     <div className={`mt-4 p-4 rounded-lg animate-fade-in ${feedback.isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                         <p className={`font-semibold ${feedback.isCorrect ? 'text-green-700' : 'text-red-700'} flex items-center`}>
                            {feedback.isCorrect ? <CheckCircle size={20} className="mr-2"/> : <XCircle size={20} className="mr-2"/>}
                            {feedback.isCorrect ? 'Excellent usage!' : 'Needs Improvement'}
                         </p>
                         <p className="text-sm text-slate-700 mt-2">{feedback.overallFeedback}</p>
                         <details className="text-sm mt-2 cursor-pointer">
                            <summary className="font-semibold text-indigo-600">Show detailed breakdown</summary>
                            <ul className="list-disc list-inside pl-2 mt-1 text-slate-600 space-y-1">
                                <li><strong>Grammar:</strong> {feedback.analysis.grammar}</li>
                                <li><strong>Context:</strong> {feedback.analysis.context}</li>
                                <li><strong>Professionalism:</strong> {feedback.analysis.professionalism}</li>
                                <li><strong>Word Usage:</strong> {feedback.analysis.formalWordAnalysis}</li>
                            </ul>
                         </details>
                         <p className="text-sm text-slate-700 mt-2 font-semibold">Example: <span className="italic font-normal">"{feedback.exampleSentence}"</span></p>
                    </div>
                 )}
            </div>
            <div className="text-center">
                 <button onClick={() => fetchPair(difficulty)} className="px-5 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition flex items-center mx-auto">
                    <RefreshCw size={16} className="mr-2"/>Next Word
                </button>
            </div>
        </div>
    );
};

const VoiceRepetitionModule: React.FC = () => {
    const [sentence, setSentence] = useState('');
    const [feedback, setFeedback] = useState<RepetitionFeedback | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [error, setError] = useState('');
    const [difficulty, setDifficulty] = useState<Difficulty>('Easy');
    const [hasListened, setHasListened] = useState(false);
    const recognitionRef = useRef<SpeechRecognitionType | null>(null);

    const speak = useCallback((text: string) => {
        speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onend = () => setHasListened(true);
        speechSynthesis.speak(utterance);
    }, []);

    const fetchSentence = useCallback(async (currentDifficulty: Difficulty) => {
        setIsLoading(true);
        setFeedback(null);
        setTranscript('');
        setError('');
        setHasListened(false);
        try {
            const data = await generateRepetitionSentence(currentDifficulty);
            setSentence(data);
        } catch (e) {
            setError('Could not load a new sentence. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSentence(difficulty);
         if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = 'en-US';
            recognition.onresult = (event) => {
                const speechResult = event.results[0][0].transcript;
                setTranscript(speechResult);
                handleSubmit(speechResult);
            };
            recognition.onend = () => setIsRecording(false);
            recognition.onerror = (e) => {
                // FIX: Provide a more user-friendly error message for permission denial.
                if (e.error === 'not-allowed') {
                    setError("Microphone permission denied. Please allow microphone access in your browser settings to use this feature.");
                } else {
                    setError(`Speech recognition error: ${e.error}. Please try again.`);
                }
                setIsRecording(false);
            }
            recognitionRef.current = recognition;
        }
    }, [fetchSentence, difficulty]);

     const handleRecord = () => {
        if (!isRecording) {
            setError('');
            setTranscript('');
            setFeedback(null);
            setIsRecording(true);
            recognitionRef.current?.start();
        }
    };
    
    const handleSubmit = async (text: string) => {
        setIsLoading(true);
        try {
            const data = await analyzeRepetition(sentence, text);
            setFeedback(data);
            setDifficulty(d => getNextDifficulty(d, data.isCorrect));
        } catch(e) {
             setError('Could not analyze your speech. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }

    const hasAttempted = !!transcript;

    return (
        <div className="space-y-4">
             <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <p className="text-lg text-slate-600 mb-4">Listen to the sentence, then repeat it exactly.</p>
                {isLoading && !sentence && <PageSpinner message="Loading..." />}
                
                {hasAttempted && sentence && (
                    <div className="mb-4 animate-fade-in">
                        <p className="font-semibold text-slate-700">Original sentence:</p>
                        <p className="p-3 bg-slate-100 border rounded-lg text-slate-800 text-lg font-medium">"{sentence}"</p>
                    </div>
                )}

                <div className="flex items-center justify-center gap-4 my-6">
                    <button onClick={() => speak(sentence)} disabled={isLoading || isRecording} className="p-4 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition disabled:bg-slate-400">
                        <Volume2 size={24}/>
                    </button>
                    <button onClick={handleRecord} disabled={!SpeechRecognition || isRecording || isLoading || !hasListened || hasAttempted} className="px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center w-60 bg-green-600 text-white hover:bg-green-700 disabled:bg-slate-400 disabled:cursor-not-allowed">
                        <Mic size={20} className="mr-2"/>
                        {isRecording ? 'Listening...' : 'Record Repetition'}
                    </button>
                </div>

                 {transcript && (
                     <div className="mt-4">
                        <p className="font-semibold text-slate-700">Your repetition:</p>
                        <p className="p-3 bg-slate-100 border rounded-lg text-slate-800 italic">"{transcript}"</p>
                    </div>
                 )}
                 {isLoading && transcript && <div className="mt-4"><PageSpinner message="Analyzing..." /></div>}
                 {feedback && (
                     <div className={`mt-4 p-4 rounded-lg animate-fade-in ${feedback.isCorrect ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                         <p className={`font-semibold ${feedback.isCorrect ? 'text-green-700' : 'text-yellow-700'} flex items-center`}>
                            {feedback.isCorrect ? <CheckCircle size={20} className="mr-2"/> : <AlertTriangle size={20} className="mr-2"/>}
                            {feedback.isCorrect ? 'Perfect Match!' : 'Good Attempt'}
                         </p>
                         <p className="text-sm text-slate-700 mt-2">{feedback.feedback}</p>
                         <div className="grid grid-cols-2 gap-4 mt-4 text-center">
                            <div className="bg-white p-2 rounded-lg border">
                                <p className="text-sm font-semibold text-slate-600">Clarity Score</p>
                                <p className="text-2xl font-bold text-indigo-600">{feedback.clarityScore}%</p>
                            </div>
                             <div className="bg-white p-2 rounded-lg border">
                                <p className="text-sm font-semibold text-slate-600">Fluency Score</p>
                                <p className="text-2xl font-bold text-indigo-600">{feedback.fluencyScore}%</p>
                            </div>
                         </div>
                    </div>
                 )}
            </div>
            <div className="text-center">
                 <button onClick={() => fetchSentence(difficulty)} className="px-5 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition flex items-center mx-auto">
                    <RefreshCw size={16} className="mr-2"/>Next Sentence
                </button>
            </div>
        </div>
    );
};

const SpeakingTaskModule: React.FC = () => {
    const [topic, setTopic] = useState('');
    const [analysis, setAnalysis] = useState<SpeakingTaskAnalysis | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRecording, setIsRecording] = useState(false);
    const [timeLeft, setTimeLeft] = useState(30);
    const [transcript, setTranscript] = useState('');
    const [error, setError] = useState('');
    const [difficulty, setDifficulty] = useState<Difficulty>('Easy');
    const recognitionRef = useRef<SpeechRecognitionType | null>(null);
    const timerRef = useRef<number | null>(null);

    const fetchTopic = useCallback(async (currentDifficulty: Difficulty) => {
        setIsLoading(true);
        setAnalysis(null);
        setTranscript('');
        setError('');
        try {
            const data = await generateSpeakingTopic(currentDifficulty);
            setTopic(data);
        } catch (e) {
            setError('Could not load a new topic. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const stopRecording = useCallback(() => {
        recognitionRef.current?.stop();
        if (timerRef.current) clearInterval(timerRef.current);
        setIsRecording(false);
        setTimeLeft(30);
    }, []);

    useEffect(() => {
        fetchTopic(difficulty);
         if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';
            recognition.onresult = (event) => {
                 let finalTranscript = '';
                 for (let i = event.resultIndex; i < event.results.length; ++i) {
                     finalTranscript += event.results[i][0].transcript;
                 }
                 setTranscript(finalTranscript);
            };
            recognition.onend = () => stopRecording();
            recognition.onerror = (e) => {
                 // FIX: Provide a more user-friendly error message for permission denial.
                 if (e.error === 'not-allowed') {
                    setError("Microphone permission denied. Please allow microphone access in your browser settings to use this feature.");
                 } else {
                    setError(`Speech recognition error: ${e.error}. Please try again.`);
                 }
                 stopRecording();
            }
            recognitionRef.current = recognition;
        }
    }, [fetchTopic, stopRecording, difficulty]);
    
    const handleRecord = () => {
        if (isRecording) {
            stopRecording();
        } else {
            setError('');
            setTranscript('');
            setAnalysis(null);
            setIsRecording(true);
            recognitionRef.current?.start();
            timerRef.current = window.setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        stopRecording();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
    };
    
    const handleSubmit = async () => {
        if(!transcript.trim()) {
            setError('Please record an answer before analyzing.');
            return;
        }
        setIsLoading(true);
        setError('');
        try {
            const data = await analyzeSpeakingTask(topic, transcript);
            setAnalysis(data);
            setDifficulty(d => getNextDifficulty(d, data.score >= 75));
        } catch(e) {
            setError('Could not analyze your speech. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }
    
    const radius = 54;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (timeLeft / 30) * circumference;

    return (
        <div className="space-y-4">
             <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <p className="text-lg text-slate-600 mb-2">Speak about the following topic for 30 seconds.</p>
                {isLoading && !topic && <PageSpinner message="Loading..." />}
                {topic && <p className="text-xl font-semibold text-center text-slate-800 bg-slate-50 p-4 rounded-lg">"{topic}"</p>}
                
                <div className="flex flex-col items-center justify-center gap-4 my-6">
                    <div className="relative w-32 h-32">
                        <svg className="w-full h-full" viewBox="0 0 120 120">
                            <circle cx="60" cy="60" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="12" />
                            <circle cx="60" cy="60" r={radius} fill="none" stroke="#4f46e5" strokeWidth="12"
                                strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
                                transform="rotate(-90 60 60)" className="transition-all duration-1000"/>
                        </svg>
                         <button onClick={handleRecord} className="absolute inset-0 flex items-center justify-center bg-slate-100 rounded-full text-indigo-600 font-bold text-3xl">
                            {isRecording ? timeLeft : <Mic size={32}/>}
                        </button>
                    </div>
                     <p className="text-sm font-semibold">{isRecording ? "Recording in progress..." : "Press the mic to start"}</p>
                </div>
                
                 {transcript && !analysis && (
                     <div className="mt-4 animate-fade-in">
                        <p className="font-semibold text-slate-700">Your transcript:</p>
                        <p className="p-3 bg-slate-100 border rounded-lg text-slate-800 text-sm">"{transcript}"</p>
                        <div className="text-center mt-4">
                            <button onClick={handleSubmit} disabled={isLoading} className="px-5 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition flex items-center mx-auto">
                                {isLoading ? "Analyzing..." : "Analyze My Speech"}
                            </button>
                        </div>
                    </div>
                 )}

                 {analysis && (
                     <div className="mt-4 p-4 rounded-lg bg-slate-50 border animate-fade-in">
                         <h3 className="font-bold text-xl text-slate-800">Analysis Report</h3>
                         <div className="text-center my-4">
                            <p className="font-semibold text-slate-500">Overall Score</p>
                            <p className="font-bold text-5xl text-indigo-600">{analysis.score}%</p>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm text-center mb-4">
                           {Object.entries(analysis.feedback).map(([key, value]) => (
                               <div key={key} className="bg-white p-2 rounded-md border">
                                   <p className="font-semibold capitalize text-slate-600">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                                   <p className="text-slate-800">{value}</p>
                               </div>
                           ))}
                        </div>
                         <div>
                            <p className="font-semibold text-slate-700">Actionable Improvements:</p>
                            <ul className="list-disc list-inside text-sm text-slate-600 space-y-1 mt-1">
                                {analysis.improvements.map((tip, i) => <li key={i}>{tip}</li>)}
                            </ul>
                        </div>
                    </div>
                 )}
            </div>
            <div className="text-center">
                 <button onClick={() => fetchTopic(difficulty)} className="px-5 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition flex items-center mx-auto">
                    <RefreshCw size={16} className="mr-2"/>New Topic
                </button>
            </div>
        </div>
    );
};


const CandidateCommunicationPage: React.FC = () => {
    type Module = 'fill-in-the-blank' | 'dictionary' | 'repetition' | 'speaking-task';
    const [currentModule, setCurrentModule] = useState<Module>('fill-in-the-blank');

    const modules: { id: Module; name: string; icon: React.ReactNode }[] = [
        { id: 'fill-in-the-blank', name: 'Fill-the-Blank', icon: <Puzzle size={18} /> },
        { id: 'dictionary', name: 'Dictionary Mode', icon: <BookOpenCheck size={18} /> },
        { id: 'repetition', name: 'Voice Repetition', icon: <Voicemail size={18} /> },
        { id: 'speaking-task', name: 'Speaking Task', icon: <Timer size={18} /> },
    ];
    
    return (
        <div className="space-y-6">
            <div>
                 <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Communication Skills Training</h1>
                 <p className="text-slate-600 mt-1">Hone your professional communication with these targeted exercises.</p>
                 {!SpeechRecognition && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm flex items-start">
                        <Lightbulb size={18} className="mr-2 flex-shrink-0 mt-0.5" />
                        <span>
                            <strong>Warning:</strong> Your browser does not support the Web Speech API required for voice exercises. The "Dictionary", "Repetition", and "Speaking" modules will not function correctly. Please use an updated version of Google Chrome for the best experience.
                        </span>
                    </div>
                 )}
            </div>

            <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-200">
                <nav className="flex flex-wrap items-center gap-2">
                    {modules.map(module => (
                        <button key={module.id} onClick={() => setCurrentModule(module.id)}
                            className={`flex-1 px-3 py-2.5 text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2
                            ${currentModule === module.id ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'}`}>
                            {module.icon}
                            <span>{module.name}</span>
                        </button>
                    ))}
                </nav>
            </div>
            
            <div className="animate-fade-in-fast">
                {currentModule === 'fill-in-the-blank' && <FillTheBlankModule />}
                {currentModule === 'dictionary' && <DictionaryModeModule />}
                {currentModule === 'repetition' && <VoiceRepetitionModule />}
                {currentModule === 'speaking-task' && <SpeakingTaskModule />}
            </div>
        </div>
    );
};

export default CandidateCommunicationPage;