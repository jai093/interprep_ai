import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import AssessmentSession from '../models/AssessmentSession';
import Assessment from '../models/Assessment';
import { generateNextQuestion, evaluateResponse, generateReport } from '../services/aiService';
import { JWTPayload } from '../utils/auth';

// Extend Request interface to include user from middleware
interface AuthRequest extends Request {
  user?: JWTPayload;
}

// --- Legacy Stubs (to fix build) ---
export const getPublicAssessment = async (req: Request, res: Response) => {
  res.status(501).json({ error: 'Functionality migrated to AI Engine' });
};
export const submitAssessmentResult = async (req: Request, res: Response) => {
  res.status(501).json({ error: 'Functionality migrated to AI Engine' });
};
export const getAssessmentResultsPublic = async (req: Request, res: Response) => {
  res.status(501).json({ error: 'Functionality migrated to AI Engine' });
};
// -----------------------------------

export const startAssessment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { assessmentId } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify assessment exists
    const assessment = await Assessment.findById(assessmentId);
    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    // Create Session
    const session = await AssessmentSession.create({
      assessmentId,
      candidateId: userId,
      status: 'in-progress',
      transcript: [],
      responses: [],
      metadata: {
        startedAt: new Date(),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour expiry
      },
    });

    // Generate First Question
    const firstQuestion = await generateNextQuestion({
      jobRole: assessment.jobRole,
      transcript: [],
    });

    // Record AI Question
    session.transcript.push({
      sender: 'ai',
      content: firstQuestion,
      timestamp: new Date(),
    });
    await session.save();

    res.status(201).json({
      sessionId: session._id,
      question: firstQuestion,
    });
  } catch (error) {
    next(error);
  }
};

export const submitAnswer = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { sessionId, answer } = req.body;
    const userId = req.user?.userId;

    const session = await AssessmentSession.findById(sessionId).populate('assessmentId');
    if (!session || session.candidateId.toString() !== userId) {
      return res.status(404).json({ error: 'Session not found or unauthorized' });
    }

    if (session.status !== 'in-progress') {
      return res.status(400).json({ error: 'Assessment is already completed or expired' });
    }

    // 1. Record User Answer
    session.transcript.push({
      sender: 'user',
      content: answer,
      timestamp: new Date(),
    });

    // 2. Identify the last question asked by AI
    const lastAiMsg = [...session.transcript].reverse().find(t => t.sender === 'ai');
    const currentQuestion = lastAiMsg ? lastAiMsg.content : "Tell me about yourself.";

    // 3. Evaluate Answer
    const evaluation = await evaluateResponse(
      currentQuestion,
      answer,
      (session.assessmentId as any).jobRole
    );

    session.responses.push({
      questionId: new Types.ObjectId().toString(),
      questionText: currentQuestion,
      answerText: answer,
      evaluation: evaluation,
      timestamp: new Date()
    });

    // 4. Generate Next Question or Finish
    const MAX_QUESTIONS = 5;
    if (session.responses.length >= MAX_QUESTIONS) {
      session.status = 'completed';
      session.metadata.completedAt = new Date();

      // Calculate Metrics
      const totalScore = session.responses.reduce((sum, r) => sum + (r.evaluation?.score || 0), 0);
      session.metrics.overallScore = totalScore / session.responses.length;

      // AI Report Generation
      const aiReports = await generateReport(
        (session.assessmentId as any).jobRole,
        session.transcript,
        session.responses.map(r => r.evaluation!)
      );

      session.metrics.strengths = aiReports.metrics.strengths;
      session.metrics.weaknesses = aiReports.metrics.weaknesses;
      session.metrics.communicationScore = aiReports.metrics.communicationScore;

      // Store reports in session (casting to any since Schema update deferred)
      (session as any).candidateReport = aiReports.candidateReport;
      (session as any).recruiterReport = aiReports.recruiterReport;

      await session.save();
      return res.json({
        status: 'completed',
        message: 'Assessment Completed',
        nextQuestion: null
      });
    }

    const nextQuestion = await generateNextQuestion({
      jobRole: (session.assessmentId as any).jobRole,
      transcript: session.transcript
    });

    session.transcript.push({
      sender: 'ai',
      content: nextQuestion,
      timestamp: new Date()
    });

    await session.save();

    res.json({
      status: 'in-progress',
      nextQuestion
    });

  } catch (error) {
    next(error);
  }
};

export const getSession = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.params;
    const session = await AssessmentSession.findById(sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    res.json(session);
  } catch (error) {
    next(error);
  }
};
