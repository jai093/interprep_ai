import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PageSpinner } from '../components/Spinner';
import { useAppContext } from '../context/AppContext';
import { startCoachingSession, getCoachingResponse } from '../services/geminiService';
import type { CoachChatMessage, CoachingResponse, SpeechRecognition } from '../types';
import { Sparkles, Mic, AlertTriangle, Send, Bot, User } from 'lucide-react';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

const CandidateCoachPage: React.FC = () => {
    const { user } = useAppContext();
    const [conversation, setConversation] = useState<CoachChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [error, setError] = useState('');
    const recognitionRef = useRef<SpeechRecognition | null>(null);

    const isCandidateTurn = conversation.length > 0 && conversation[conversation.length - 1].message.includes('________');

    const fetchInitialDialogue = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        setError('');
        try {
            const initialScript = await startCoachingSession(user.name);
            const lines = initialScript.split('\n').filter(line => line.trim() !== '');
            const initialMessages: CoachChatMessage[] = lines.map(line => {
                const [speaker, ...messageParts] = line.split(': ');
                const message = messageParts.join(': ');
                return {
                    speaker: speaker as 'HR' | 'Candidate',
                    message,
                };
            });
            setConversation(initialMessages);
        } catch (e) {
            setError('Could not start a coaching session. The AI model may be unavailable.');
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchInitialDialogue();

        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = true;
            recognition.lang = 'en-US';
            
            recognition.onresult = (event) => {
                 let finalTranscript = '';
                 for (let i = event.resultIndex; i < event.results.length; ++i) {
                     finalTranscript += event.results[i][0].transcript;
                 }
                 setTranscript(finalTranscript);
            };
            
            recognition.onend = () => setIsRecording(false);
            
            recognition.onerror = (e) => {
                 if (e.error === 'not-allowed') {
                    setError("Microphone permission denied. Please allow microphone access in your browser settings to use this feature.");
                 } else {
                    setError(`Speech recognition error: ${e.error}. Please try again.`);
                 }
                 setIsRecording(false);
            };
            recognitionRef.current = recognition;
        }

    }, [fetchInitialDialogue]);

    const handleRecord = () => {
        if (isRecording) {
            recognitionRef.current?.stop();
        } else {
            setError('');
            setTranscript('');
            setIsRecording(true);
            recognitionRef.current?.start();
        }
    };

    const handleSubmitAnswer = async () => {
        if (!transcript.trim()) {
            setError('Please record an answer first.');
            return;
        }
        
        setIsLoading(true);
        setError('');
        
        // Update conversation with user's answer
        const updatedConversation = [...conversation];
        const lastMessage = updatedConversation[updatedConversation.length - 1];
        lastMessage.message = lastMessage.message.replace('________', transcript);
        
        setConversation(updatedConversation);
        
        try {
            const { feedback, nextQuestion } = await getCoachingResponse(updatedConversation, transcript);
            
            const feedbackMessage: CoachChatMessage = {
                speaker: 'Feedback',
                message: 'Here is my analysis:',
                feedback
            };
            
            const nextQuestionMessage: CoachChatMessage = {
                speaker: 'HR',
                message: nextQuestion
            };
            
            const candidatePrompt: CoachChatMessage = {
                speaker: 'Candidate',
                message: '________'
            };

            setConversation(prev => [...prev, feedbackMessage, nextQuestionMessage, candidatePrompt]);

        } catch (e) {
            setError('Could not get feedback. The AI model may be unavailable.');
            console.error(e);
        } finally {
            setIsLoading(false);
            setTranscript('');
        }
    };


    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            <div>
                 <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center">
                    <Sparkles size={28} className="mr-3 text-indigo-600" />
                    AI Interview Coach
                </h1>
                 <p className="text-slate-600 mt-1">Practice with a scenario-based HR conversation.</p>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
                {isLoading && conversation.length === 0 && <PageSpinner message="Starting session..." />}
                {error && <p className="text-red-500 text-center p-4 bg-red-50 rounded-lg">{error}</p>}

                {conversation.map((entry, index) => {
                    if (entry.speaker === 'Feedback' && entry.feedback) {
                        return (
                             <div key={index} className="p-4 rounded-lg bg-indigo-50 border border-indigo-200 animate-fade-in">
                                <h3 className="font-semibold text-indigo-800 flex items-center mb-2"><Bot size={18} className="mr-2"/>Coach's Analysis</h3>
                                <div className="space-y-3 text-sm">
                                    <p><strong>Corrected Version:</strong> <em className="text-slate-700">"{entry.feedback.correctedVersion}"</em></p>
                                    <p><strong>Explanation:</strong> {entry.feedback.explanation}</p>
                                    <details className="cursor-pointer">
                                        <summary className="font-semibold text-indigo-600">View Detailed Breakdown</summary>
                                        <ul className="list-disc list-inside pl-2 mt-1 text-slate-600">
                                            <li><strong>Grammar:</strong> {entry.feedback.analysis.grammar}</li>
                                            <li><strong>Clarity:</strong> {entry.feedback.analysis.clarity}</li>
                                            <li><strong>Professionalism:</strong> {entry.feedback.analysis.professionalism}</li>
                                            <li><strong>Tone:</strong> {entry.feedback.analysis.tone}</li>
                                        </ul>
                                    </details>
                                </div>
                            </div>
                        );
                    }
                    
                    const isHR = entry.speaker === 'HR';
                    
                    return (
                        <div key={index} className={`flex items-start gap-3 ${isHR ? '' : 'ml-4'}`}>
                            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white ${isHR ? 'bg-indigo-500' : 'bg-slate-400'}`}>
                                {isHR ? <Bot size={18}/> : <User size={18}/>}
                            </div>
                            <div className={`p-3 rounded-lg ${isHR ? 'bg-slate-100' : 'bg-green-50'}`}>
                                <p className={`font-semibold text-sm ${isHR ? 'text-slate-800' : 'text-slate-600'}`}>{isHR ? 'HR Manager' : 'Candidate'}</p>
                                <p className="text-slate-700">{entry.message}</p>
                            </div>
                        </div>
                    );
                })}
                 {isLoading && conversation.length > 0 && <div className="flex justify-center"><PageSpinner message="Thinking..." /></div>}
            </div>

            {isCandidateTurn && !isLoading && (
                 <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-200 space-y-4 sticky bottom-4">
                    <h3 className="font-semibold text-lg text-slate-800 text-center">Your turn to answer</h3>
                    <div className="flex items-center gap-4">
                        <button onClick={handleRecord} className={`p-4 rounded-full transition-colors ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
                            <Mic size={24} />
                        </button>
                        <div className="flex-1 p-3 bg-slate-50 border rounded-lg min-h-[50px]">
                            <p className="text-slate-600 italic">{transcript || "Your transcribed answer will appear here..."}</p>
                        </div>
                        <button onClick={handleSubmitAnswer} disabled={!transcript.trim() || isLoading} className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition flex items-center disabled:bg-slate-300">
                            <Send size={16} className="mr-2"/> Submit
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CandidateCoachPage;
