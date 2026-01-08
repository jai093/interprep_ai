import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../services/apiClient';
import { Bot, User as UserIcon, Send, Clock, AlertCircle } from 'lucide-react';

interface TranscriptItem {
    sender: 'ai' | 'user';
    content: string;
    timestamp: Date;
}

const AssessmentRunnerPage: React.FC = () => {
    const { assessmentId } = useParams<{ assessmentId: string }>();
    const navigate = useNavigate();
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [messages, setMessages] = useState<TranscriptItem[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isInitializing, setIsInitializing] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const initSession = async () => {
            try {
                if (!assessmentId) return;
                const res = await apiClient.startAssessment(assessmentId);
                setSessionId(res.sessionId);
                setMessages([{
                    sender: 'ai',
                    content: res.question,
                    timestamp: new Date()
                }]);
            } catch (err: any) {
                console.error('Failed to start assessment:', err);
                setError(err.message || 'Failed to start assessment');
            } finally {
                setIsInitializing(false);
            }
        };

        initSession();
    }, [assessmentId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async () => {
        if (!input.trim() || !sessionId || isLoading) return;

        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { sender: 'user', content: userMsg, timestamp: new Date() }]);
        setIsLoading(true);

        try {
            const res = await apiClient.submitAnswer(sessionId, userMsg);

            if (res.status === 'completed') {
                navigate('/assessment/complete');
                return;
            }

            setMessages(prev => [...prev, { sender: 'ai', content: res.nextQuestion, timestamp: new Date() }]);
        } catch (err: any) {
            console.error('Failed to submit answer:', err);
            setError(err.message || 'Failed to submit answer');
        } finally {
            setIsLoading(false);
        }
    };

    if (isInitializing) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-64px)]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-gray-500">Initializing AI Interviewer...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-3xl mx-auto mt-10 p-6 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center text-red-700 mb-2">
                    <AlertCircle className="w-5 h-5 mr-2" />
                    <h2 className="text-lg font-semibold">Error</h2>
                </div>
                <p className="text-red-600">{error}</p>
                <button
                    onClick={() => navigate('/candidate/dashboard')}
                    className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                    Return to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto h-[calc(100vh-100px)] flex flex-col p-4">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-t-xl shadow-sm border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <div>
                    <h1 className="text-lg font-semibold text-gray-900 dark:text-white">AI Technical Interview</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Live Session</p>
                </div>
                <div className="flex items-center text-gray-500 text-sm">
                    <Clock className="w-4 h-4 mr-1" />
                    <span>In Progress</span>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900 space-y-6">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex max-w-[80%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                            <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${msg.sender === 'user' ? 'bg-indigo-100 ml-2' : 'bg-gray-200 mr-2'
                                }`}>
                                {msg.sender === 'user' ? <UserIcon className="w-5 h-5 text-indigo-600" /> : <Bot className="w-5 h-5 text-gray-600" />}
                            </div>
                            <div className={`p-4 rounded-2xl shadow-sm ${msg.sender === 'user'
                                ? 'bg-indigo-600 text-white rounded-tr-none'
                                : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-200 dark:border-gray-700'
                                }`}>
                                <p className="whitespace-pre-wrap">{msg.content}</p>
                            </div>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="flex max-w-[80%] flex-row">
                            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-200 mr-2 flex items-center justify-center">
                                <Bot className="w-5 h-5 text-gray-600" />
                            </div>
                            <div className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-tl-none">
                                <div className="flex space-x-2">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-b-xl shadow-sm border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-2">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage();
                            }
                        }}
                        placeholder="Type your answer here..."
                        className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-transparent dark:text-white resize-none h-[50px] max-h-[150px]"
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={!input.trim() || isLoading}
                        className="p-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
                <p className="text-xs text-gray-400 mt-2 text-center">Press Enter to send, Shift+Enter for new line</p>
            </div>
        </div>
    );
};

export default AssessmentRunnerPage;
