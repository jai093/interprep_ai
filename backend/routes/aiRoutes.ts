import { Router } from 'express';
import {
    parseResume,
    generateRoadmap,
    generateInterviewQuestion,
    getInterviewFeedback,
    generateInterviewSummary,
    getFollowUpAnswer,
    generateAssessmentQuestions,
    startCoachingSession,
    getCoachingResponse,
    generateFillBlank,
    generateFormalPair,
    analyzeSentence,
    generateRepetitionSentence,
    analyzeRepetition,
    generateSpeakingTopic,
    analyzeSpeaking,
    getAiStatus,
    generateTTS,
} from '../controllers/aiController';

const router = Router();

// Status
router.get('/status', getAiStatus);

// Resume & Career
router.post('/parse-resume', parseResume);
router.post('/generate-roadmap', generateRoadmap);

// Interview
router.post('/interview/question', generateInterviewQuestion);
router.post('/interview/feedback', getInterviewFeedback);
router.post('/interview/summary', generateInterviewSummary);
router.post('/interview/followup', getFollowUpAnswer);

// Text-to-Speech
router.post('/speak', generateTTS);

// Assessment
router.post('/assessment/questions', generateAssessmentQuestions);

// Coaching
router.post('/coach/start', startCoachingSession);
router.post('/coach/respond', getCoachingResponse);

// Communication
router.post('/communication/fill-blank', generateFillBlank);
router.post('/communication/formal-pair', generateFormalPair);
router.post('/communication/analyze-sentence', analyzeSentence);
router.post('/communication/repetition-sentence', generateRepetitionSentence);
router.post('/communication/analyze-repetition', analyzeRepetition);
router.post('/communication/speaking-topic', generateSpeakingTopic);
router.post('/communication/analyze-speaking', analyzeSpeaking);

export default router;
