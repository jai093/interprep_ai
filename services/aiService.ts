import apiClient, { API_URL } from './apiClient';
import type {
    ResumeData, CareerRoadmap, InterviewFeedback, InterviewSummary,
    InterviewSession, FillBlankQuestion, FormalInformalPair,
    DictionaryModeFeedback, RepetitionFeedback, SpeakingTaskAnalysis,
    CoachingResponse, CoachChatMessage, InterviewConfig, TranscriptEntry
} from '../types';

// All AI calls go through the backend — no API keys in the frontend.

export const parseResume = async (resumeText: string): Promise<ResumeData> => {
    return apiClient.request<ResumeData>('/ai/parse-resume', 'POST', { resumeText });
};

export const generateRoadmap = async (skills: string[], targetRole: string): Promise<CareerRoadmap> => {
    return apiClient.request<CareerRoadmap>('/ai/generate-roadmap', 'POST', { skills, targetRole });
};

export const generateNextQuestion = async (
    config: InterviewConfig, history: TranscriptEntry[], resume: ResumeData, questionCount: number
): Promise<string> => {
    const result = await apiClient.request<{ question: string }>('/ai/interview/question', 'POST', {
        config, history, resume, questionCount,
    });
    return result.question;
};

export const getInterviewFeedback = async (question: string, answer: string): Promise<InterviewFeedback> => {
    return apiClient.request<InterviewFeedback>('/ai/interview/feedback', 'POST', { question, answer });
};

export const generateInterviewSummary = async (sessionFeedback: InterviewFeedback[]): Promise<InterviewSummary> => {
    return apiClient.request<InterviewSummary>('/ai/interview/summary', 'POST', { sessionFeedback });
};

export const getFollowUpAnswer = async (session: InterviewSession, userQuestion: string): Promise<string> => {
    const result = await apiClient.request<{ answer: string }>('/ai/interview/followup', 'POST', { session, userQuestion });
    return result.answer;
};

export const generateAssessmentQuestions = async (
    jobRole: string,
    interviewType: 'Behavioral' | 'Technical' | 'Role-Specific',
    difficulty: 'Easy' | 'Medium' | 'Hard',
    numberOfQuestions: number = 5
): Promise<string[]> => {
    const result = await apiClient.request<{ questions: string[] }>('/ai/assessment/questions', 'POST', {
        jobRole, interviewType, difficulty, numberOfQuestions,
    });
    return result.questions;
};

export const generateTTSAudio = async (text: string, voice: string = 'en-US'): Promise<string> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const token = apiClient.getAccessToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_URL}/api/ai/speak`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ text, voice })
    });

    if (!response.ok) {
        throw new Error(`Failed to generate TTS audio: ${response.statusText}`);
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);
};

// --- AI Coach (Scenario-based) Functions ---

export const startCoachingSession = async (candidateName: string): Promise<string> => {
    const result = await apiClient.request<{ script: string }>('/ai/coach/start', 'POST', { candidateName });
    return result.script;
};

export const getCoachingResponse = async (
    conversationHistory: CoachChatMessage[], latestAnswer: string
): Promise<{ feedback: CoachingResponse; nextQuestion: string }> => {
    return apiClient.request('/ai/coach/respond', 'POST', { conversationHistory, latestAnswer });
};

// --- Communication Coach Functions ---

export const generateFillBlankQuestion = async (difficulty: 'Easy' | 'Medium' | 'Hard'): Promise<FillBlankQuestion> => {
    return apiClient.request<FillBlankQuestion>('/ai/communication/fill-blank', 'POST', { difficulty });
};

export const generateFormalInformalPair = async (difficulty: 'Easy' | 'Medium' | 'Hard'): Promise<FormalInformalPair> => {
    return apiClient.request<FormalInformalPair>('/ai/communication/formal-pair', 'POST', { difficulty });
};

export const analyzeDictionarySentence = async (formalWord: string, userSentence: string): Promise<DictionaryModeFeedback> => {
    return apiClient.request<DictionaryModeFeedback>('/ai/communication/analyze-sentence', 'POST', { formalWord, userSentence });
};

export const generateRepetitionSentence = async (difficulty: 'Easy' | 'Medium' | 'Hard'): Promise<string> => {
    const result = await apiClient.request<{ sentence: string }>('/ai/communication/repetition-sentence', 'POST', { difficulty });
    return result.sentence;
};

export const analyzeRepetition = async (originalSentence: string, userTranscript: string): Promise<RepetitionFeedback> => {
    return apiClient.request<RepetitionFeedback>('/ai/communication/analyze-repetition', 'POST', { originalSentence, userTranscript });
};

export const generateSpeakingTopic = async (difficulty: 'Easy' | 'Medium' | 'Hard'): Promise<string> => {
    const result = await apiClient.request<{ topic: string }>('/ai/communication/speaking-topic', 'POST', { difficulty });
    return result.topic;
};

export const analyzeSpeakingTask = async (topic: string, userTranscript: string): Promise<SpeakingTaskAnalysis> => {
    return apiClient.request<SpeakingTaskAnalysis>('/ai/communication/analyze-speaking', 'POST', { topic, userTranscript });
};
