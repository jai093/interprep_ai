import { Request, Response, NextFunction } from 'express';
import Assessment from '../models/Assessment';
import AssessmentResult from '../models/AssessmentResult';
import { Types } from 'mongoose';

export const getPublicAssessment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { assessmentId } = req.params;

        if (!Types.ObjectId.isValid(assessmentId)) {
            res.status(400).json({ error: 'Invalid assessment ID' });
            return;
        }

        const assessment = await Assessment.findById(assessmentId);

        if (!assessment) {
            res.status(404).json({ error: 'Assessment not found' });
            return;
        }

        // Return only necessary public info
        const publicData = {
            id: assessment._id,
            jobRole: assessment.jobRole,
            questions: assessment.questions,
            config: assessment.config, // Careful: this might contain prompt/system info if not omitted in model
        };

        res.status(200).json(publicData);
    } catch (error) {
        next(error);
    }
};

export const submitAssessmentResult = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { assessmentId } = req.params;
        const { candidateName, candidateEmail, session, candidateUser } = req.body;

        if (!Types.ObjectId.isValid(assessmentId)) {
            res.status(400).json({ error: 'Invalid assessment ID' });
            return;
        }

        if (!candidateName || !candidateEmail || !session) {
            res.status(400).json({ error: 'Missing required fields' });
            return;
        }

        const assessment = await Assessment.findById(assessmentId);
        if (!assessment) {
            res.status(404).json({ error: 'Assessment not found' });
            return;
        }

        const result = new AssessmentResult({
            assessment: assessmentId,
            candidateName,
            candidateEmail,
            candidateUser: candidateUser || undefined, // Optional
            session,
        });

        await result.save();

        res.status(201).json({
            message: 'Assessment result submitted successfully',
            resultId: result._id,
        });
    } catch (error) {
        next(error);
    }
};

export const getAssessmentResultsPublic = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        // This endpoint seems suspicious for a public API. 
        // Usually, candidates shouldn't see all results for an assessment.
        // It might be intended for a candidate to fetch their SPECIFIC result?
        // Or maybe checking if they already took it?
        // For now, to satisfy the route requirement without exposing data,
        // I will implement a "Not Implemented" or check for a specific result ID/Token.
        // Given the route is `/:assessmentId/results` (plural), it matches `getAssessmentResults` in recruiter controller.
        // I'll return 403 Forbidden for now as a safe default for a public route 
        // unless we know for sure what it's for. 
        // Wait, maybe it's for the candidate dashboard to see *their* previous results?
        // But there's no auth middleware on public routes usually.
        // Let's implement it to return "Not Implemented" / stub.

        res.status(501).json({ error: 'Public results access not implemented' });
    } catch (error) {
        next(error);
    }
};
